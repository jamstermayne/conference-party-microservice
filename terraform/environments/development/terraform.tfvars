# DEVELOPMENT ENVIRONMENT CONFIGURATION
# Minimal resources for development and testing

# Project Configuration
project_id = "conference-party-app-dev"
environment = "development"
team_email = "dev@conference-party-app.com"
cost_center = "engineering"
terraform_state_bucket = "conference-party-app-dev-terraform-state"

# Regional Configuration
primary_region = "us-central1"
secondary_region = "us-east1"
backup_region = "us-west1"

# Network Configuration
primary_subnet_cidr = "10.20.1.0/24"
private_subnet_cidr = "10.20.2.0/24"
services_subnet_cidr = "10.21.0.0/16"
pods_subnet_cidr = "10.22.0.0/16"

# Open admin access for development
admin_ip_range = "0.0.0.0/0"

# CORS origins for development
allowed_cors_origins = [
  "https://conference-party-app-dev.web.app",
  "https://conference-party-app-dev.firebaseapp.com",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:5000",
  "http://127.0.0.1:3000"
]

# Database Configuration - Development Scale
database_tier = "db-f1-micro"  # Minimal for development
replica_database_tier = "db-f1-micro"
database_disk_size = 20
database_max_disk_size = 100
enable_read_replica = false  # Not needed for dev
database_backup_retention_days = 3

# Redis Configuration - Development Scale
redis_memory_size = 1
redis_tier = "BASIC"
redis_replica_count = 0

# Compute Configuration - Development Scale
instance_machine_type = "n2-standard-1"
min_instances = 1
max_instances = 3
target_cpu_utilization = 0.9

# Kubernetes Configuration - Minimal
enable_gke = false  # Disable GKE for dev to save costs
gke_node_count = 1
gke_machine_type = "n2-standard-1"
gke_disk_size = 30
gke_preemptible = true

# Security Configuration - Basic Security
enable_binary_authorization = false
enable_pod_security_policy = false
enable_network_policy = false
enable_private_endpoint = false

# Monitoring and Logging - Basic Monitoring
enable_monitoring = true
enable_logging = true
log_retention_days = 30
enable_audit_logs = false  # Disabled to save costs

# Backup Configuration - Basic Backup
backup_schedule = "0 4 * * 0"  # Weekly on Sunday at 4 AM
backup_retention_policy = 7
enable_cross_region_backup = false

# Disaster Recovery - Development DR (minimal)
enable_disaster_recovery = false
rto_minutes = 120
rpo_minutes = 60

# SSL/TLS Configuration - Basic Security
ssl_policy = "TLS_1_2"
ssl_certificates = [
  "dev.conference-party-app.com"
]

# Feature Flags - Development Features
enable_cdn = false  # Disabled to save costs
enable_armor = false
enable_vpc_flow_logs = false
enable_dns = false

# Cost Optimization - Maximum Cost Savings
enable_preemptible_instances = true
enable_committed_use_discounts = false
budget_amount = 200
budget_alert_thresholds = [0.5, 0.75, 0.9, 1.0]

# Compliance - Minimal Compliance for Development
compliance_framework = ["GDPR"]
data_residency_region = "us"
encryption_key_rotation_days = 180  # Less frequent for dev

# Validation - Development validation
validate_production_config = false