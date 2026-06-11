param(
  [string]$AwsRegion = "us-east-1",
  [string]$SecretFile = "$PSScriptRoot\backend-secrets.json",
  [string]$SshPrivateKey = "$HOME\.ssh\ca-client-tracker"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$terraformDir = Join-Path $root "terraform"
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "ca-client-tracker-deploy"
$archive = Join-Path $tempDir "backend.tar.gz"
$envFile = Join-Path $tempDir "backend.env"

function Assert-LastExitCode {
  param([string]$Step)
  if ($LASTEXITCODE -ne 0) {
    throw "$Step failed with exit code $LASTEXITCODE"
  }
}

function Assert-SingleLine {
  param([string]$Name, [string]$Value)
  if ($Value -match "[`r`n]") {
    throw "$Name must not contain line breaks."
  }
}

if (-not (Test-Path -LiteralPath $SecretFile)) {
  throw "Create $SecretFile from deploy/backend-secrets.example.json before deploying."
}
if (-not (Test-Path -LiteralPath $SshPrivateKey)) {
  throw "SSH private key not found at $SshPrivateKey. Generate it as described in the deployment guide."
}

terraform "-chdir=$terraformDir" init
Assert-LastExitCode "terraform init"

terraform "-chdir=$terraformDir" apply -var "aws_region=$AwsRegion"
Assert-LastExitCode "terraform apply"

$instanceIp = terraform "-chdir=$terraformDir" output -raw backend_public_ip
Assert-LastExitCode "reading EC2 public IP"
$bucket = terraform "-chdir=$terraformDir" output -raw frontend_bucket_name
Assert-LastExitCode "reading S3 output"
$distribution = terraform "-chdir=$terraformDir" output -raw cloudfront_distribution_id
Assert-LastExitCode "reading CloudFront output"
$applicationUrl = terraform "-chdir=$terraformDir" output -raw application_url
Assert-LastExitCode "reading application URL"
$originSecret = terraform "-chdir=$terraformDir" output -raw origin_verify_secret
Assert-LastExitCode "reading origin secret"

Write-Host ""
Write-Host "Add this address to MongoDB Atlas Network Access:"
Write-Host "$instanceIp/32"
Read-Host "Press Enter after Atlas shows the address as Active"

$secrets = Get-Content -LiteralPath $SecretFile -Raw | ConvertFrom-Json
$requiredSecrets = @("MONGODB_URI", "JWT_SECRET", "INTERNAL_REGISTRATION_SECRET")
foreach ($name in $requiredSecrets) {
  $value = [string]$secrets.$name
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$name is required in $SecretFile."
  }
}

$environment = [ordered]@{
  NODE_ENV                    = "production"
  PORT                        = "5000"
  TZ                          = "Asia/Kolkata"
  CORS_ORIGINS                = $applicationUrl
  ORIGIN_VERIFY_SECRET        = $originSecret
  MONGODB_URI                 = [string]$secrets.MONGODB_URI
  JWT_SECRET                  = [string]$secrets.JWT_SECRET
  INTERNAL_REGISTRATION_SECRET = [string]$secrets.INTERNAL_REGISTRATION_SECRET
  CLOUDINARY_CLOUD_NAME       = [string]$secrets.CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY          = [string]$secrets.CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET       = [string]$secrets.CLOUDINARY_API_SECRET
}

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$envLines = foreach ($entry in $environment.GetEnumerator()) {
  Assert-SingleLine -Name $entry.Key -Value $entry.Value
  "$($entry.Key)=$($entry.Value)"
}
[System.IO.File]::WriteAllLines(
  $envFile,
  [string[]]$envLines,
  [System.Text.UTF8Encoding]::new($false)
)

if (Test-Path -LiteralPath $archive) {
  Remove-Item -LiteralPath $archive -Force
}
tar.exe -czf $archive --exclude=node_modules --exclude=uploads --exclude=.env -C $backendDir .
Assert-LastExitCode "creating backend archive"

$sshTarget = "ec2-user@$instanceIp"
$sshOptions = @(
  "-i", $SshPrivateKey,
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "ConnectTimeout=10"
)

Write-Host "Waiting for EC2 and Docker initialization..."
$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
  ssh @sshOptions $sshTarget "sudo docker version >/dev/null 2>&1"
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 10
}
if (-not $ready) {
  throw "EC2 did not become ready for deployment."
}

scp @sshOptions $archive "${sshTarget}:/tmp/backend.tar.gz"
Assert-LastExitCode "uploading backend archive"
scp @sshOptions $envFile "${sshTarget}:/tmp/backend.env"
Assert-LastExitCode "uploading backend environment"

$remoteDeploy = @'
set -e
mkdir -p /home/ec2-user/app/backend /home/ec2-user/app/uploads
find /home/ec2-user/app/backend -mindepth 1 -delete
tar -xzf /tmp/backend.tar.gz -C /home/ec2-user/app/backend
mv /tmp/backend.env /home/ec2-user/app/backend.env
chmod 600 /home/ec2-user/app/backend.env
sudo docker build -t ca-client-tracker-backend /home/ec2-user/app/backend
sudo docker rm -f ca-client-tracker-backend >/dev/null 2>&1 || true
sudo docker run -d \
  --name ca-client-tracker-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file /home/ec2-user/app/backend.env \
  -v /home/ec2-user/app/uploads:/app/uploads \
  ca-client-tracker-backend
'@
ssh @sshOptions $sshTarget $remoteDeploy
Assert-LastExitCode "deploying backend container"

Push-Location $frontendDir
try {
  npm.cmd ci
  Assert-LastExitCode "installing frontend dependencies"
  npm.cmd run build
  Assert-LastExitCode "building frontend"
} finally {
  Pop-Location
}

aws s3 sync (Join-Path $frontendDir "dist") "s3://$bucket" --delete --region $AwsRegion
Assert-LastExitCode "uploading frontend"

aws cloudfront create-invalidation `
  --distribution-id $distribution `
  --paths "/*" | Out-Null
Assert-LastExitCode "invalidating CloudFront"

Remove-Item -LiteralPath $archive, $envFile -Force

Write-Host ""
Write-Host "Deployment completed."
Write-Host "Application: $applicationUrl"
Write-Host "MongoDB Atlas allowlist: $instanceIp/32"
