#!/bin/bash

# ChopTym Development Startup Script
echo "🚀 Starting ChopTym Development Environment..."

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Setup development environment
echo "⚙️ Setting up development environment..."
./setup-env.sh development

# Start the development servers
echo "🎯 Starting development servers..."
npm run dev:full
