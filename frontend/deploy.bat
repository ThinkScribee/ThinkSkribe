@echo off
REM ThinqScribe Frontend - Quick Deploy Script for Windows
REM This script provides quick deployment commands for Vercel

setlocal enabledelayedexpansion

REM Colors (limited in Windows CMD)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "NC=[0m"

REM Function to print header
echo.
echo %CYAN%🚀 ThinqScribe Frontend Deployment%NC%
echo %CYAN%==================================%NC%
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo %RED%❌ Please run this script from the frontend directory%NC%
    exit /b 1
)

REM Get environment argument
set "ENV=%1"
if "%ENV%"=="" set "ENV=preview"

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%📦 Vercel CLI not found. Installing...%NC%
    npm install -g vercel
    if errorlevel 1 (
        echo %RED%❌ Failed to install Vercel CLI%NC%
        exit /b 1
    )
)

REM Install dependencies
echo %YELLOW%⏳ Installing dependencies...%NC%
npm install
if errorlevel 1 (
    echo %RED%❌ Failed to install dependencies%NC%
    exit /b 1
)
echo %GREEN%✅ Dependencies installed%NC%

REM Run linting
echo %YELLOW%⏳ Running linting...%NC%
npm run lint
if errorlevel 1 (
    echo %RED%❌ Linting failed%NC%
    exit /b 1
)
echo %GREEN%✅ Linting completed%NC%

REM Build the project
echo %YELLOW%⏳ Building project...%NC%
npm run build
if errorlevel 1 (
    echo %RED%❌ Build failed%NC%
    exit /b 1
)
echo %GREEN%✅ Build completed%NC%

REM Deploy based on environment
if "%ENV%"=="production" goto :production
if "%ENV%"=="prod" goto :production
goto :preview

:production
echo %CYAN%🚀 Deploying to PRODUCTION...%NC%
vercel --prod
if errorlevel 1 (
    echo %RED%❌ Production deployment failed%NC%
    exit /b 1
)
echo %GREEN%🎉 Production deployment completed!%NC%
echo %CYAN%🌐 Your app is live at: https://thinqscribe.com%NC%
goto :end

:preview
echo %BLUE%🔍 Deploying PREVIEW...%NC%
vercel
if errorlevel 1 (
    echo %RED%❌ Preview deployment failed%NC%
    exit /b 1
)
echo %GREEN%🎉 Preview deployment completed!%NC%
echo %CYAN%🔗 Check the deployment URL in the output above%NC%
goto :end

:end
echo.
echo %GREEN%✨ Deployment successful!%NC%
pause