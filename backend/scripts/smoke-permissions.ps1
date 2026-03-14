$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3012/api'
$envFile = 'L:\App\PulseControl\backend\.env'

$emailLine = Get-Content $envFile | Where-Object { $_ -match '^DEV_LOGIN_EMAIL=' } | Select-Object -First 1
$passLine = Get-Content $envFile | Where-Object { $_ -match '^DEV_LOGIN_PASSWORD=' } | Select-Object -First 1

$adminEmail = if ($emailLine) { ($emailLine -split '=', 2)[1] } else { 'admin@example.com' }
$adminPassword = if ($passLine) { ($passLine -split '=', 2)[1] } else { 'password123' }

$adminLoginBody = @{ email = $adminEmail; password = $adminPassword } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $adminLoginBody
$adminHeaders = @{ Authorization = "Bearer $($adminLogin.token)" }

$adminCtx = Invoke-RestMethod -Method Get -Uri "$base/auth/session-context" -Headers $adminHeaders
Write-Output "ADMIN_SCOPE=$($adminCtx.scope)"
Write-Output "ADMIN_PERMS=$($adminCtx.permissions -join ',')"

$companies = Invoke-RestMethod -Method Get -Uri "$base/companies?page=1&limit=1" -Headers $adminHeaders
if ($companies.items.Count -lt 1) {
  Write-Output 'FAIL_NO_COMPANY'
  exit 1
}

$companyId = [int]$companies.items[0].id
$companyNameBefore = [string]$companies.items[0].name
Write-Output "TEST_COMPANY_ID=$companyId"

$managerEmail = "manager_$([guid]::NewGuid().ToString('N').Substring(0,8))@test.local"
$managerCreateBody = @{
  email = $managerEmail
  password = 'Pass123!'
  role = 'manager'
  companyId = $companyId
} | ConvertTo-Json

$managerUser = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -Headers $adminHeaders -ContentType 'application/json' -Body $managerCreateBody
Write-Output "MANAGER_CREATED_ID=$($managerUser.id)"

$editedCompanyName = "$companyNameBefore EDIT"
$companyPatchBody = @{ name = $editedCompanyName } | ConvertTo-Json
$updatedCompany = Invoke-RestMethod -Method Patch -Uri "$base/companies/$companyId" -Headers $adminHeaders -ContentType 'application/json' -Body $companyPatchBody
if ($updatedCompany.name -eq $editedCompanyName) {
  Write-Output 'ADMIN_COMPANY_EDIT=PASS'
} else {
  Write-Output 'ADMIN_COMPANY_EDIT=FAIL'
}

$restoreCompanyBody = @{ name = $companyNameBefore } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "$base/companies/$companyId" -Headers $adminHeaders -ContentType 'application/json' -Body $restoreCompanyBody | Out-Null

$editedManagerEmail = "manager_edit_$([guid]::NewGuid().ToString('N').Substring(0,8))@test.local"
$userPatchBody = @{ email = $editedManagerEmail; role = 'manager'; companyId = $companyId } | ConvertTo-Json
$updatedUser = Invoke-RestMethod -Method Patch -Uri "$base/auth/users/$($managerUser.id)" -Headers $adminHeaders -ContentType 'application/json' -Body $userPatchBody
if ($updatedUser.email -eq $editedManagerEmail) {
  Write-Output 'ADMIN_USER_EDIT=PASS'
} else {
  Write-Output 'ADMIN_USER_EDIT=FAIL'
}

$managerLoginBody = @{ email = $editedManagerEmail; password = 'Pass123!' } | ConvertTo-Json
$managerLogin = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $managerLoginBody
$managerHeaders = @{ Authorization = "Bearer $($managerLogin.token)" }

$managerCtx = Invoke-RestMethod -Method Get -Uri "$base/auth/session-context" -Headers $managerHeaders
Write-Output "MANAGER_SCOPE=$($managerCtx.scope)"
Write-Output "MANAGER_PERMS=$($managerCtx.permissions -join ',')"

$managerUsers = Invoke-RestMethod -Method Get -Uri "$base/auth/users?page=1&limit=50" -Headers $managerHeaders
$offTenantUsers = @($managerUsers.items | Where-Object { $_.companyId -ne $companyId })
if ($offTenantUsers.Count -eq 0) {
  Write-Output 'MANAGER_USERS_SCOPE=PASS'
} else {
  Write-Output "MANAGER_USERS_SCOPE=FAIL_OFFTENANT_$($offTenantUsers.Count)"
}

$managerCompanies = Invoke-RestMethod -Method Get -Uri "$base/companies?page=1&limit=50" -Headers $managerHeaders
$offTenantCompanies = @($managerCompanies.items | Where-Object { $_.id -ne $companyId })
if ($offTenantCompanies.Count -eq 0 -and $managerCompanies.items.Count -ge 1) {
  Write-Output 'MANAGER_COMPANIES_SCOPE=PASS'
} else {
  Write-Output "MANAGER_COMPANIES_SCOPE=FAIL_COUNT_$($managerCompanies.items.Count)_OFF_$($offTenantCompanies.Count)"
}

$failEmail = "blocked_$([guid]::NewGuid().ToString('N').Substring(0,8))@test.local"
try {
  $blockedBody = @{ email = $failEmail; password = 'Pass123!'; role = 'user'; companyId = $companyId } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "$base/auth/register" -Headers $managerHeaders -ContentType 'application/json' -Body $blockedBody | Out-Null
  Write-Output 'MANAGER_REGISTER_BLOCK=FAIL'
} catch {
  Write-Output 'MANAGER_REGISTER_BLOCK=PASS'
}

try {
  $blockedUserPatch = @{ role = 'user'; companyId = $companyId } | ConvertTo-Json
  Invoke-RestMethod -Method Patch -Uri "$base/auth/users/$($managerUser.id)" -Headers $managerHeaders -ContentType 'application/json' -Body $blockedUserPatch | Out-Null
  Write-Output 'MANAGER_USER_EDIT_BLOCK=FAIL'
} catch {
  Write-Output 'MANAGER_USER_EDIT_BLOCK=PASS'
}

try {
  $blockedCompanyPatch = @{ name = "$companyNameBefore BLOCK" } | ConvertTo-Json
  Invoke-RestMethod -Method Patch -Uri "$base/companies/$companyId" -Headers $managerHeaders -ContentType 'application/json' -Body $blockedCompanyPatch | Out-Null
  Write-Output 'MANAGER_COMPANY_EDIT_BLOCK=FAIL'
} catch {
  Write-Output 'MANAGER_COMPANY_EDIT_BLOCK=PASS'
}
