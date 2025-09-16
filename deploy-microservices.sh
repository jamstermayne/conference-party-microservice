#!/bin/bash

# Conference Party Platform - Microservices Deployment Script
# Deploys all microservices and the API gateway with comprehensive error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICES=("auth-service" "events-service" "matchmaking-service" "calendar-service" "admin-service")
FIREBASE_PROJECT="conference-party-app"
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🚀 Conference Party Platform Microservices Deployment${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "${YELLOW}Deployment ID: $DEPLOYMENT_ID${NC}"
echo -e "${YELLOW}Firebase Project: $FIREBASE_PROJECT${NC}"
echo -e "${YELLOW}Services to deploy: ${#SERVICES[@]} microservices + API Gateway${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Error occurred during deployment of $1${NC}"
    echo -e "${RED}Deployment ID: $DEPLOYMENT_ID${NC}"
    echo -e "${RED}Check logs above for details${NC}"
    exit 1
}

# Function to deploy a service
deploy_service() {
    local service=$1
    local service_dir="services/$service"
    local function_name="${service//-/}Service"

    log "📦 Preparing $service..."

    if [ ! -d "$service_dir" ]; then
        echo -e "${RED}❌ Service directory not found: $service_dir${NC}"
        return 1
    fi

    cd "$service_dir"

    # Install dependencies
    log "📥 Installing dependencies for $service..."
    if ! npm install --silent; then
        echo -e "${RED}❌ Failed to install dependencies for $service${NC}"
        return 1
    fi

    # Build TypeScript
    log "🔨 Building $service..."
    if ! npm run build; then
        echo -e "${RED}❌ Build failed for $service${NC}"
        return 1
    fi

    # Lint code
    log "🔍 Linting $service..."
    if ! npm run lint; then
        echo -e "${YELLOW}⚠️ Linting warnings for $service (continuing...)${NC}"
    fi

    # Deploy to Firebase
    log "🚀 Deploying $service to Firebase..."
    if ! firebase deploy --only "functions:$function_name" --project "$FIREBASE_PROJECT"; then
        echo -e "${RED}❌ Firebase deployment failed for $service${NC}"
        return 1
    fi

    cd ../..

    # Verify deployment
    log "✅ Verifying $service deployment..."
    local health_url="https://us-central1-$FIREBASE_PROJECT.cloudfunctions.net/$function_name/health"

    # Wait a moment for deployment to propagate
    sleep 5

    if curl -f -s "$health_url" > /dev/null; then
        echo -e "${GREEN}✅ $service deployed and healthy${NC}"
    else
        echo -e "${YELLOW}⚠️ $service deployed but health check failed (may take a moment to become available)${NC}"
    fi

    return 0
}

# Function to deploy API Gateway
deploy_gateway() {
    local gateway_dir="gateway"

    log "📦 Preparing API Gateway..."

    if [ ! -d "$gateway_dir" ]; then
        echo -e "${RED}❌ Gateway directory not found: $gateway_dir${NC}"
        return 1
    fi

    cd "$gateway_dir"

    # Install dependencies
    log "📥 Installing dependencies for API Gateway..."
    if ! npm install --silent; then
        echo -e "${RED}❌ Failed to install dependencies for API Gateway${NC}"
        return 1
    fi

    # Build TypeScript
    log "🔨 Building API Gateway..."
    if ! npm run build; then
        echo -e "${RED}❌ Build failed for API Gateway${NC}"
        return 1
    fi

    # Lint code
    log "🔍 Linting API Gateway..."
    if ! npm run lint; then
        echo -e "${YELLOW}⚠️ Linting warnings for API Gateway (continuing...)${NC}"
    fi

    # Deploy to Firebase (both apiGateway and api functions)
    log "🚀 Deploying API Gateway to Firebase..."
    if ! firebase deploy --only "functions:apiGateway,functions:api" --project "$FIREBASE_PROJECT"; then
        echo -e "${RED}❌ Firebase deployment failed for API Gateway${NC}"
        return 1
    fi

    cd ..

    # Verify deployment
    log "✅ Verifying API Gateway deployment..."
    local health_url="https://us-central1-$FIREBASE_PROJECT.cloudfunctions.net/apiGateway/health"

    # Wait a moment for deployment to propagate
    sleep 10

    if curl -f -s "$health_url" > /dev/null; then
        echo -e "${GREEN}✅ API Gateway deployed and healthy${NC}"
    else
        echo -e "${YELLOW}⚠️ API Gateway deployed but health check failed (may take a moment to become available)${NC}"
    fi

    return 0
}

# Function to build frontend modules
build_frontend() {
    log "🏗️ Building frontend modules..."

    if [ ! -f "scripts/build-modules.sh" ]; then
        echo -e "${YELLOW}⚠️ Frontend build script not found, skipping module build${NC}"
        return 0
    fi

    if ! chmod +x scripts/build-modules.sh; then
        echo -e "${RED}❌ Failed to make build script executable${NC}"
        return 1
    fi

    if ! ./scripts/build-modules.sh; then
        echo -e "${RED}❌ Frontend module build failed${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ Frontend modules built successfully${NC}"
    return 0
}

