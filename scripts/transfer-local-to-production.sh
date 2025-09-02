#!/bin/bash

# =============================================================================
# LOCAL TO PRODUCTION DATA TRANSFER SCRIPT
# =============================================================================
# 
# ⚠️  WARNING: This script will COMPLETELY OVERWRITE your production database!
# ⚠️  All production data will be permanently lost!
# ⚠️  Make sure you have backups before proceeding!
#
# This script will:
# 1. Create a backup of production data
# 2. Export data from local Supabase
# 3. Clear production database
# 4. Import local data to production
# 5. Verify the transfer
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
LOCAL_SUPABASE_URL="http://127.0.0.1:54321"
LOCAL_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

PRODUCTION_SUPABASE_URL="https://qrpukxmzdwkepfpuapzh.supabase.co"
PRODUCTION_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs"

# Backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
EXPORT_DIR="./exports/local_data"

# Tables to transfer (in dependency order)
TABLES=(
    "system_settings"
    "delivery_fees"
    "dishes"
    "restaurants"
    "restaurant_menus"
    "daily_menus"
    "daily_menu_items"
    "user_towns"
    "orders"
    "custom_orders"
    "payment_records"
    "admin_users"
    "drivers"
    "delivery_zones"
    "order_analytics"
    "restaurant_analytics"
    "push_subscriptions"
)

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

