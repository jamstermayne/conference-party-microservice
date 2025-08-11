# Enterprise Infrastructure as Code
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

# Local values for resource naming and tagging
locals {
  environment = var.environment
  project_id  = var.project_id
  region      = var.primary_region
  
  # Resource naming convention
  name_prefix = "${var.project_name}-${local.environment}"
  
  # Common tags for all resources
  common_tags = {
    Environment   = local.environment
    Project       = var.project_name
    ManagedBy     = "terraform"
    Owner         = var.team_email
    CostCenter    = var.cost_center
    Compliance    = "SOC2,GDPR,HIPAA"
    BackupPolicy  = "daily"
    MonitoringTier = "critical"
  }
  
  # Security and compliance labels
  security_labels = {
    data_classification = "confidential"
    encryption_required = "true"
    audit_logging      = "enabled"
    backup_required    = "true"
    disaster_recovery  = "enabled"
  }
}

# Primary Google Cloud Provider
provider "google" {
  project = local.project_id
  region  = local.region
}

provider "google-beta" {
  project = local.project_id
  region  = local.region
}

# Random password generation for secure resources
resource "random_password" "master_encryption_key" {
  length  = 64
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_password" "database_password" {
  length  = 32
  special = true
}

#============================================================================
# NETWORKING INFRASTRUCTURE
#============================================================================

# VPC Network with proper segmentation
resource "google_compute_network" "main_vpc" {
  name                            = "${local.name_prefix}-vpc"
  auto_create_subnetworks        = false
  delete_default_routes_on_create = true
  routing_mode                   = "REGIONAL"

  depends_on = [google_project_service.compute_api]
}

# Primary subnet for main services
resource "google_compute_subnetwork" "primary_subnet" {
  name                     = "${local.name_prefix}-primary-subnet"
  network                  = google_compute_network.main_vpc.id
  ip_cidr_range           = var.primary_subnet_cidr
  region                  = local.region
  private_ip_google_access = true

  # Secondary IP ranges for services
  secondary_ip_range {
    range_name    = "services-range"
    ip_cidr_range = var.services_subnet_cidr
  }

  secondary_ip_range {
    range_name    = "pods-range"
    ip_cidr_range = var.pods_subnet_cidr
  }
}

# Private subnet for databases and sensitive services
resource "google_compute_subnetwork" "private_subnet" {
  name                     = "${local.name_prefix}-private-subnet"
  network                  = google_compute_network.main_vpc.id
  ip_cidr_range           = var.private_subnet_cidr
  region                  = local.region
  private_ip_google_access = true
}

# Cloud Router for NAT Gateway
resource "google_compute_router" "main_router" {
  name    = "${local.name_prefix}-router"
  network = google_compute_network.main_vpc.id
  region  = local.region
}

# NAT Gateway for outbound internet access
resource "google_compute_router_nat" "main_nat" {
  name                               = "${local.name_prefix}-nat"
  router                            = google_compute_router.main_router.name
  region                            = local.region
  nat_ip_allocate_option           = "MANUAL_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  nat_ips = [google_compute_address.nat_ip.self_link]

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Static IP for NAT Gateway
resource "google_compute_address" "nat_ip" {
  name   = "${local.name_prefix}-nat-ip"
  region = local.region
}

# External IP for Load Balancer
resource "google_compute_global_address" "lb_ip" {
  name = "${local.name_prefix}-lb-ip"
}

#============================================================================
# SECURITY INFRASTRUCTURE
#============================================================================

# Firewall rules with principle of least privilege
resource "google_compute_firewall" "allow_internal" {
  name    = "${local.name_prefix}-allow-internal"
  network = google_compute_network.main_vpc.id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.primary_subnet_cidr,
    var.private_subnet_cidr,
    var.services_subnet_cidr,
    var.pods_subnet_cidr
  ]

  target_tags = ["internal"]
}

# HTTPS traffic from load balancer
resource "google_compute_firewall" "allow_lb_to_instances" {
  name    = "${local.name_prefix}-allow-lb"
  network = google_compute_network.main_vpc.id

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"] # Google LB ranges
  target_tags   = ["http-server", "https-server"]
}

# SSH access (restricted to bastion hosts)
resource "google_compute_firewall" "allow_ssh" {
  name    = "${local.name_prefix}-allow-ssh"
  network = google_compute_network.main_vpc.id

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.admin_ip_range]
  target_tags   = ["ssh-access"]
}

# Health check firewall rule
resource "google_compute_firewall" "allow_health_check" {
  name    = "${local.name_prefix}-allow-health-check"
  network = google_compute_network.main_vpc.id

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
  target_tags   = ["health-check"]
}

#============================================================================
# DATABASE INFRASTRUCTURE
#============================================================================

