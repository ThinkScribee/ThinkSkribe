#!/bin/bash

# Enhanced Vercel Deployment Script for ThinqScribe Frontend
echo "🚀 Starting Vercel deployment for ThinqScribe Frontend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI is not installed. Installing now..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        print_error "Failed to install Vercel CLI"
        exit 1
    fi
fi

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_warning "Node.js version $NODE_VERSION detected. Vercel recommends Node.js 18+"
fi

# Clean previous build
if [ -d "dist" ]; then
    print_status "Cleaning previous build..."
    rm -rf dist
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --silent
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Lint the code
print_status "Running linter..."
npm run lint --silent
if [ $? -ne 0 ]; then
    print_warning "Linting issues found, but continuing deployment..."
fi

# Build the project
print_status "Building the project..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed. Please check for errors."
    exit 1
fi

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build directory not found. Build may have failed."
    exit 1
fi

print_success "Build completed successfully!"

# Deploy to Vercel
print_status "Deploying to Vercel..."
vercel --prod --yes
if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
fi

print_success "🎉 Deployment completed successfully!"
print_status "📱 Your app should be live at: https://thinqscribe.vercel.app"
print_status "🌐 Custom domain: https://thinqscribe.com"
print_status "🔗 Run 'vercel' to get the exact deployment URL" 