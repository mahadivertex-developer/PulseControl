param(
    [string]$Branch = "main",
    [switch]$NoStash
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$git = "git"
$gitExe = "C:\Program Files\Git\cmd\git.exe"
if (Test-Path $gitExe) {
    $git = $gitExe
}

function Invoke-Git {
    param([string[]]$GitArgs)
    & $git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($GitArgs -join ' ')"
    }
}

Write-Host "Syncing repository in $repoRoot" -ForegroundColor Cyan

$currentBranch = (& $git branch --show-current).Trim()
if (-not $currentBranch) {
    throw "Unable to detect current branch."
}

if ($currentBranch -ne $Branch) {
    Write-Host "Switching branch $currentBranch -> $Branch" -ForegroundColor Yellow
    Invoke-Git -GitArgs @("checkout", $Branch)
}

$status = (& $git status --porcelain)
$hasLocalChanges = -not [string]::IsNullOrWhiteSpace(($status | Out-String))
$stashName = ""

if ($hasLocalChanges -and -not $NoStash) {
    $stashName = "auto-sync-$(Get-Date -Format yyyyMMdd-HHmmss)"
    Write-Host "Stashing local changes: $stashName" -ForegroundColor Yellow
    Invoke-Git -GitArgs @("stash", "push", "-u", "-m", $stashName)
} elseif ($hasLocalChanges -and $NoStash) {
    throw "Local changes detected. Commit/stash manually or rerun without -NoStash."
}

Write-Host "Fetching latest changes..." -ForegroundColor Cyan
Invoke-Git -GitArgs @("fetch", "origin", "--prune")

Write-Host "Rebasing $Branch from origin/$Branch..." -ForegroundColor Cyan
Invoke-Git -GitArgs @("pull", "--rebase", "origin", $Branch)

if ($stashName) {
    Write-Host "Restoring stashed changes..." -ForegroundColor Cyan
    & $git stash pop
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Stash restored with conflicts. Resolve conflicts, then continue."
    }
}

Write-Host "Sync complete." -ForegroundColor Green
& $git status --short
