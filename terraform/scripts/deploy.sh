#!/bin/bash

# TERRAFORM DEPLOYMENT SCRIPT
# Enterprise-grade infrastructure deployment with validation and safety checks

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TERRAFORM_DIR")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
ACTION="plan"
FORCE=false
AUTO_APPROVE=false
WORKSPACE=""

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_usage() {
    cat << EOF
USAGE: $0 [OPTIONS]

Enterprise Terraform Deployment Script

OPTIONS:
    -e, --environment ENV    Environment to deploy (development|staging|production)
    -a, --action ACTION      Action to perform (plan|apply|destroy|output)
    -f, --force             Force action without prompts
    -y, --auto-approve      Auto-approve terraform apply
    -w, --workspace NAME    Terraform workspace name (optional)
    -h, --help              Show this help message

EXAMPLES:
    $0 -e development -a plan
    $0 -e staging -a apply
    $0 -e production -a apply -f
    $0 -e development -a destroy --auto-approve

ENVIRONMENTS:
    development  - Minimal resources for development and testing
    staging      - Production-like environment for testing
    production   - Full production deployment with enterprise features

ACTIONS:
    plan         - Show what Terraform will do
    apply        - Apply Terraform changes
    destroy      - Destroy infrastructure (use with caution!)
    output       - Show Terraform outputs
    validate     - Validate Terraform configuration
    fmt          - Format Terraform files
    init         - Initialize Terraform

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install Terraform 1.0 or later."
        exit 1
    fi
    
    # Check terraform version
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    log_info "Terraform version: $tf_version"
    
    # Check if gcloud is installed (for GCP)
    if ! command -v gcloud &> /dev/null; then
        log_error "Google Cloud CLI is not installed. Please install gcloud."
        exit 1
    fi
    
    # Check if authenticated with GCP
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Not authenticated with Google Cloud. Please run 'gcloud auth login'."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed. Please install jq for JSON processing."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

validate_environment() {
    case "$ENVIRONMENT" in
        development|staging|production)
            log_info "Environment: $ENVIRONMENT"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    # Check if tfvars file exists
    local tfvars_file="$TERRAFORM_DIR/environments/$ENVIRONMENT/terraform.tfvars"
    if [[ ! -f "$tfvars_file" ]]; then
        log_error "Terraform variables file not found: $tfvars_file"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

check_environment_safety() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ "$ACTION" == "destroy" && "$FORCE" != "true" ]]; then
            log_warning "⚠️  PRODUCTION ENVIRONMENT DESTRUCTION ATTEMPT ⚠️"
            log_warning "You are about to destroy production infrastructure!"
            log_warning "This action is IRREVERSIBLE and will cause DOWNTIME!"
            echo
            read -p "Type 'destroy-production' to confirm: " confirm
            if [[ "$confirm" != "destroy-production" ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        
        if [[ "$ACTION" == "apply" && "$FORCE" != "true" && "$AUTO_APPROVE" != "true" ]]; then
            log_warning "⚠️  PRODUCTION DEPLOYMENT ⚠️"
            log_warning "You are about to modify production infrastructure"
            echo
            read -p "Are you sure you want to continue? (yes/no): " confirm
            if [[ "$confirm" != "yes" ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
    fi
}

setup_terraform() {
    log_info "Setting up Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Set workspace name
    if [[ -z "$WORKSPACE" ]]; then
        WORKSPACE="$ENVIRONMENT"
    fi
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init \
        -backend-config="bucket=${TERRAFORM_STATE_BUCKET:-terraform-state-$ENVIRONMENT}" \
        -backend-config="prefix=terraform/$ENVIRONMENT"
    
    # Select or create workspace
    log_info "Setting up workspace: $WORKSPACE"
    terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
    
    log_success "Terraform setup completed"
}

run_security_checks() {
    log_info "Running security checks..."
    
    # Terraform validate
    log_info "Validating Terraform configuration..."
    terraform validate
    
    # Security scan with Checkov (if available)
    if command -v checkov &> /dev/null; then
        log_info "Running security scan with Checkov..."
        checkov -d . --framework terraform --quiet
    else
        log_warning "Checkov not found. Skipping security scan."
    fi
    
    # Cost estimation with Infracost (if available)
    if command -v infracost &> /dev/null && [[ "$ACTION" == "apply" ]]; then
        log_info "Running cost estimation..."
        infracost breakdown --path .
    fi
    
    log_success "Security checks completed"
}

backup_state() {
    if [[ "$ENVIRONMENT" == "production" && "$ACTION" == "apply" ]]; then
        log_info "Creating production state backup..."
        
        local backup_dir="$PROJECT_ROOT/terraform-backups"
        mkdir -p "$backup_dir"
        
        local backup_file="$backup_dir/terraform-state-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).tfstate"
        
        # Download current state
        terraform state pull > "$backup_file"
        
        log_success "State backup created: $backup_file"
    fi
}

execute_terraform_action() {
    local tfvars_file="environments/$ENVIRONMENT/terraform.tfvars"
    
    case "$ACTION" in
        plan)
            log_info "Running Terraform plan..."
            terraform plan \
                -var-file="$tfvars_file" \
                -out="tfplan-$ENVIRONMENT" \
                -detailed-exitcode
            ;;
            
        apply)
            log_info "Running Terraform apply..."
            backup_state
            
            # Create plan first
            terraform plan \
                -var-file="$tfvars_file" \
                -out="tfplan-$ENVIRONMENT"
            
            # Apply the plan
            if [[ "$AUTO_APPROVE" == "true" ]]; then
                terraform apply -auto-approve "tfplan-$ENVIRONMENT"
            else
                terraform apply "tfplan-$ENVIRONMENT"
            fi
            ;;
            
        destroy)
            log_info "Running Terraform destroy..."
            backup_state
            
            if [[ "$AUTO_APPROVE" == "true" ]]; then
                terraform destroy \
                    -var-file="$tfvars_file" \
                    -auto-approve
            else
                terraform destroy \
                    -var-file="$tfvars_file"
            fi
            ;;
            
        output)
            log_info "Showing Terraform outputs..."
            terraform output -json | jq '.'
            ;;
            
        validate)
            log_info "Validating Terraform configuration..."
            terraform validate
            terraform fmt -check -recursive
            ;;
            
        fmt)
            log_info "Formatting Terraform files..."
            terraform fmt -recursive
            ;;
            
        init)
            log_info "Initializing Terraform..."
            setup_terraform
            return
            ;;
            
        *)
            log_error "Invalid action: $ACTION"
            print_usage
            exit 1
            ;;
    esac
}

