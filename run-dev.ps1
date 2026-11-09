<#
.SYNOPSIS
    CodeForge AI Local Development Runner for Windows
.DESCRIPTION
    Starts the backend and frontend for local demonstration and testing.
#>

[CmdletBinding()]
param (
    [switch]$UseDocker,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "         CodeForge AI Multi-Agent System         " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

if ($UseDocker) {
    Write-Host "[+] Starting stack with Docker Compose..." -ForegroundColor Green
    docker compose up --build
    exit $LASTEXITCODE
}

# Ensure .env exists
if (-not (Test-Path "$RootDir\.env")) {
    Write-Host "[!] .env not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item "$RootDir\.env.example" "$RootDir\.env"
}

# Check for uv
$uvCmd = Get-Command uv -ErrorAction SilentlyContinue
if (-not $uvCmd) {
    Write-Error "uv is not installed. Please install uv (https://astral.sh/uv) or run via Docker Compose."
}

# 1. Start Backend
if (-not $FrontendOnly) {
    Write-Host "[+] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Green
    $BackendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$RootDir\backend`"; `$env:CODEFORGE_DATABASE_URL='sqlite:///./codeforge.db'; uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" -PassThru
    Write-Host "    Backend process started (PID: $($BackendJob.Id))" -ForegroundColor Gray
    Write-Host "    API Docs will be available at: http://127.0.0.1:8000/docs" -ForegroundColor Gray
}

# 2. Start Frontend
if (-not $BackendOnly) {
    Write-Host "[+] Starting Next.js Frontend Dashboard (Port 3000)..." -ForegroundColor Green
    $FrontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$RootDir\frontend`"; npm run dev -- --port 3000" -PassThru
    Write-Host "    Frontend process started (PID: $($FrontendJob.Id))" -ForegroundColor Gray
    Write-Host "    Dashboard will be available at: http://localhost:3000" -ForegroundColor Gray
}

Write-Host "`n[✓] Servers launched in separate terminal windows." -ForegroundColor Green
Write-Host "    - Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "    - API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor Cyan

