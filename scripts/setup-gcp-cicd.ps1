# One-time CI/CD setup: Workload Identity Federation + GitHub Actions secrets.
# Prerequisites: gh auth login, gcloud auth login, billing enabled on the project.
# Org policy may block service account JSON keys; this script uses WIF instead.
#
# Usage:
#   $env:GCP_PROJECT_ID = "quizcred-513114"
#   $env:DB_PASSWORD = "YourAlphanumericPassword123"
#   $env:JWT_SECRET = "<optional; generated if omitted>"
#   .\scripts\setup-gcp-cicd.ps1

$ErrorActionPreference = "Stop"

$Gh = "C:\Program Files\GitHub CLI\gh.exe"
$Gcloud = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$Repo = "sriharsha1897/QuizCred"

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
  Write-Host "Generated JWT_SECRET."
}

$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$SaName = "github-actions-deploy"
$SaEmail = "${SaName}@${ProjectId}.iam.gserviceaccount.com"
$PoolId = "github-pool"
$ProviderId = "github-provider"

& $Gcloud config set project $ProjectId
$ProjectNumber = (& $Gcloud projects describe $ProjectId --format="value(projectNumber)").Trim()

$saExists = $false
& $Gcloud iam service-accounts describe $SaEmail 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { $saExists = $true }
if (-not $saExists) {
  & $Gcloud iam service-accounts create $SaName --display-name="GitHub Actions deploy"
}

$roles = @(
  "roles/run.admin",
  "roles/cloudbuild.builds.editor",
  "roles/artifactregistry.admin",
  "roles/cloudsql.admin",
  "roles/serviceusage.serviceUsageAdmin",
  "roles/serviceusage.serviceUsageConsumer",
  "roles/resourcemanager.projectIamAdmin",
  "roles/storage.admin",
  "roles/logging.logWriter"
)
foreach ($role in $roles) {
  & $Gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$SaEmail" `
    --role=$role `
    --quiet | Out-Null
}

& $Gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --quiet | Out-Null

$poolExists = $false
& $Gcloud iam workload-identity-pools describe $PoolId --location=global 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { $poolExists = $true }
if (-not $poolExists) {
  & $Gcloud iam workload-identity-pools create $PoolId --location=global --display-name="GitHub Actions"
}

$providerExists = $false
& $Gcloud iam workload-identity-pools providers describe $ProviderId --location=global --workload-identity-pool=$PoolId 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { $providerExists = $true }
if (-not $providerExists) {
  & $Gcloud iam workload-identity-pools providers create-oidc $ProviderId `
    --location=global `
    --workload-identity-pool=$PoolId `
    --display-name="GitHub" `
    --issuer-uri="https://token.actions.githubusercontent.com" `
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
    --attribute-condition="assertion.repository=='$Repo'"
}

$member = "principalSet://iam.googleapis.com/projects/$ProjectNumber/locations/global/workloadIdentityPools/$PoolId/attribute.repository/$Repo"
& $Gcloud iam service-accounts add-iam-policy-binding $SaEmail `
  --project=$ProjectId `
  --role="roles/iam.workloadIdentityUser" `
  --member=$member `
  --quiet | Out-Null

$ProviderResource = "projects/$ProjectNumber/locations/global/workloadIdentityPools/$PoolId/providers/$ProviderId"

Write-Host "Setting GitHub secrets on $Repo ..."
& $Gh secret set GCP_PROJECT_ID --body $ProjectId -R $Repo
& $Gh secret set GCP_SERVICE_ACCOUNT --body $SaEmail -R $Repo
& $Gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --body $ProviderResource -R $Repo
& $Gh secret set DB_PASSWORD --body $DbPassword -R $Repo
& $Gh secret set JWT_SECRET --body $JwtSecret -R $Repo
& $Gh secret set GCP_REGION --body $Region -R $Repo

Write-Host "Done. Push workflow, then: gh workflow run deploy-gcp.yml -R $Repo"