# Cloud SQL PostgreSQL instance with high availability
resource "google_sql_database_instance" "primary_db" {
  name                = "${local.name_prefix}-db-primary"
  database_version    = "POSTGRES_14"
  region              = local.region
  deletion_protection = var.environment == "production" ? true : false

  settings {
    tier                        = var.database_tier
    availability_type           = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_size                   = var.database_disk_size
    disk_type                   = "SSD"
    disk_autoresize            = true
    disk_autoresize_limit      = var.database_max_disk_size

    # Backup configuration
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = local.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    # High availability and failover
    database_flags {
      name  = "log_statement"
      value = "all"
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }

    # Network configuration
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main_vpc.id
      enable_private_path_for_google_cloud_services = true
      
      authorized_networks {
        name  = "admin-access"
        value = var.admin_ip_range
      }
    }

    # Maintenance window
    maintenance_window {
      day          = 7  # Sunday
      hour         = 4  # 4 AM
      update_track = "stable"
    }

    # Insights and monitoring
    insights_config {
      query_insights_enabled  = true
      record_application_tags = true
      record_client_address   = true
    }
  }

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Read replica for read scaling
resource "google_sql_database_instance" "read_replica" {
  count               = var.enable_read_replica ? 1 : 0
  name                = "${local.name_prefix}-db-replica"
  master_instance_name = google_sql_database_instance.primary_db.name
  region              = local.region
  database_version    = "POSTGRES_14"

  replica_configuration {
    failover_target = false
  }

  settings {
    tier              = var.replica_database_tier
    availability_type = "ZONAL"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main_vpc.id
    }
  }
}

# Database user
resource "google_sql_user" "app_user" {
  name     = var.database_username
  instance = google_sql_database_instance.primary_db.name
  password = random_password.database_password.result
}

# Main application database
resource "google_sql_database" "main_db" {
  name     = var.database_name
  instance = google_sql_database_instance.primary_db.name
}

# Private service networking for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${local.name_prefix}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main_vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

#============================================================================
# REDIS CACHE INFRASTRUCTURE
#============================================================================

# Redis instance for caching and session storage
resource "google_redis_instance" "cache" {
  name           = "${local.name_prefix}-redis"
  memory_size_gb = var.redis_memory_size
  region         = local.region
  tier           = var.redis_tier

  authorized_network      = google_compute_network.main_vpc.id
  connect_mode           = "PRIVATE_SERVICE_ACCESS"
  redis_version          = "REDIS_7_0"
  display_name           = "${local.name_prefix} Redis Cache"

  # High availability
  replica_count           = var.redis_replica_count
  read_replicas_mode     = "READ_REPLICAS_ENABLED"

  # Maintenance policy
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 4
        minutes = 0
      }
    }
  }

  # Persistence configuration
  persistence_config {
    persistence_mode    = "RDB"
    rdb_snapshot_period = "ONE_HOUR"
    rdb_snapshot_start_time = "03:30"
  }

  labels = merge(local.common_tags, local.security_labels)
}

#============================================================================
# STORAGE INFRASTRUCTURE
#============================================================================

# Primary storage bucket for application data
resource "google_storage_bucket" "app_storage" {
  name          = "${local.name_prefix}-app-storage-${random_id.bucket_suffix.hex}"
  location      = local.region
  storage_class = "STANDARD"
  
  # Versioning for data protection
  versioning {
    enabled = true
  }

  # Lifecycle management
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"  
      storage_class = "COLDLINE"
    }
  }

  # CORS for web access
  cors {
    origin          = var.allowed_cors_origins
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Encryption
  encryption {
    default_kms_key_name = google_kms_crypto_key.storage_key.id
  }

  # Public access prevention
  public_access_prevention = "enforced"

  labels = merge(local.common_tags, local.security_labels)

  depends_on = [google_project_service.storage_api]
}

# Backup storage bucket
resource "google_storage_bucket" "backup_storage" {
  name          = "${local.name_prefix}-backup-storage-${random_id.bucket_suffix.hex}"
  location      = var.backup_region
  storage_class = "NEARLINE"
  
  versioning {
    enabled = true
  }

  # Extended lifecycle for compliance
  lifecycle_rule {
    condition {
      age = 2555  # 7 years for compliance
    }
    action {
      type = "Delete"
    }
  }

  # Cross-region replication
  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.backup_key.id
  }

  public_access_prevention = "enforced"
  
  labels = merge(local.common_tags, local.security_labels, {
    purpose = "backup"
    retention = "7years"
  })
}

