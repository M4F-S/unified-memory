# Deploy static frontend to Cloudflare Pages
# Auth: wrangler OAuth only (npx wrangler login)
# Do NOT run from repo root - wrangler auto-loads .env and prefers CLOUDFLARE_API_TOKEN over OAuth.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$frontendDir = Join-Path $PSScriptRoot "..\frontend-test"
if (-not (Test-Path $frontendDir)) { throw "frontend-test/ not found at $frontendDir" }

function Clear-CfEnv {
    foreach ($name in @("CLOUDFLARE_API_TOKEN", "CF_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID")) {
        if (Test-Path "env:$name") { Remove-Item "env:$name" -ErrorAction SilentlyContinue }
        [Environment]::SetEnvironmentVariable($name, $null, "Process")
    }
}

Clear-CfEnv

Write-Host "Deploying $frontendDir to Cloudflare Pages..."
Write-Host "Using wrangler OAuth (workers/ cwd avoids loading repo-root .env)"
Write-Host ""

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
npx wrangler pages deploy $frontendDir --project-name unified-memory --branch main
$exit = $LASTEXITCODE
$ErrorActionPreference = $prevEap

if ($exit -ne 0) {
    Write-Host ""
    Write-Host "If you see 'custom API token' or code 9109:"
    Write-Host "  1. Comment out CLOUDFLARE_API_TOKEN in .env (OAuth is enough)"
    Write-Host "  2. Remove-Item Env:CLOUDFLARE_API_TOKEN"
    Write-Host "  3. npx wrangler login"
    throw "pages deploy failed (exit $exit)"
}

Write-Host ""
Write-Host "Done. URLs:"
Write-Host "  Home:    https://unified-memory.pages.dev"
Write-Host "  Onboard: https://unified-memory.pages.dev/onboard.html"
