# Deploy UnifiedMemory MCP Worker to Cloudflare
# Prereq: CLOUDFLARE_API_TOKEN env var OR wrangler login

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) { throw ".env not found at $envFile" }

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Don't overwrite real CF creds with .env placeholders
        if ($name -eq "CLOUDFLARE_ACCOUNT_ID" -and $value -match "YOUR_") { return }
        if ($name -eq "CLOUDFLARE_API_TOKEN" -and $value -match "YOUR_") { return }
        Set-Item -Path "env:$name" -Value $value
    }
}

foreach ($key in @("OPENROUTER_API_KEY", "PINECONE_API_KEY")) {
    $val = [Environment]::GetEnvironmentVariable($key)
    if (-not $val -or $val -match "YOUR_") {
        throw "Missing $key in .env"
    }
}

if ($env:CLOUDFLARE_ACCOUNT_ID -match "YOUR_") {
    Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
}

function Set-WranglerSecret($name, $value) {
    $value | npx wrangler secret put $name
    if ($LASTEXITCODE -ne 0) { throw "wrangler secret put $name failed" }
}

Write-Host "Setting wrangler secrets..."
Set-WranglerSecret "OPENROUTER_API_KEY" $env:OPENROUTER_API_KEY
Set-WranglerSecret "PINECONE_API_KEY" $env:PINECONE_API_KEY

if ($env:CIRCLE_API_KEY -and $env:CIRCLE_API_KEY -notmatch "YOUR_") {
    Set-WranglerSecret "CIRCLE_API_KEY" $env:CIRCLE_API_KEY
}

Write-Host "Deploying worker..."
npx wrangler deploy
if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed" }

Write-Host ""
Write-Host "Done. Copy the workers.dev URL from output above into .env as MCP_URL."
