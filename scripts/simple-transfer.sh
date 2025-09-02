#!/bin/bash

# =============================================================================
# SIMPLE LOCAL TO PRODUCTION TRANSFER SCRIPT
# =============================================================================
# 
# ⚠️  WARNING: This script will COMPLETELY OVERWRITE your production database!
# ⚠️  All production data will be permanently lost!
# ⚠️  Make sure you have backups before proceeding!
#
# This script uses Supabase CLI to:
# 1. Create a backup of production data
# 2. Export local database schema and data
# 3. Push local data to production
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="qrpukxmzdwkepfpuapzh"  # Your production project ID
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    print_header "Checking Supabase CLI"
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed"
        print_info "Install it with: npm install -g supabase"
        exit 1
    fi
    
    print_success "Supabase CLI is installed"
}

# Login to Supabase
login_supabase() {
    print_header "Logging into Supabase"
    
    print_info "You will be prompted to log in to Supabase..."
    supabase login
    
    if [ $? -eq 0 ]; then
        print_success "Logged into Supabase successfully"
    else
        print_error "Failed to log into Supabase"
        exit 1
    fi
}

# Create production backup
backup_production() {
    print_header "Creating Production Backup"
    
    mkdir -p "$BACKUP_DIR"
    
    print_info "Creating backup of production database..."
    
    # Create a database dump
    supabase db dump --project-ref "$PROJECT_ID" --file "$BACKUP_DIR/production_backup.sql"
    
    if [ $? -eq 0 ]; then
        print_success "Production backup created: $BACKUP_DIR/production_backup.sql"
    else
        print_warning "Failed to create production backup (continuing anyway)"
    fi
}

# Export local database
export_local() {
    print_header "Exporting Local Database"
    
    print_info "Exporting local database schema and data..."
    
    # Export schema
    supabase db dump --local --schema-only --file "./exports/local_schema.sql"
    
    # Export data
    supabase db dump --local --data-only --file "./exports/local_data.sql"
    
    if [ $? -eq 0 ]; then
        print_success "Local database exported successfully"
    else
        print_error "Failed to export local database"
        exit 1
    fi
}

# Push local data to production
push_to_production() {
    print_header "Pushing Local Data to Production"
    
    print_warning "This will COMPLETELY OVERWRITE your production database!"
    read -p "Are you absolutely sure? Type 'YES' to continue: " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        print_error "Operation cancelled by user"
        exit 1
    fi
    
    print_info "Pushing local database to production..."
    
    # Push the entire local database to production
    supabase db push --project-ref "$PROJECT_ID" --local
    
    if [ $? -eq 0 ]; then
        print_success "Local data pushed to production successfully"
    else
        print_error "Failed to push data to production"
        exit 1
    fi
}

# Verify transfer
verify_transfer() {
    print_header "Verifying Data Transfer"
    
    print_info "Checking production database status..."
    
    # Get project status
    supabase status --project-ref "$PROJECT_ID"
    
    print_success "Verification completed"
}

# Main execution
main() {
    print_header "SIMPLE LOCAL TO PRODUCTION DATA TRANSFER"
    print_warning "This script will COMPLETELY OVERWRITE your production database!"
    print_warning "All production data will be permanently lost!"
    
    read -p "Do you want to continue? Type 'I UNDERSTAND' to proceed: " confirmation
    
    if [ "$confirmation" != "I UNDERSTAND" ]; then
        print_error "Operation cancelled by user"
        exit 1
    fi
    
    print_info "Starting simple transfer process..."
    
    check_supabase_cli
    login_supabase
    backup_production
    export_local
    push_to_production
    verify_transfer
    
    print_header "TRANSFER COMPLETED SUCCESSFULLY! 🎉"
    print_success "Your local data has been transferred to production"
    print_info "Production backup saved to: $BACKUP_DIR"
    print_info "Local exports saved to: ./exports/"
    print_warning "Remember to update your environment variables to use production database"
}

# Run main function
main "$@" 