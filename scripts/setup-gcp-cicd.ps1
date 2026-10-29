# One-time CI/CD setup: GCP service account + GitHub Actions secrets.
# Prerequisites: gh auth login, gcloud auth login, billing enabled on the project.
#
# Usage:
#   $env:GCP_PROJECT_ID = "quizcred-513114"
#   $env:DB_PASSWORD = "YourAlphanumericPassword123"
#   $env:JWT_SECRET = "<openssl rand -hex 32>"
#   .\scripts\setup-gcp-cicd.ps1

$ErrorActionPreference = "Stop"

$Gh = "C:\Program Files\GitHub CLI\gh.exe"
$Gcloud = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

if (-not (Test-Path $Gh)) { throw "Install GitHub CLI (winget install GitHub.cli)" }
if (-not (Test-Path $Gcloud)) { throw "Install Google Cloud SDK (winget install Google.CloudSDK)" }

& $Gh auth status | Out-Null

$ProjectId = $env:GCP_PROJECT_ID
if (-not $ProjectId) { $ProjectId = Read-Host "GCP project ID (e.g. quizcred-513114)" }

$DbPassword = $env:DB_PASSWORD
if (-not $DbPassword) { $DbPassword = Read-Host "Cloud SQL password (letters and numbers only)" }

$JwtSecret = $env:JWT_SECRET
if (-not $JwtSecret) {
  $JwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
  Write-Host "Generated JWT_SECRET (also stored in GitHub secret)."
}

$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$SaName = "github-actions-deploy"
$SaEmail = "${SaName}@${ProjectId}.iam.gserviceaccount.com"
$KeyFile = Join-Path $env:TEMP "github-actions-key.json"

& $Gcloud config set project $ProjectId

$saList = & $Gcloud iam service-accounts list --filter="email:$SaEmail" --format="value(email)" 2>$null
if (-not $saList) {
  & $Gcloud iam service-accounts create $SaName --display-name="GitHub Actions deploy"
}

$roles = @(
  "roles/run.admin",
  "roles/cloudbuild.builds.editor",
  "roles/artifactregistry.admin",
  "roles/cloudsql.admin",
  "roles/serviceusage.serviceUsageAdmin",
  "roles/resourcemanager.projectIamAdmin"
)
foreach ($role in $roles) {
  & $Gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$SaEmail" `
    --role=$role `
    --quiet | Out-Null
}

if (Test-Path $KeyFile) { Remove-Item $KeyFile -Force }
& $Gcloud iam service-accounts keys create $KeyFile --iam-account=$SaEmail

Write-Host "Setting GitHub secrets on sriharsha1897/QuizCred ..."
$keyJson = Get-Content $KeyFile -Raw
& $Gh secret set GCP_PROJECT_ID --body $ProjectId --repo sriharsha1897/QuizCred
& $Gh secret set GCP_SA_KEY --body $keyJson --repo sriharsha1897/QuizCred
& $Gh secret set DB_PASSWORD --body $DbPassword --repo sriharsha1897/QuizCred
& $Gh secret set JWT_SECRET --body $JwtSecret --repo sriharsha1897/QuizCred
& $Gh secret set GCP_REGION --body $Region --repo sriharsha1897/QuizCred

Remove-Item $KeyFile -Force
Write-Host "Done. Run: gh workflow run deploy-gcp.yml --repo sriharsha1897/QuizCred"
