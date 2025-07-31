#!/bin/bash

# Render Deployment Script for ThinqScribe Backend
echo "🚀 Starting Render deployment for ThinqScribe Backend..."

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI is not installed. Installing now..."
    npm install -g @render/cli
fi

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Login to Render (if not already logged in)
echo "🔐 Checking Render login status..."
render whoami || {
    echo "🔐 Please login to Render..."
    render login
}

# Deploy to Render
echo "🚀 Deploying to Render..."
render deploy

echo "🎉 Deployment completed!"
echo "🌐 Your backend should be live at: https://thinqscribe-backend.onrender.com"
echo "📊 Check deployment status at: https://dashboard.render.com" 