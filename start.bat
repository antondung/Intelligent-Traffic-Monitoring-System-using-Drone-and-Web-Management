@echo off
title SENTINEL AI — Start System
color 0B
cls

echo =====================================================================
echo    ███████ ███████ ███    ██ ████████ ██ ███    ██ ███████ ██      
echo    ██      ██      ████   ██    ██    ██ ████   ██ ██      ██      
echo    ███████ █████   ██ ██  ██    ██    ██ ██ ██  ██ █████   ██      
echo         ██ ██      ██  ██ ██    ██    ██ ██  ██ ██ ██      ██      
echo    ███████ ███████ ██   ████    ██    ██ ██   ████ ███████ ███████ 
echo =====================================================================
echo             REAL-TIME PRODUCTION AI TRAFFIC MONITORING
echo =====================================================================
echo.
echo [1/3] Launching FastAPI Backend Server...
echo       - Python Interpreter: backend\.venv\Scripts\python.exe (Python 3.11.9 Stable)
echo       - Backend Entry: backend/run.py (Port 8000)
echo       - GPU / Model Preloading (best.pt + plate_detector.pt)
start "SENTINEL Backend - FastAPI" cmd /k "color 0E && cd backend && .venv\Scripts\python.exe run.py"

echo.
echo [2/3] Launching Vite Frontend Server...
echo       - Frontend Dev Server: Port 3000
start "SENTINEL Frontend - Vite" cmd /k "color 0A && npm.cmd run dev"

echo.
echo [3/3] Waiting for AI Pipeline to Preload Models...
echo       Please wait 10 seconds for YOLOv8, Plate Detector, and EasyOCR models to initialize...
echo.

:: Simple delay loop for 10 seconds
timeout /t 10 /nobreak >nul

echo ─────────────────────────────────────────────────────────────────────
echo  AI PIPELINE & SERVER HEALTH VERIFICATION
echo ─────────────────────────────────────────────────────────────────────
echo Sending GET request to backend health check: http://localhost:8000/api/health
echo.

:: Run curl health check
curl -s http://localhost:8000/api/health
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ✗ [ERROR] Health check failed to connect.
    echo           Please check the "SENTINEL Backend" console window for details or errors.
    echo ─────────────────────────────────────────────────────────────────────
    pause
    exit /b 1
)

echo.
echo.
echo ✓ [SUCCESS] Health check returned successfully! The AI Engine is online.
echo.
echo ─────────────────────────────────────────────────────────────────────
echo  ACTIVE SERVICE ENDPOINTS
echo ─────────────────────────────────────────────────────────────────────
echo   ► Vite Web Frontend:  http://localhost:3000
echo   ► REST Backend API:   http://localhost:8000
echo   ► REST Swagger Docs:  http://localhost:8000/docs
echo   ► WebSocket Stream:   ws://localhost:8000/ws/live/{session_id}
echo ─────────────────────────────────────────────────────────────────────
echo.
echo Press any key to exit this starter console. The servers will continue running.
pause >nul
