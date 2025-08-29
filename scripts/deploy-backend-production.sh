#!/bin/bash

# DEPLOY BACKEND API TO PRODUCTION
# Deploy the ChopTym API server to production

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Check if Railway CLI is available
check_railway() {
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi

    if ! railway login --help &> /dev/null; then
        log_error "Railway CLI installation failed. Please install manually:"
        echo "npm install -g @railway/cli"
        echo "railway login"
        exit 1
    fi

    log_success "Railway CLI ready"
}

# Deploy to Railway
deploy_to_railway() {
    log_info "🚂 DEPLOYING TO RAILWAY"
    echo "========================"

    # Check if already logged in
    if ! railway whoami &> /dev/null; then
        log_info "Please login to Railway:"
        railway login
    fi

    # Create Railway project if it doesn't exist
    if ! railway list | grep -q "choptym-api"; then
        log_info "Creating Railway project..."
        railway init choptym-api
        cd choptym-api
    else
        log_info "Using existing Railway project"
        railway use choptym-api
    fi

    # Set environment variables
    log_info "Setting environment variables..."

    # Copy production environment
    cp ../server/.env.production .env

    # Set Railway environment variables
    railway variables set NODE_ENV=production
    railway variables set PORT=3001

    # Database variables (from production env)
    railway variables set SUPABASE_URL=https://qrpukxmzdwkepfpuapzh.supabase.co
    railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs

    # CORS settings
    railway variables set CORS_ORIGIN=https://choptym.com,https://www.choptym.com

    # Deploy
    log_info "Deploying to Railway..."
    railway up

    # Get the deployment URL
    log_info "Getting deployment URL..."
    RAILWAY_URL=$(railway domain)

    if [ -n "$RAILWAY_URL" ]; then
        log_success "🎉 Backend deployed to: https://$RAILWAY_URL"
        echo ""
        echo "📋 NEXT STEPS:"
        echo "1. Update frontend .env.production:"
        echo "   VITE_API_BASE_URL=https://$RAILWAY_URL"
        echo ""
        echo "2. Redeploy frontend:"
        echo "   npm run build:prod"
        echo "   # Upload dist/ to your hosting platform"
        echo ""
        echo "3. Test the connection:"
        echo "   curl https://$RAILWAY_URL/health"
    else
        log_warning "Could not get Railway URL. Check railway domain command"
    fi
}

# Alternative: Deploy to Vercel
deploy_to_vercel() {
    log_info "▲ DEPLOYING TO VERCEL"
    echo "======================"

    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi

    # Create vercel.json configuration
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "server/src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server/src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "PORT": "3001"
  }
}
EOF

    # Deploy
    log_info "Deploying to Vercel..."
    vercel --prod

    log_success "Backend deployed to Vercel"
}

# Quick local test before deployment
test_local_api() {
    log_info "🧪 TESTING LOCAL API BEFORE DEPLOYMENT"
    echo "========================================="

    # Start server in background for testing
    log_info "Starting local server for testing..."
    npm run server > server.log 2>&1 &
    SERVER_PID=$!

    # Wait for server to start
    sleep 5

    # Test endpoints
    log_info "Testing API endpoints..."

    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "✅ Local API is working"
    else
        log_error "❌ Local API failed to start"
        cat server.log
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi

    # Test CORS
    CORS_TEST=$(curl -H "Origin: https://choptym.com" -v http://localhost:3001/api/dishes 2>&1 | grep -i "access-control-allow-origin" || echo "No CORS header")

    if echo "$CORS_TEST" | grep -q "choptym.com"; then
        log_success "✅ CORS is properly configured"
    else
        log_warning "⚠️  CORS may need configuration"
    fi

    # Stop server
    kill $SERVER_PID 2>/dev/null || true
    rm -f server.log

    log_success "Local API test completed"
}

# Main deployment process
main() {
    echo "🚀 ChopTym Backend Production Deployment"
    echo "========================================"

    log_info "This will deploy your API server to production"
    log_info "Choose deployment platform:"
    echo ""
    echo "1) Railway (Recommended)"
    echo "2) Vercel"
    echo "3) Test local API first"
    echo ""

    read -p "Enter choice (1-3): " choice

    case $choice in
        1)
            check_railway
            deploy_to_railway
            ;;
        2)
            deploy_to_vercel
            ;;
        3)
            test_local_api
            ;;
        *)
            log_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Handle command line arguments
case "$1" in
    "railway")
        check_railway
        deploy_to_railway
        ;;
    "vercel")
        deploy_to_vercel
        ;;
    "test")
        test_local_api
        ;;
    *)
        main
        ;;
esac