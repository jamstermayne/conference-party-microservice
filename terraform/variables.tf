# TERRAFORM VARIABLES CONFIGURATION
# Enterprise Infrastructure Variables for Conference Party Microservice

#============================================================================
# PROJECT CONFIGURATION
#============================================================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "conference-party"
}

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "team_email" {
  description = "Email of the team responsible for this infrastructure"
  type        = string
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "engineering"
}

variable "terraform_state_bucket" {
  description = "GCS bucket for Terraform state storage"
  type        = string
}

#============================================================================
# REGION AND AVAILABILITY CONFIGURATION
#============================================================================

variable "primary_region" {
  description = "Primary GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "secondary_region" {
  description = "Secondary region for disaster recovery"
  type        = string
  default     = "us-east1"
}

variable "backup_region" {
  description = "Region for backup storage"
  type        = string
  default     = "us-west1"
}

variable "zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

#============================================================================
# NETWORKING CONFIGURATION
#============================================================================

variable "primary_subnet_cidr" {
  description = "CIDR block for primary subnet"
  type        = string
  default     = "10.0.1.0/24"
  validation {
    condition     = can(cidrhost(var.primary_subnet_cidr, 0))
    error_message = "Primary subnet CIDR must be a valid IPv4 CIDR block."
  }
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "services_subnet_cidr" {
  description = "CIDR block for Kubernetes services"
  type        = string
  default     = "10.1.0.0/16"
}

variable "pods_subnet_cidr" {
  description = "CIDR block for Kubernetes pods"
  type        = string
  default     = "10.2.0.0/16"
}

variable "admin_ip_range" {
  description = "IP range allowed for admin access"
  type        = string
  default     = "0.0.0.0/0"  # SECURITY: Restrict this in production
}

variable "allowed_cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default = [
    "https://conference-party-app.web.app",
    "https://conference-party-app.firebaseapp.com"
  ]
}

#============================================================================
# DATABASE CONFIGURATION
#============================================================================

variable "database_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-custom-2-4096"  # 2 vCPUs, 4GB RAM
  validation {
    condition = can(regex("^db-(standard|custom|n1|f1|g1)-", var.database_tier))
    error_message = "Database tier must be a valid Cloud SQL machine type."
  }
}

variable "replica_database_tier" {
  description = "Cloud SQL read replica tier"
  type        = string
  default     = "db-custom-1-2048"  # 1 vCPU, 2GB RAM
}

variable "database_disk_size" {
  description = "Initial disk size for Cloud SQL instance (GB)"
  type        = number
  default     = 100
  validation {
    condition     = var.database_disk_size >= 10 && var.database_disk_size <= 30720
    error_message = "Database disk size must be between 10 and 30720 GB."
  }
}

variable "database_max_disk_size" {
  description = "Maximum disk size for autoresize (GB)"
  type        = number
  default     = 1000
}

variable "database_name" {
  description = "Name of the main database"
  type        = string
  default     = "conference_party"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "app_user"
}

variable "enable_read_replica" {
  description = "Whether to create a read replica"
  type        = bool
  default     = false
}

variable "database_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
  validation {
    condition     = var.database_backup_retention_days >= 1 && var.database_backup_retention_days <= 365
    error_message = "Backup retention must be between 1 and 365 days."
  }
}

#============================================================================
# REDIS CONFIGURATION
#============================================================================

variable "redis_memory_size" {
  description = "Redis instance memory size in GB"
  type        = number
  default     = 1
  validation {
    condition     = var.redis_memory_size >= 1 && var.redis_memory_size <= 300
    error_message = "Redis memory size must be between 1 and 300 GB."
  }
}

variable "redis_tier" {
  description = "Redis service tier"
  type        = string
  default     = "STANDARD_HA"
  validation {
    condition = contains(["BASIC", "STANDARD_HA"], var.redis_tier)
    error_message = "Redis tier must be BASIC or STANDARD_HA."
  }
}

