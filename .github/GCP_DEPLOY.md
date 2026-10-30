# GitHub Actions → GCP (Cloud Run)

Workflow: [`.github/workflows/deploy-gcp.yml`](workflows/deploy-gcp.yml) runs [`scripts/deploy-gcp.sh`](../scripts/deploy-gcp.sh) on **push to `main`** (matching paths) or **manual** run.

Authentication uses **Workload Identity Federation** (no long-lived JSON keys). Many orgs block `iam.disableServiceAccountKeyCreation`.

## One-command setup (Windows)

After `gh auth login` and `gcloud auth login`:

```powershell
$env:GCP_PROJECT_ID = "quizcred-513114"
$env:DB_PASSWORD = "YourAlphanumericPassword123"
.\scripts\setup-gcp-cicd.ps1
```

This creates the deploy service account, WIF pool/provider, IAM bindings, and GitHub secrets.

## GitHub repository secrets (manual reference)

| Secret | Example |
|--------|---------|
| `GCP_PROJECT_ID` | `quizcred-513114` |
| `GCP_SERVICE_ACCOUNT` | `github-actions-deploy@quizcred-513114.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/425855099596/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `DB_PASSWORD` | Alphanumeric only |
| `JWT_SECRET` | Long random string |
| `GCP_REGION` | Optional, default `us-central1` |
| `SQL_INSTANCE` | Optional, default `quiz-pg` |

The deployed **web** app calls the public DigitalAPI gateway (`https://personal-test.ft-gateway.digitalapicraft.com`) via `NEXT_PUBLIC_API_URL`, not the raw Cloud Run API URL. Override at deploy time with env `PUBLIC_API_URL` (see `scripts/deploy-gcp.sh`).

Set under **Settings → Secrets and variables → Actions**, or `gh secret set NAME --body VALUE -R sriharsha1897/QuizCred`.

## Run deploy

```bash
gh workflow run deploy-gcp.yml -R sriharsha1897/QuizCred
```

Or **Actions → Deploy to GCP → Run workflow**.

First run may take **30–60+ minutes** (Cloud SQL + Cloud Build). Job **Summary** lists Web / API / Docs URLs.

## Prerequisites

- Project **billing enabled** and payment account healthy.
- `DB_PASSWORD` must stay stable after Cloud SQL is created (or update Cloud SQL user password to match).

## Troubleshooting

| Issue | Check |
|-------|--------|
| `billing disabled` | Link billing to the project |
| WIF auth failed | Secrets match project number; repo is exactly `sriharsha1897/QuizCred` |
| SQL / build errors | Cloud Build logs in GCP console |
| Payment pending | ₹ prepayment must post before APIs run |
