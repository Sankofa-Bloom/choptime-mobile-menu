#!/bin/bash

# ChopTym Environment Setup Script
# Usage: ./setup-env.sh [development|production]

set -e

ENV=${1:-development}

if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
    echo "Error: Environment must be 'development' or 'production'"
    echo "Usage: ./setup-env.sh [development|production]"
    exit 1
fi

echo "Setting up ChopTym environment: $ENV"

# Frontend environment setup
if [[ "$ENV" == "development" ]]; then
    echo "📁 Setting up frontend for development..."
    cp .env.development .env
    echo "✅ Frontend development environment configured"
else
    echo "📁 Setting up frontend for production..."
    cp .env.production .env
    echo "✅ Frontend production environment configured"
fi

# Backend environment setup
if [[ "$ENV" == "development" ]]; then
    echo "🔧 Setting up backend for development..."
    cd server
    cp .env.development .env
    cd ..
    echo "✅ Backend development environment configured"
else
    echo "🔧 Setting up backend for production..."
    cd server
    cp .env.production .env
    cd ..
    echo "✅ Backend production environment configured"
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Current configuration:"
echo "  Environment: $ENV"
echo "  Frontend API: $(grep VITE_API_BASE_URL .env | cut -d'=' -f2)"
echo "  Backend Port: $(grep PORT server/.env | cut -d'=' -f2)"
echo ""
echo "To start development:"
echo "  npm run dev:full"
echo ""
echo "To start production:"
echo "  npm run build:prod"
echo "  npm start"
