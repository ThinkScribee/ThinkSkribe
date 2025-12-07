#!/bin/bash

# ThinqScribe Frontend - Quick Deploy Script
# This script provides quick deployment commands for Vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to print header
print_header() {
    echo
    print_color $CYAN "🚀 ThinqScribe Frontend Deployment"
    print_color $CYAN "=================================="
    echo
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run command with error handling
run_command() {
    local cmd="$1"
    local description="$2"
    
    print_color $YELLOW "⏳ $description..."
    if eval "$cmd"; then
        print_color $GREEN "✅ $description completed"
    else
        print_color $RED "❌ $description failed"
        exit 1
    fi
}

# Main deployment function
deploy() {
    local env="$1"
    
    print_header
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_color $RED "❌ Please run this script from the frontend directory"
        exit 1
    fi
    
    # Check if Vercel CLI is installed
    if ! command_exists vercel; then
        print_color $YELLOW "📦 Vercel CLI not found. Installing..."
        run_command "npm install -g vercel" "Installing Vercel CLI"
    fi
    
    # Install dependencies
    run_command "npm install" "Installing dependencies"
    
    # Run linting
    run_command "npm run lint" "Running linting"
    
    # Build the project
    run_command "npm run build" "Building project"
    
    # Deploy based on environment
    if [ "$env" = "production" ] || [ "$env" = "prod" ]; then
        print_color $MAGENTA "🚀 Deploying to PRODUCTION..."
        run_command "vercel --prod" "Production deployment"
        print_color $GREEN "🎉 Production deployment completed!"
        print_color $CYAN "🌐 Your app is live at: https://thinqscribe.com"
    else
        print_color $BLUE "🔍 Deploying PREVIEW..."
        run_command "vercel" "Preview deployment"
        print_color $GREEN "🎉 Preview deployment completed!"
        print_color $CYAN "🔗 Check the deployment URL in the output above"
    fi
    
    echo
    print_color $GREEN "✨ Deployment successful!"
}

# Show help
show_help() {
    print_header
    echo "Usage: ./deploy.sh [ENVIRONMENT]"
    echo
    echo "Environments:"
    echo "  preview     Deploy to preview environment (default)"
    echo "  production  Deploy to production environment"
    echo "  prod        Alias for production"
    echo
    echo "Examples:"
    echo "  ./deploy.sh              # Deploy to preview"
    echo "  ./deploy.sh preview      # Deploy to preview"
    echo "  ./deploy.sh production   # Deploy to production"
    echo "  ./deploy.sh prod         # Deploy to production"
    echo
    echo "Other commands:"
    echo "  ./deploy.sh help         # Show this help"
    echo "  ./deploy.sh setup        # Run setup script"
    echo
}

# Run setup
run_setup() {
    print_header
    print_color $YELLOW "🔧 Running Vercel setup..."
    node setup-vercel.js
}

# Main script logic
case "${1:-preview}" in
    "production"|"prod")
        deploy "production"
        ;;
    "preview"|"")
        deploy "preview"
        ;;
    "setup")
        run_setup
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_color $RED "❌ Unknown environment: $1"
        show_help
        exit 1
        ;;
esac