@echo off
setlocal enabledelayedexpansion
title LifeLedger — 6-Role Decentralized Organ Custody Network Launcher

echo ======================================================================
echo   LifeLedger: Decentralized Organ Procurement and Transplant Network
echo   Multi-Tab Role Isolation Launcher (6 Independent Service Portals)
echo ======================================================================
echo.

:: 1. Verify Node.js Environment
echo [1/4] Checking Node.js runtime...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your system PATH.
    echo Please install Node.js v18 or higher from https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo       - Detected Node.js %NODE_VERSION%

:: 2. Verify npm Package Manager
echo [2/4] Checking npm package manager...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in your system PATH.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo       - Detected npm %NPM_VERSION%

:: 3. Check Dependencies
echo [3/4] Verifying workspace dependencies...
if not exist "node_modules\" (
    echo       - Installing root workspace dependencies...
    call npm install
)
if exist "server\package.json" (
    if not exist "server\node_modules\" (
        echo       - Installing server dependencies...
        call npm install --prefix server
    )
)
if exist "client\package.json" (
    if not exist "client\node_modules\" (
        echo       - Installing client dependencies...
        call npm install --prefix client
    )
)
echo       - All dependencies verified.

:: 4. Verify Smart Contract Artifacts
echo [4/4] Checking smart contract compilation...
if exist "contracts\package.json" (
    if not exist "contracts\artifacts\contracts\LifeLedger.sol\LifeLedger.json" (
        echo       - Smart contracts not compiled yet. Compiling now...
        call npm install --prefix contracts
        call npm run compile --prefix contracts
    ) else (
        echo       - LifeLedger Solidity smart contracts compiled and ready.
    )
)

echo.
echo ======================================================================
echo   Launching 6 Isolated Service Tabs (Zero UI Intertwining)
echo ======================================================================
echo   Tab 1 [OPO Harvest]          : http://localhost:3000/?role=opo
echo   Tab 2 [Cryo-Logistics]       : http://localhost:3000/?role=logistics
echo   Tab 3 [Allocation Authority] : http://localhost:3000/?role=authority
echo   Tab 4 [Transplant Hospital]  : http://localhost:3000/?role=hospital
echo   Tab 5 [Regulatory Admin]     : http://localhost:3000/?role=admin
echo   Tab 6 [Public Verifier]      : http://localhost:3000/?role=customer
echo ======================================================================
echo.
echo Opening all 6 role service tabs in browser...

start "" "http://localhost:3000/?role=opo"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/?role=logistics"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/?role=authority"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/?role=hospital"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/?role=admin"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/?role=customer"

echo.
echo Starting LifeLedger server...
echo Press Ctrl+C anytime to stop.
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] Application process exited.
    pause
)