# Logs storage bucket
resource "google_storage_bucket" "logs_storage" {
  name          = "${local.name_prefix}-logs-storage-${random_id.bucket_suffix.hex}"
  location      = local.region
  storage_class = "STANDARD"
  
  # Audit logs retention
  lifecycle_rule {
    condition {
      age = 2555  # 7 years for audit compliance
    }
    action {
      type = "Delete"
    }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.logs_key.id
  }

  public_access_prevention = "enforced"
  
  labels = merge(local.common_tags, local.security_labels, {
    purpose = "audit-logs"
  })
}

# Random suffix for globally unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

#============================================================================
# KEY MANAGEMENT INFRASTRUCTURE  
#============================================================================

# KMS Key Ring
resource "google_kms_key_ring" "main_keyring" {
  name     = "${local.name_prefix}-keyring"
  location = local.region
}

# Application encryption key
resource "google_kms_crypto_key" "app_key" {
  name     = "${local.name_prefix}-app-key"
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "SOFTWARE"
  }

  rotation_period = "2592000s"  # 30 days

  lifecycle {
    prevent_destroy = true
  }
}

# Storage encryption key
resource "google_kms_crypto_key" "storage_key" {
  name     = "${local.name_prefix}-storage-key"
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  rotation_period = "7776000s"  # 90 days

  lifecycle {
    prevent_destroy = true
  }
}

# Backup encryption key
resource "google_kms_crypto_key" "backup_key" {
  name     = "${local.name_prefix}-backup-key"
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  rotation_period = "7776000s"  # 90 days

  lifecycle {
    prevent_destroy = true
  }
}

# Logs encryption key
resource "google_kms_crypto_key" "logs_key" {
  name     = "${local.name_prefix}-logs-key"
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  rotation_period = "7776000s"  # 90 days

  lifecycle {
    prevent_destroy = true
  }
}

#============================================================================
# SECRET MANAGEMENT
#============================================================================

# Master encryption key in Secret Manager
resource "google_secret_manager_secret" "master_encryption_key" {
  secret_id = "${local.name_prefix}-master-encryption-key"
  
  replication {
    automatic = true
  }

  labels = merge(local.common_tags, {
    purpose = "encryption"
    tier    = "critical"
  })
}

resource "google_secret_manager_secret_version" "master_encryption_key" {
  secret      = google_secret_manager_secret.master_encryption_key.id
  secret_data = random_password.master_encryption_key.result
}

# JWT secret
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${local.name_prefix}-jwt-secret"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# Database password
resource "google_secret_manager_secret" "database_password" {
  secret_id = "${local.name_prefix}-database-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "database_password" {
  secret      = google_secret_manager_secret.database_password.id
  secret_data = random_password.database_password.result
}

#============================================================================
# API SERVICES ENABLEMENT
#============================================================================

# Enable required Google Cloud APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "sql-component.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
    "cloudkms.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firestore.googleapis.com",
    "redis.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudtrace.googleapis.com",
    "servicenetworking.googleapis.com",
    "vpcaccess.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "artifactregistry.googleapis.com",
    "identitytoolkit.googleapis.com",
    "firebase.googleapis.com"
  ])

  service = each.value
  project = local.project_id

  disable_dependent_services = false
  disable_on_destroy        = false
}

# Individual service references for dependencies
resource "google_project_service" "compute_api" {
  service = "compute.googleapis.com"
  project = local.project_id
}

resource "google_project_service" "storage_api" {
  service = "storage.googleapis.com"
  project = local.project_id
}

#============================================================================
# OUTPUTS
#============================================================================

output "project_id" {
  description = "The GCP project ID"
  value       = local.project_id
}

output "vpc_network" {
  description = "The VPC network name"
  value       = google_compute_network.main_vpc.name
}

output "primary_subnet" {
  description = "The primary subnet name"
  value       = google_compute_subnetwork.primary_subnet.name
}

output "database_connection_name" {
  description = "The Cloud SQL connection name"
  value       = google_sql_database_instance.primary_db.connection_name
  sensitive   = true
}

output "database_private_ip" {
  description = "The Cloud SQL private IP address"
  value       = google_sql_database_instance.primary_db.private_ip_address
  sensitive   = true
}

output "redis_host" {
  description = "The Redis instance host"
  value       = google_redis_instance.cache.host
  sensitive   = true
}

output "storage_bucket_name" {
  description = "The main storage bucket name"
  value       = google_storage_bucket.app_storage.name
}

output "backup_bucket_name" {
  description = "The backup storage bucket name"
  value       = google_storage_bucket.backup_storage.name
}

output "load_balancer_ip" {
  description = "The load balancer external IP address"
  value       = google_compute_global_address.lb_ip.address
}

output "kms_keyring_id" {
  description = "The KMS key ring ID"
  value       = google_kms_key_ring.main_keyring.id
}

output "app_encryption_key_id" {
  description = "The application encryption key ID"
  value       = google_kms_crypto_key.app_key.id
}