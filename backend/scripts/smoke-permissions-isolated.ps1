$ErrorActionPreference = 'Stop'

$backendRoot = 'L:\App\PulseControl\backend'
$port = 3012
$logPath = Join-Path $backendRoot 'scripts\smoke-permissions-isolated.log'

function Stop-ListenerIfExists {
  param([int]$Port)

  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
  }
}

Stop-ListenerIfExists -Port $port

if (Test-Path $logPath) {
  Remove-Item $logPath -Force
}

$backendProcess = $null
try {
  $backendProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run start:dev:3012 > scripts\\smoke-permissions-isolated.log 2>&1' -WorkingDirectory $backendRoot -PassThru

  $maxWaitSeconds = 40
  $elapsed = 0
  do {
    Start-Sleep -Seconds 1
    $elapsed += 1
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  } until ($conn -or $elapsed -ge $maxWaitSeconds -or $backendProcess.HasExited)

  if (-not $conn) {
    $tail = if (Test-Path $logPath) { (Get-Content $logPath -Tail 30) -join "`n" } else { 'No startup log file found.' }
    throw "Backend did not start on port $port within $maxWaitSeconds seconds.`nStartup log tail:`n$tail"
  }

  & "$backendRoot\scripts\smoke-permissions.ps1"
}
finally {
  if ($backendProcess -and -not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
  }

  Stop-ListenerIfExists -Port $port
}
