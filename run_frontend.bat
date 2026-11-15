@echo off
title CodeForge AI - Full Stack Launcher
cd /d "%~dp0"

echo ===================================================
echo           CodeForge AI Multi-Agent System          
echo ===================================================
echo [1/4] Checking environment configuration...

if not exist ".env" (
    echo [!] .env not found. Creating from .env.example...
    copy ".env.example" ".env" >nul
)

echo [2/4] Launching FastAPI Backend (Port 8000)...
if exist "%~dp0backend\.venv\Scripts\uvicorn.exe" (
    start "CodeForge AI - Backend (Port 8000)" /D "%~dp0backend" cmd /k "set CODEFORGE_DATABASE_URL=sqlite:///./codeforge.db&& "%~dp0backend\.venv\Scripts\uvicorn.exe" app.main:app --reload --host 127.0.0.1 --port 8000"
) else (
    start "CodeForge AI - Backend (Port 8000)" /D "%~dp0backend" cmd /k "set CODEFORGE_DATABASE_URL=sqlite:///./codeforge.db&& uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
)

echo [3/4] Launching Next.js Frontend Dashboard (Port 3000)...
start "CodeForge AI - Frontend (Port 3000)" /D "%~dp0frontend" cmd /k "npm run dev -- --port 3000"

echo [4/4] Waiting for services to initialize...
ping 127.0.0.1 -n 6 >nul

echo [OK] Opening CodeForge AI in your default web browser...
start http://localhost:3000

echo.
echo ===================================================
echo   CodeForge AI is now running successfully!
echo.
echo   - Frontend Dashboard: http://localhost:3000
echo   - Backend Swagger:    http://127.0.0.1:8000/docs
echo   - Health Endpoint:    http://127.0.0.1:8000/api/v1/health
echo ===================================================
echo.
echo Leave this launcher open or close it when done.
echo To stop services, close the Backend and Frontend command windows.
pause