variable "redis_replica_count" {
  description = "Number of Redis read replicas"
  type        = number
  default     = 1
  validation {
    condition     = var.redis_replica_count >= 0 && var.redis_replica_count <= 5
    error_message = "Redis replica count must be between 0 and 5."
  }
}

#============================================================================
# COMPUTE CONFIGURATION
#============================================================================

variable "instance_machine_type" {
  description = "Machine type for compute instances"
  type        = string
  default     = "n2-standard-2"
}

variable "min_instances" {
  description = "Minimum number of instances in autoscaling group"
  type        = number
  default     = 2
}

variable "max_instances" {
  description = "Maximum number of instances in autoscaling group"
  type        = number
  default     = 20
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for autoscaling"
  type        = number
  default     = 0.7
  validation {
    condition     = var.target_cpu_utilization > 0 && var.target_cpu_utilization <= 1
    error_message = "Target CPU utilization must be between 0 and 1."
  }
}

#============================================================================
# KUBERNETES CONFIGURATION
#============================================================================

variable "enable_gke" {
  description = "Whether to create a GKE cluster"
  type        = bool
  default     = false
}

variable "gke_node_count" {
  description = "Initial number of nodes in GKE cluster"
  type        = number
  default     = 3
}

variable "gke_machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "n2-standard-2"
}

variable "gke_disk_size" {
  description = "Disk size for GKE nodes in GB"
  type        = number
  default     = 50
}

variable "gke_preemptible" {
  description = "Whether to use preemptible nodes"
  type        = bool
  default     = false
}

#============================================================================
# SECURITY CONFIGURATION
#============================================================================

variable "enable_binary_authorization" {
  description = "Whether to enable Binary Authorization"
  type        = bool
  default     = false
}

variable "enable_pod_security_policy" {
  description = "Whether to enable Pod Security Policy"
  type        = bool
  default     = true
}

variable "enable_network_policy" {
  description = "Whether to enable Kubernetes Network Policy"
  type        = bool
  default     = true
}

variable "enable_private_endpoint" {
  description = "Whether to enable private GKE endpoint"
  type        = bool
  default     = true
}

variable "master_authorized_networks" {
  description = "List of authorized networks for GKE master"
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  default = [
    {
      cidr_block   = "10.0.0.0/8"
      display_name = "internal"
    }
  ]
}

#============================================================================
# MONITORING AND LOGGING CONFIGURATION
#============================================================================

variable "enable_monitoring" {
  description = "Whether to enable Cloud Monitoring"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Whether to enable Cloud Logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 2555  # 7 years for compliance
}

variable "enable_audit_logs" {
  description = "Whether to enable audit logs"
  type        = bool
  default     = true
}

variable "monitoring_notification_channels" {
  description = "List of notification channels for monitoring alerts"
  type        = list(string)
  default     = []
}

#============================================================================
# BACKUP CONFIGURATION
#============================================================================

variable "backup_schedule" {
  description = "Cron schedule for automated backups"
  type        = string
  default     = "0 2 * * *"  # Daily at 2 AM
}

variable "backup_retention_policy" {
  description = "Backup retention policy in days"
  type        = number
  default     = 90
}

variable "enable_cross_region_backup" {
  description = "Whether to enable cross-region backup replication"
  type        = bool
  default     = true
}

#============================================================================
# DISASTER RECOVERY CONFIGURATION
#============================================================================

variable "enable_disaster_recovery" {
  description = "Whether to enable disaster recovery setup"
  type        = bool
  default     = true
}

variable "rto_minutes" {
  description = "Recovery Time Objective in minutes"
  type        = number
  default     = 30
}

variable "rpo_minutes" {
  description = "Recovery Point Objective in minutes"
  type        = number
  default     = 15
}

#============================================================================
# SSL/TLS CONFIGURATION
#============================================================================

variable "ssl_policy" {
  description = "SSL policy for load balancers"
  type        = string
  default     = "TLS_1_2"
  validation {
    condition = contains(["TLS_1_0", "TLS_1_1", "TLS_1_2", "TLS_1_3"], var.ssl_policy)
    error_message = "SSL policy must be a valid TLS version."
  }
}

