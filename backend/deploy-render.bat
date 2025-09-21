@echo off
echo 🚀 Starting Render deployment for ThinqScribe Backend...

REM Check if Render CLI is installed
render --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Render CLI is not installed. Installing now...
    npm install -g @render/cli
)

REM Check if we're in the backend directory
if not exist "package.json" (
    echo ❌ Please run this script from the backend directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Login to Render (if not already logged in)
echo 🔐 Checking Render login status...
render whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Please login to Render...
    render login
)

REM Deploy to Render
echo 🚀 Deploying to Render...
render deploy

echo 🎉 Deployment completed!
echo 🌐 Your backend should be live at: https://thinqscribe-backend.onrender.com
echo 📊 Check deployment status at: https://dashboard.render.com
pause 