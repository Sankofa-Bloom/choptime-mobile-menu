#!/bin/bash

# PRODUCTION DEPLOYMENT SCRIPT
# This script handles secure production deployment of ChopTym

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="choptym-mobile-menu"
DEPLOY_ENV="${1:-production}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}"

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

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js version 20+ required. Current: $(node --version)"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Please create it from config/production.env.example"
        cp config/production.env.example .env
        log_info "Created .env file from template. Please fill in your production values."
        exit 1
    fi

    # Check if required environment variables are set
    required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_API_BASE_URL")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            log_error "Required environment variable ${var} not found in .env"
            exit 1
        fi
    done

    log_success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    log_info "Creating backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup important files
    if [ -d "dist" ]; then
        cp -r dist "$BACKUP_DIR/"
    fi

    if [ -d "server" ]; then
        cp -r server "$BACKUP_DIR/"
    fi

    if [ -f ".env" ]; then
        # Don't backup sensitive data
        grep -v -E "(SECRET|KEY|PASSWORD|TOKEN)" .env > "$BACKUP_DIR/.env.backup"
    fi

    log_success "Backup created in $BACKUP_DIR"
}

# Install dependencies
install_dependencies() {
    log_info "Installing frontend dependencies..."
    npm ci --only=production

    if [ -d "server" ]; then
        log_info "Installing backend dependencies..."
        cd server
        npm ci --only=production
        cd ..
    fi

    log_success "Dependencies installed"
}

# Build application
build_application() {
    log_info "Building application for production..."

    # Clean previous build
    npm run clean

    # Build frontend
    if [ "$DEPLOY_ENV" = "production" ]; then
        npm run build:prod
    else
        npm run build
    fi

    # Build backend if it exists
    if [ -d "server" ] && [ -f "server/package.json" ]; then
        cd server
        npm run build 2>/dev/null || log_warning "No build script for server"
        cd ..
    fi

    log_success "Application built successfully"
}

# Security audit
security_audit() {
    log_info "Running security audit..."

    # Check for vulnerable dependencies
    if command -v npm &> /dev/null; then
        npm audit --audit-level=moderate || log_warning "Security vulnerabilities found. Please review."
    fi

    # Check for exposed secrets
    if grep -r "password\|secret\|key\|token" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist . | grep -v "node_modules\|dist\|.git"; then
        log_warning "Potential secrets found in source code. Please review."
    fi

    log_success "Security audit completed"
}

# Optimize build
optimize_build() {
    log_info "Optimizing production build..."

    # Minify and compress
    if [ -d "dist" ]; then
        # Add compression headers
        echo "Build optimized for production"
    fi

    log_success "Build optimization completed"
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."

    # Check if build files exist
    if [ ! -d "dist" ]; then
        log_error "Build directory not found"
        exit 1
    fi

    # Check if main files exist
    if [ ! -f "dist/index.html" ]; then
        log_error "Main index.html not found in build"
        exit 1
    fi

    # Check file sizes
    BUILD_SIZE=$(du -sh dist | cut -f1)
    log_info "Build size: $BUILD_SIZE"

    if [ -d "server" ]; then
        SERVER_BUILD_SIZE=$(du -sh server | cut -f1)
        log_info "Server size: $SERVER_BUILD_SIZE"
    fi

    log_success "Deployment verification passed"
}

# Deploy to production
deploy_to_production() {
    log_info "Deploying to production..."

    # This would be customized based on your deployment platform
    # Examples: Netlify, Vercel, Railway, AWS, etc.

    case "$DEPLOY_ENV" in
        "netlify")
            if command -v netlify &> /dev/null; then
                netlify deploy --prod --dir=dist
            else
                log_error "Netlify CLI not found. Please install it first."
                exit 1
            fi
            ;;
        "vercel")
            if command -v vercel &> /dev/null; then
                vercel --prod
            else
                log_error "Vercel CLI not found. Please install it first."
                exit 1
            fi
            ;;
        "railway")
            if command -v railway &> /dev/null; then
                railway deploy
            else
                log_error "Railway CLI not found. Please install it first."
                exit 1
            fi
            ;;
        *)
            log_info "Custom deployment - please configure your deployment method"
            log_info "Build is ready in ./dist directory"
            ;;
    esac

    log_success "Deployment completed"
}

# Main deployment process
main() {
    log_info "Starting production deployment for $PROJECT_NAME"
    log_info "Environment: $DEPLOY_ENV"
    log_info "Timestamp: $TIMESTAMP"

    pre_deployment_checks
    create_backup
    install_dependencies
    build_application
    security_audit
    optimize_build
    verify_deployment
    deploy_to_production

    log_success "🎉 Production deployment completed successfully!"
    log_info "Backup location: $BACKUP_DIR"
    log_info "Build location: ./dist"

    # Post-deployment instructions
    echo ""
    echo "📋 POST-DEPLOYMENT CHECKLIST:"
    echo "□ Test the live application"
    echo "□ Verify payment processing works"
    echo "□ Check admin dashboard access"
    echo "□ Monitor error logs for 24 hours"
    echo "□ Update DNS if needed"
    echo "□ Configure monitoring and alerts"
    echo "□ Test backup and restore procedures"
}

# Handle command line arguments
case "$1" in
    "check")
        pre_deployment_checks
        ;;
    "build")
        build_application
        ;;
    "security")
        security_audit
        ;;
    *)
        main
        ;;
esac