variable "ssl_certificates" {
  description = "List of SSL certificate domains"
  type        = list(string)
  default = [
    "api.conference-party-app.com",
    "conference-party-app.com"
  ]
}

#============================================================================
# FEATURE FLAGS
#============================================================================

variable "enable_cdn" {
  description = "Whether to enable Cloud CDN"
  type        = bool
  default     = true
}

variable "enable_armor" {
  description = "Whether to enable Cloud Armor (WAF)"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Whether to enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_dns" {
  description = "Whether to create Cloud DNS zone"
  type        = bool
  default     = true
}

variable "dns_zone_name" {
  description = "DNS zone name"
  type        = string
  default     = "conference-party-app-com"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "conference-party-app.com"
}

#============================================================================
# COST OPTIMIZATION
#============================================================================

variable "enable_preemptible_instances" {
  description = "Whether to use preemptible instances for cost savings"
  type        = bool
  default     = false
}

variable "enable_committed_use_discounts" {
  description = "Whether to use committed use discounts"
  type        = bool
  default     = false
}

variable "budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 1000
}

variable "budget_alert_thresholds" {
  description = "Budget alert thresholds (as percentages)"
  type        = list(number)
  default     = [0.5, 0.75, 0.9, 1.0]
}

#============================================================================
# COMPLIANCE CONFIGURATION
#============================================================================

variable "compliance_framework" {
  description = "Compliance framework requirements"
  type        = list(string)
  default     = ["SOC2", "GDPR", "HIPAA", "PCI-DSS"]
}

variable "data_residency_region" {
  description = "Data residency requirements"
  type        = string
  default     = "us"
}

variable "encryption_key_rotation_days" {
  description = "Number of days between key rotations"
  type        = number
  default     = 90
}

#============================================================================
# ENVIRONMENT SPECIFIC OVERRIDES
#============================================================================

variable "environment_config" {
  description = "Environment-specific configuration overrides"
  type = map(object({
    instance_count       = number
    database_tier       = string
    redis_memory_size   = number
    enable_monitoring   = bool
    enable_logging      = bool
    backup_retention    = number
  }))
  
  default = {
    development = {
      instance_count       = 1
      database_tier       = "db-f1-micro"
      redis_memory_size   = 1
      enable_monitoring   = false
      enable_logging      = true
      backup_retention    = 7
    }
    
    staging = {
      instance_count       = 2
      database_tier       = "db-custom-1-2048"
      redis_memory_size   = 1
      enable_monitoring   = true
      enable_logging      = true
      backup_retention    = 30
    }
    
    production = {
      instance_count       = 3
      database_tier       = "db-custom-2-4096"
      redis_memory_size   = 4
      enable_monitoring   = true
      enable_logging      = true
      backup_retention    = 90
    }
  }
}

#============================================================================
# VALIDATION RULES
#============================================================================

locals {
  # Environment-specific validation
  is_production = var.environment == "production"
  
  # Validate production requirements
  production_validations = {
    database_tier_adequate    = !local.is_production || can(regex("custom|standard", var.database_tier))
    backup_retention_adequate = !local.is_production || var.backup_retention_policy >= 30
    monitoring_enabled       = !local.is_production || var.enable_monitoring
    audit_logs_enabled      = !local.is_production || var.enable_audit_logs
  }
}

# Production validation checks
variable "validate_production_config" {
  description = "Enable validation of production configuration requirements"
  type        = bool
  default     = true
  
  validation {
    condition = !var.validate_production_config || (
      var.environment != "production" || (
        can(regex("custom|standard", var.database_tier)) &&
        var.backup_retention_policy >= 30 &&
        var.enable_monitoring == true &&
        var.enable_audit_logs == true
      )
    )
    error_message = "Production environment requires adequate database tier, backup retention >= 30 days, and monitoring/audit logs enabled."
  }
}