# Function to run post-deployment tests
run_health_checks() {
    log "🏥 Running comprehensive health checks..."

    local base_url="https://us-central1-$FIREBASE_PROJECT.cloudfunctions.net"
    local failed_services=()

    # Check API Gateway
    if curl -f -s "$base_url/apiGateway/health" > /dev/null; then
        echo -e "${GREEN}✅ API Gateway health check passed${NC}"
    else
        echo -e "${RED}❌ API Gateway health check failed${NC}"
        failed_services+=("API Gateway")
    fi

    # Check individual services
    for service in "${SERVICES[@]}"; do
        local function_name="${service//-/}Service"
        local service_url="$base_url/$function_name/health"

        if curl -f -s "$service_url" > /dev/null; then
            echo -e "${GREEN}✅ $service health check passed${NC}"
        else
            echo -e "${RED}❌ $service health check failed${NC}"
            failed_services+=("$service")
        fi
    done

    if [ ${#failed_services[@]} -eq 0 ]; then
        echo -e "${GREEN}🎉 All services are healthy!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Some services failed health checks: ${failed_services[*]}${NC}"
        echo -e "${YELLOW}Note: Services may take a few minutes to become fully available after deployment${NC}"
        return 1
    fi
}

# Function to display deployment summary
show_summary() {
    echo ""
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo -e "${BLUE}====================${NC}"
    echo -e "${YELLOW}Deployment ID: $DEPLOYMENT_ID${NC}"
    echo -e "${YELLOW}Timestamp: $(date)${NC}"
    echo ""
    echo -e "${GREEN}✅ Services Deployed:${NC}"

    local base_url="https://us-central1-$FIREBASE_PROJECT.cloudfunctions.net"

    for service in "${SERVICES[@]}"; do
        local function_name="${service//-/}Service"
        echo -e "${GREEN}  📦 $service: $base_url/$function_name${NC}"
    done

    echo -e "${GREEN}  🌐 API Gateway: $base_url/apiGateway${NC}"
    echo -e "${GREEN}  🔗 Legacy API: $base_url/api${NC}"
    echo ""
    echo -e "${BLUE}🔗 Useful URLs:${NC}"
    echo -e "  Health Check: $base_url/apiGateway/health"
    echo -e "  Service Discovery: $base_url/apiGateway/services"
    echo -e "  Frontend App: https://$FIREBASE_PROJECT.web.app"
    echo ""
    echo -e "${GREEN}🎉 Microservices deployment completed successfully!${NC}"
}

# Main deployment flow
main() {
    local start_time=$(date +%s)

    # Check prerequisites
    log "🔍 Checking prerequisites..."

    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}❌ Firebase CLI not found. Please install it first.${NC}"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found. Please install Node.js and npm first.${NC}"
        exit 1
    fi

    if ! firebase projects:list | grep -q "$FIREBASE_PROJECT"; then
        echo -e "${RED}❌ Firebase project '$FIREBASE_PROJECT' not found or not accessible.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites check passed${NC}"

    # Build frontend modules first
    if ! build_frontend; then
        handle_error "Frontend Build"
    fi

    # Deploy all services
    for service in "${SERVICES[@]}"; do
        log "🚀 Starting deployment of $service..."
        if ! deploy_service "$service"; then
            handle_error "$service"
        fi
    done

    # Deploy API Gateway
    log "🚀 Starting deployment of API Gateway..."
    if ! deploy_gateway; then
        handle_error "API Gateway"
    fi

    # Wait for services to initialize
    log "⏳ Waiting for services to initialize..."
    sleep 15

    # Run health checks
    run_health_checks

    # Calculate deployment time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Show summary
    show_summary

    echo ""
    echo -e "${BLUE}⏱️ Total deployment time: ${duration}s${NC}"
    echo -e "${GREEN}✨ Ready for production traffic!${NC}"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Conference Party Platform - Microservices Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --services-only     Deploy only microservices (skip gateway)"
        echo "  --gateway-only      Deploy only API gateway"
        echo "  --no-frontend       Skip frontend module build"
        echo "  --dry-run           Show what would be deployed without deploying"
        echo ""
        exit 0
        ;;
    --services-only)
        log "🎯 Deploying microservices only..."
        for service in "${SERVICES[@]}"; do
            if ! deploy_service "$service"; then
                handle_error "$service"
            fi
        done
        echo -e "${GREEN}✅ Microservices deployment completed!${NC}"
        ;;
    --gateway-only)
        log "🎯 Deploying API Gateway only..."
        if ! deploy_gateway; then
            handle_error "API Gateway"
        fi
        echo -e "${GREEN}✅ API Gateway deployment completed!${NC}"
        ;;
    --dry-run)
        echo -e "${YELLOW}🔍 Dry run - showing what would be deployed:${NC}"
        echo -e "Services: ${SERVICES[*]}"
        echo -e "API Gateway: gateway/"
        echo -e "Frontend Modules: frontend/src/modules/"
        echo -e "Firebase Project: $FIREBASE_PROJECT"
        ;;
    "")
        main
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac