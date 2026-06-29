@echo off
REM ===========================================================================
REM  TipChain Anchor Test Runner
REM  Must be run as Administrator for solana-test-validator on Windows
REM ===========================================================================
setlocal enabledelayedexpansion

title TipChain Anchor Test Runner

REM Paths
set PROJECT_DIR=%~dp0
set TARGET_DIR=%PROJECT_DIR%target\deploy
set PROGRAM_SO=%TARGET_DIR%\tipchain.so
set PROGRAM_KEY=BWVuJNwjRspZNaGN2Ym4v7xMnTvquu9M3UEBFTBvZguh
set LEDGER_DIR=%PROJECT_DIR%.test-ledger
set SOLANA_BIN=%USERPROFILE%\.local\share\solana\install\active_release\bin

echo ============================================================================
echo  TipChain Anchor Program - Test Runner
echo ============================================================================
echo.
echo Project: %PROJECT_DIR%
echo Program: %PROGRAM_SO%
echo Ledger:  %LEDGER_DIR%
echo.

REM Check if we have admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Not running as Administrator!
    echo Solana test validator may fail to start on Windows without admin rights.
    echo.
    echo Right-click this file and select "Run as administrator".
    echo.
)

REM Verify the .so file exists
if not exist "%PROGRAM_SO%" (
    echo [ERROR] Program binary not found at %PROGRAM_SO%
    echo Run 'cargo build-sbf --optimize-size' first.
    pause
    exit /b 1
)
echo [OK] Program binary: %PROGRAM_SO%

REM Clean up old ledger
if exist "%LEDGER_DIR%" (
    echo [INFO] Cleaning old ledger...
    rmdir /s /q "%LEDGER_DIR%" 2>nul
)

REM Start test validator
echo.
echo [INFO] Starting Solana test validator...
echo [INFO] Check validator.log for progress
echo.

start "solana-test-validator" "%SOLANA_BIN%\solana-test-validator.exe" ^
    --bpf-program %PROGRAM_KEY% "%PROGRAM_SO%" ^
    --reset ^
    --ledger "%LEDGER_DIR%"

echo Waiting for validator to start...
echo.

set /a timeout=30
set /a elapsed=0

:wait_loop
    timeout /t 2 /nobreak >nul
    set /a elapsed+=2
    
    REM Check if validator is responding
    for /f "delims=" %%i in ('curl -s -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getHealth\"}" http://localhost:8899 2^>nul') do set health=%%i
    
    echo %health% | findstr "ok" >nul
    if !errorlevel! equ 0 (
        echo [OK] Solana test validator is running!
        goto :validator_ready
    )
    
    if !elapsed! geq %timeout% (
        echo [ERROR] Validator failed to start within %timeout% seconds.
        echo Check %LEDGER_DIR%\validator.log for details.
        type "%LEDGER_DIR%\validator.log" 2>nul
        pause
        exit /b 1
    )
    
    echo   Still waiting... (!elapsed!s / %timeout%s)
    goto :wait_loop

:validator_ready

REM Set environment for Anchor
set ANCHOR_PROVIDER_URL=http://localhost:8899
set ANCHOR_WALLET=%USERPROFILE%\.config\solana\id.json

REM Run TypeScript tests
echo.
echo ============================================================================
echo  Running TypeScript Tests
echo ============================================================================
echo.

cd /d "%PROJECT_DIR%\tests"
call npx ts-mocha -p tsconfig.json -t 60000 tipchain.ts

set TEST_RESULT=%errorLevel%

REM Stop the validator
echo.
echo [INFO] Stopping test validator...
taskkill /IM solana-test-validator.exe /F >nul 2>&1

if %TEST_RESULT% equ 0 (
    echo.
    echo ============================================================================
    echo  [PASS] All tests completed successfully!
    echo ============================================================================
) else (
    echo.
    echo ============================================================================
    echo  [FAIL] Some tests failed. Check output above.
    echo ============================================================================
)

echo.
pause
