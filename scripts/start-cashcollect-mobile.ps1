$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir

Push-Location $WorkspaceRoot
try {
    Write-Host "Building API server..."
    pnpm --filter @workspace/api-server build

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

        Write-Host "Starting CashCollect mobile web on 8082..."
        $env:PORT = "8082"
        if (-not $env:EXPO_PUBLIC_API_BASE_URL) {
            $env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000"
        }
        pnpm --filter @workspace/cashcollect-mobile dev
    } finally {
        Stop-Process -Id $apiProcess.Id -ErrorAction SilentlyContinue
    }
} finally {
    Pop-Location
}