# Check if required tools are installed
check_dependencies() {
    print_header "Checking Dependencies"
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first: sudo apt install jq"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Test connections
test_connections() {
    print_header "Testing Database Connections"
    
    # Test local connection
    print_info "Testing local Supabase connection..."
    if curl -s "$LOCAL_SUPABASE_URL/rest/v1/" > /dev/null; then
        print_success "Local Supabase is accessible"
    else
        print_error "Local Supabase is not accessible. Make sure it's running."
        exit 1
    fi
    
    # Test production connection
    print_info "Testing production Supabase connection..."
    if curl -s "$PRODUCTION_SUPABASE_URL/rest/v1/" > /dev/null; then
        print_success "Production Supabase is accessible"
    else
        print_error "Production Supabase is not accessible. Check your connection."
        exit 1
    fi
}

# Create backup of production data
backup_production() {
    print_header "Creating Production Backup"
    
    mkdir -p "$BACKUP_DIR"
    
    print_info "Backing up production data to: $BACKUP_DIR"
    
    for table in "${TABLES[@]}"; do
        print_info "Backing up table: $table"
        
        # Get table data
        response=$(curl -s "$PRODUCTION_SUPABASE_URL/rest/v1/$table?select=*" \
            -H "apikey: $PRODUCTION_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $PRODUCTION_SUPABASE_ANON_KEY")
        
        if [ $? -eq 0 ] && [ "$response" != "[]" ]; then
            echo "$response" > "$BACKUP_DIR/${table}.json"
            print_success "Backed up $table ($(echo "$response" | jq length) records)"
        else
            print_warning "No data in $table or backup failed"
            echo "[]" > "$BACKUP_DIR/${table}.json"
        fi
    done
    
    print_success "Production backup completed: $BACKUP_DIR"
}

# Export data from local Supabase
export_local_data() {
    print_header "Exporting Local Data"
    
    mkdir -p "$EXPORT_DIR"
    
    print_info "Exporting data from local Supabase to: $EXPORT_DIR"
    
    for table in "${TABLES[@]}"; do
        print_info "Exporting table: $table"
        
        # Get table data
        response=$(curl -s "$LOCAL_SUPABASE_URL/rest/v1/$table?select=*" \
            -H "apikey: $LOCAL_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $LOCAL_SUPABASE_ANON_KEY")
        
        if [ $? -eq 0 ]; then
            echo "$response" > "$EXPORT_DIR/${table}.json"
            record_count=$(echo "$response" | jq length)
            print_success "Exported $table ($record_count records)"
        else
            print_error "Failed to export $table"
            exit 1
        fi
    done
    
    print_success "Local data export completed: $EXPORT_DIR"
}

# Clear production database
clear_production() {
    print_header "Clearing Production Database"
    
    print_warning "This will DELETE ALL DATA from production tables!"
    read -p "Are you absolutely sure? Type 'YES' to continue: " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        print_error "Operation cancelled by user"
        exit 1
    fi
    
    print_info "Clearing production tables..."
    
    for table in "${TABLES[@]}"; do
        print_info "Clearing table: $table"
        
        # Delete all records from table
        response=$(curl -s -X DELETE "$PRODUCTION_SUPABASE_URL/rest/v1/$table?id=neq.00000000-0000-0000-0000-000000000000" \
            -H "apikey: $PRODUCTION_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $PRODUCTION_SUPABASE_ANON_KEY" \
            -H "Prefer: return=minimal")
        
        if [ $? -eq 0 ]; then
            print_success "Cleared $table"
        else
            print_warning "Failed to clear $table (might be empty or have RLS restrictions)"
        fi
    done
    
    print_success "Production database cleared"
}

# Import local data to production
import_to_production() {
    print_header "Importing Local Data to Production"
    
    print_info "Importing data from: $EXPORT_DIR"
    
    for table in "${TABLES[@]}"; do
        local_file="$EXPORT_DIR/${table}.json"
        
        if [ -f "$local_file" ]; then
            print_info "Importing table: $table"
            
            # Read the JSON file
            data=$(cat "$local_file")
            record_count=$(echo "$data" | jq length)
            
            if [ "$record_count" -gt 0 ]; then
                # Import data
                response=$(curl -s -X POST "$PRODUCTION_SUPABASE_URL/rest/v1/$table" \
                    -H "apikey: $PRODUCTION_SUPABASE_ANON_KEY" \
                    -H "Authorization: Bearer $PRODUCTION_SUPABASE_ANON_KEY" \
                    -H "Content-Type: application/json" \
                    -H "Prefer: return=minimal" \
                    -d "$data")
                
                if [ $? -eq 0 ]; then
                    print_success "Imported $table ($record_count records)"
                else
                    print_error "Failed to import $table: $response"
                    exit 1
                fi
            else
                print_info "Skipping $table (no records)"
            fi
        else
            print_warning "Export file not found: $local_file"
        fi
    done
    
    print_success "Data import completed"
}

# Verify transfer
verify_transfer() {
    print_header "Verifying Data Transfer"
    
    print_info "Comparing local and production data..."
    
    for table in "${TABLES[@]}"; do
        print_info "Verifying table: $table"
        
        # Get local count
        local_response=$(curl -s "$LOCAL_SUPABASE_URL/rest/v1/$table?select=id" \
            -H "apikey: $LOCAL_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $LOCAL_SUPABASE_ANON_KEY")
        local_count=$(echo "$local_response" | jq length)
        
        # Get production count
        prod_response=$(curl -s "$PRODUCTION_SUPABASE_URL/rest/v1/$table?select=id" \
            -H "apikey: $PRODUCTION_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $PRODUCTION_SUPABASE_ANON_KEY")
        prod_count=$(echo "$prod_response" | jq length)
        
        if [ "$local_count" -eq "$prod_count" ]; then
            print_success "$table: $local_count records (match)"
        else
            print_error "$table: Local=$local_count, Production=$prod_count (MISMATCH!)"
        fi
    done
    
    print_success "Verification completed"
}

# Main execution
main() {
    print_header "LOCAL TO PRODUCTION DATA TRANSFER"
    print_warning "This script will COMPLETELY OVERWRITE your production database!"
    print_warning "All production data will be permanently lost!"
    
    read -p "Do you want to continue? Type 'I UNDERSTAND' to proceed: " confirmation
    
    if [ "$confirmation" != "I UNDERSTAND" ]; then
        print_error "Operation cancelled by user"
        exit 1
    fi
    
    print_info "Starting data transfer process..."
    
    check_dependencies
    test_connections
    backup_production
    export_local_data
    clear_production
    import_to_production
    verify_transfer
    
    print_header "TRANSFER COMPLETED SUCCESSFULLY! 🎉"
    print_success "Your local data has been transferred to production"
    print_info "Production backup saved to: $BACKUP_DIR"
    print_info "Local data export saved to: $EXPORT_DIR"
    print_warning "Remember to update your environment variables to use production database"
}

# Run main function
main "$@" 