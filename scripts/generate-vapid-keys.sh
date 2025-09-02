#!/bin/bash

# =============================================================================
# VAPID KEY GENERATION SCRIPT
# =============================================================================
# This script generates VAPID keys for push notifications
# VAPID (Voluntary Application Server Identification) keys are required for web push notifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if web-push is installed
check_web_push() {
    if ! command -v web-push &> /dev/null; then
        print_warning "web-push CLI not found. Installing..."
        npm install -g web-push
        print_success "web-push CLI installed"
    else
        print_success "web-push CLI found"
    fi
}

# Generate VAPID keys
generate_keys() {
    print_header "Generating VAPID Keys"
    
    print_info "Generating new VAPID key pair..."
    
    # Generate keys
    keys_output=$(web-push generate-vapid-keys --json 2>/dev/null || web-push generate-vapid-keys)
    
    # Extract public and private keys
    if command -v jq &> /dev/null; then
        # If jq is available, parse JSON output
        public_key=$(echo "$keys_output" | jq -r '.publicKey // .public')
        private_key=$(echo "$keys_output" | jq -r '.privateKey // .private')
    else
        # Fallback to grep for key patterns
        public_key=$(echo "$keys_output" | grep -o 'Public Key: [A-Za-z0-9+/=]*' | cut -d' ' -f3)
        private_key=$(echo "$keys_output" | grep -o 'Private Key: [A-Za-z0-9+/=]*' | cut -d' ' -f3)
    fi
    
    if [ -z "$public_key" ] || [ -z "$private_key" ]; then
        print_error "Failed to generate VAPID keys"
        print_info "Manual generation instructions:"
        echo "1. Install web-push: npm install -g web-push"
        echo "2. Generate keys: web-push generate-vapid-keys"
        echo "3. Copy the public and private keys to your environment files"
        return 1
    fi
    
    print_success "VAPID keys generated successfully"
    
    # Create output directory
    mkdir -p ./vapid-keys
    
    # Save keys to files
    echo "$public_key" > ./vapid-keys/public_key.txt
    echo "$private_key" > ./vapid-keys/private_key.txt
    
    print_success "Keys saved to ./vapid-keys/"
    
    # Display keys
    print_header "Generated VAPID Keys"
    echo "Public Key:"
    echo "$public_key"
    echo ""
    echo "Private Key:"
    echo "$private_key"
    echo ""
    
    return 0
}

# Update environment files
update_env_files() {
    print_header "Updating Environment Files"
    
    if [ ! -f "./vapid-keys/public_key.txt" ] || [ ! -f "./vapid-keys/private_key.txt" ]; then
        print_error "VAPID keys not found. Please generate them first."
        return 1
    fi
    
    public_key=$(cat ./vapid-keys/public_key.txt)
    private_key=$(cat ./vapid-keys/private_key.txt)
    
    # Update .env.development
    if [ -f ".env.development" ]; then
        print_info "Updating .env.development..."
        sed -i "s/VITE_VAPID_PUBLIC_KEY=.*/VITE_VAPID_PUBLIC_KEY=$public_key/" .env.development
        sed -i "s/VAPID_PUBLIC_KEY=.*/VAPID_PUBLIC_KEY=$public_key/" .env.development
        sed -i "s/VAPID_PRIVATE_KEY=.*/VAPID_PRIVATE_KEY=$private_key/" .env.development
        print_success "Updated .env.development"
    fi
    
    # Update .env.production
    if [ -f ".env.production" ]; then
        print_info "Updating .env.production..."
        sed -i "s/VITE_VAPID_PUBLIC_KEY=.*/VITE_VAPID_PUBLIC_KEY=$public_key/" .env.production
        sed -i "s/VAPID_PUBLIC_KEY=.*/VAPID_PUBLIC_KEY=$public_key/" .env.production
        sed -i "s/VAPID_PRIVATE_KEY=.*/VAPID_PRIVATE_KEY=$private_key/" .env.production
        print_success "Updated .env.production"
    fi
    
    # Update server environment files
    if [ -f "server/.env.development" ]; then
        print_info "Updating server/.env.development..."
        sed -i "s/VAPID_PUBLIC_KEY=.*/VAPID_PUBLIC_KEY=$public_key/" server/.env.development
        sed -i "s/VAPID_PRIVATE_KEY=.*/VAPID_PRIVATE_KEY=$private_key/" server/.env.development
        print_success "Updated server/.env.development"
    fi
    
    if [ -f "server/.env.production" ]; then
        print_info "Updating server/.env.production..."
        sed -i "s/VAPID_PUBLIC_KEY=.*/VAPID_PUBLIC_KEY=$public_key/" server/.env.production
        sed -i "s/VAPID_PRIVATE_KEY=.*/VAPID_PRIVATE_KEY=$private_key/" server/.env.production
        print_success "Updated server/.env.production"
    fi
    
    print_success "All environment files updated"
}

# Show usage
show_usage() {
    print_header "VAPID Key Generation Help"
    
    echo "This script generates VAPID keys for push notifications."
    echo ""
    echo "Usage:"
    echo "  ./scripts/generate-vapid-keys.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  generate    Generate new VAPID keys (default)"
    echo "  update      Update environment files with existing keys"
    echo "  help        Show this help message"
    echo ""
    echo "What are VAPID keys?"
    echo "VAPID (Voluntary Application Server Identification) keys are required"
    echo "for web push notifications. They help identify your application server"
    echo "to push services and ensure secure delivery of notifications."
    echo ""
    echo "After generating keys:"
    echo "1. The keys will be saved to ./vapid-keys/"
    echo "2. Environment files will be automatically updated"
    echo "3. Restart your development server to apply changes"
    echo ""
}

# Main execution
main() {
    case "${1:-generate}" in
        "generate")
            check_web_push
            if generate_keys; then
                update_env_files
                print_success "VAPID key generation completed successfully!"
                print_info "Restart your development server to apply the changes."
            fi
            ;;
        "update")
            update_env_files
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
