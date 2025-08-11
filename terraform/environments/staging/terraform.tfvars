# STAGING ENVIRONMENT CONFIGURATION
# Production-like but cost-optimized for testing

# Project Configuration
project_id = "conference-party-app-staging"
environment = "staging"
team_email = "devops@conference-party-app.com"
cost_center = "engineering"
terraform_state_bucket = "conference-party-app-staging-terraform-state"

# Regional Configuration
primary_region = "us-central1"
secondary_region = "us-east1"
backup_region = "us-west1"

# Network Configuration
primary_subnet_cidr = "10.10.1.0/24"
private_subnet_cidr = "10.10.2.0/24"
services_subnet_cidr = "10.11.0.0/16"
pods_subnet_cidr = "10.12.0.0/16"

# More permissive admin access for staging
admin_ip_range = "0.0.0.0/0"  # Open for testing (secure in production)

# CORS origins for staging
allowed_cors_origins = [
  "https://conference-party-app-staging.web.app",
  "https://conference-party-app-staging.firebaseapp.com",
  "https://api-staging.conference-party-app.com",
  "http://localhost:3000",
  "http://localhost:8080"
]

# Database Configuration - Staging Scale
database_tier = "db-custom-2-4096"  # 2 vCPUs, 4GB RAM
replica_database_tier = "db-custom-1-2048"  # 1 vCPU, 2GB RAM
database_disk_size = 50
database_max_disk_size = 500
enable_read_replica = true
database_backup_retention_days = 7

# Redis Configuration - Staging Scale
redis_memory_size = 2
redis_tier = "STANDARD_HA"
redis_replica_count = 1

# Compute Configuration - Staging Scale
instance_machine_type = "n2-standard-2"
min_instances = 2
max_instances = 10
target_cpu_utilization = 0.8

# Kubernetes Configuration
enable_gke = true
gke_node_count = 3
gke_machine_type = "n2-standard-2"
gke_disk_size = 50
gke_preemptible = true  # Cost optimization for staging

# Security Configuration - Moderate Security
enable_binary_authorization = false
enable_pod_security_policy = true
enable_network_policy = true
enable_private_endpoint = true

# Monitoring and Logging - Essential Monitoring
enable_monitoring = true
enable_logging = true
log_retention_days = 90
enable_audit_logs = true

# Backup Configuration - Staging Backup Strategy
backup_schedule = "0 3 * * *"  # Daily at 3 AM
backup_retention_policy = 30
enable_cross_region_backup = true

# Disaster Recovery - Staging DR
enable_disaster_recovery = true
rto_minutes = 60
rpo_minutes = 30

# SSL/TLS Configuration - Good Security
ssl_policy = "TLS_1_2"
ssl_certificates = [
  "api-staging.conference-party-app.com",
  "staging.conference-party-app.com"
]

# Feature Flags - Staging Features
enable_cdn = true
enable_armor = true
enable_vpc_flow_logs = true
enable_dns = true

# Cost Optimization - Staging Cost Efficiency
enable_preemptible_instances = true
enable_committed_use_discounts = false
budget_amount = 1000
budget_alert_thresholds = [0.5, 0.75, 0.9, 1.0]

# Compliance - Essential Compliance
compliance_framework = ["SOC2", "GDPR"]
data_residency_region = "us"
encryption_key_rotation_days = 90

# Validation - Staging validation
validate_production_config = false