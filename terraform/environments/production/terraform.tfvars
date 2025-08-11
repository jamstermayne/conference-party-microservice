# PRODUCTION ENVIRONMENT CONFIGURATION
# High availability, security, and compliance optimized

# Project Configuration
project_id = "conference-party-app"
environment = "production"
team_email = "devops@conference-party-app.com"
cost_center = "engineering"
terraform_state_bucket = "conference-party-app-terraform-state"

# Regional Configuration
primary_region = "us-central1"
secondary_region = "us-east1"
backup_region = "us-west1"

# Network Configuration
primary_subnet_cidr = "10.0.1.0/24"
private_subnet_cidr = "10.0.2.0/24"
services_subnet_cidr = "10.1.0.0/16"
pods_subnet_cidr = "10.2.0.0/16"

# Restrict admin access in production
admin_ip_range = "203.0.113.0/24"  # Replace with actual office IP range

# CORS origins for production
allowed_cors_origins = [
  "https://conference-party-app.web.app",
  "https://conference-party-app.firebaseapp.com",
  "https://api.conference-party-app.com"
]

# Database Configuration - Production Scale
database_tier = "db-custom-4-8192"  # 4 vCPUs, 8GB RAM
replica_database_tier = "db-custom-2-4096"  # 2 vCPUs, 4GB RAM
database_disk_size = 200
database_max_disk_size = 2000
enable_read_replica = true
database_backup_retention_days = 30

# Redis Configuration - Production Scale
redis_memory_size = 8
redis_tier = "STANDARD_HA"
redis_replica_count = 2

# Compute Configuration - Production Scale
instance_machine_type = "n2-standard-4"
min_instances = 3
max_instances = 50
target_cpu_utilization = 0.7

# Kubernetes Configuration
enable_gke = true
gke_node_count = 5
gke_machine_type = "n2-standard-4"
gke_disk_size = 100
gke_preemptible = false

# Security Configuration - Maximum Security
enable_binary_authorization = true
enable_pod_security_policy = true
enable_network_policy = true
enable_private_endpoint = true

# Monitoring and Logging - Full Monitoring
enable_monitoring = true
enable_logging = true
log_retention_days = 2555  # 7 years for compliance
enable_audit_logs = true

# Backup Configuration - Production Backup Strategy
backup_schedule = "0 2 * * *"  # Daily at 2 AM
backup_retention_policy = 90
enable_cross_region_backup = true

# Disaster Recovery - Production DR
enable_disaster_recovery = true
rto_minutes = 30
rpo_minutes = 15

# SSL/TLS Configuration - Maximum Security
ssl_policy = "TLS_1_3"
ssl_certificates = [
  "api.conference-party-app.com",
  "conference-party-app.com",
  "*.conference-party-app.com"
]

# Feature Flags - Production Features
enable_cdn = true
enable_armor = true
enable_vpc_flow_logs = true
enable_dns = true

# Cost Optimization - Production Efficiency
enable_preemptible_instances = false
enable_committed_use_discounts = true
budget_amount = 5000
budget_alert_thresholds = [0.5, 0.75, 0.9, 1.0]

# Compliance - Full Compliance
compliance_framework = ["SOC2", "GDPR", "HIPAA", "PCI-DSS", "ISO27001"]
data_residency_region = "us"
encryption_key_rotation_days = 90

# Validation - Enable all production validations
validate_production_config = true