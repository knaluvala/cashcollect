$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir
$Dist = Join-Path $WorkspaceRoot "artifacts\api-server\dist\index.mjs"

Push-Location $WorkspaceRoot
try {
    if (-not (Test-Path $Dist)) {
        Write-Host "Building API server (first run)..."
        pnpm --filter @workspace/api-server build
    } else {
        Write-Host "Skipping API build -- dist already exists."
    }

    Write-Host "Starting API server on 3000..."
    $env:PORT = "3000"
    $apiProcess = Start-Process -FilePath "pnpm" -ArgumentList "--filter", "@workspace/api-server", "start" -PassThru -NoNewWindow

    try {
        Write-Host "Waiting for API server..."
        $ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/healthz" -UseBasicParsing -TimeoutSec 2
                if ($response.StatusCode -eq 200) {
                    Write-Host "API server is ready"
                    $ready = $true
                    break
                }
            } catch {}
            Start-Sleep -Seconds 1
        }
        if (-not $ready) {
            Write-Warning "API server did not become ready in time; continuing anyway."
        }

        Write-Host "Starting CashCollect frontend on 5173..."
        $env:PORT = "5173"
        $env:BASE_PATH = "/"
        $env:VITE_PORT = "5173"
        pnpm --filter @workspace/cashcollect dev
    } finally {
        Stop-Process -Id $apiProcess.Id -ErrorAction SilentlyContinue
    }
} finally {
    Pop-Location
}