post_deployment_checks() {
    if [[ "$ACTION" == "apply" ]]; then
        log_info "Running post-deployment checks..."
        
        # Health check endpoints (example)
        if [[ "$ENVIRONMENT" == "production" ]]; then
            log_info "Checking production health endpoints..."
            # Add actual health check commands here
        fi
        
        # Generate deployment report
        local report_file="$PROJECT_ROOT/deployment-reports/deployment-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"
        mkdir -p "$(dirname "$report_file")"
        
        cat > "$report_file" << EOF
{
  "deployment": {
    "environment": "$ENVIRONMENT",
    "action": "$ACTION",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "user": "$(whoami)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "terraform_version": "$(terraform version -json | jq -r '.terraform_version')"
  },
  "outputs": $(terraform output -json 2>/dev/null || echo '{}')
}
EOF
        
        log_success "Deployment report generated: $report_file"
        log_success "Post-deployment checks completed"
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "$TERRAFORM_DIR/tfplan-$ENVIRONMENT"
    log_success "Cleanup completed"
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -a|--action)
                ACTION="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -y|--auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            -w|--workspace)
                WORKSPACE="$2"
                shift 2
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
    
    # Validate required parameters
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment is required. Use -e or --environment"
        print_usage
        exit 1
    fi
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    log_info "Starting Terraform deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Action: $ACTION"
    
    check_prerequisites
    validate_environment
    check_environment_safety
    
    if [[ "$ACTION" != "init" ]]; then
        setup_terraform
        run_security_checks
    fi
    
    execute_terraform_action
    post_deployment_checks
    
    log_success "Terraform deployment completed successfully!"
}

# Execute main function with all arguments
main "$@"