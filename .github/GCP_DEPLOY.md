# GitHub Actions → GCP (Cloud Run)

Workflow: [`.github/workflows/deploy-gcp.yml`](workflows/deploy-gcp.yml) runs [`scripts/deploy-gcp.sh`](../scripts/deploy-gcp.sh) on **push to `main`** (paths above) or **manual** run.

## Prerequisites

1. GCP project **billing enabled** and linked (e.g. `quizcred-513114`).
2. APIs will be enabled by the script on first run.
3. `DB_PASSWORD` must be **letters and numbers only** (Cloud SQL).

## 1. Create a deploy service account

In [Cloud Shell](https://console.cloud.google.com/cloudshell) (replace `quizcred-513114` with your project ID):

```bash
export PROJECT_ID="quizcred-513114"
gcloud config set project "$PROJECT_ID"

gcloud iam service-accounts create github-actions-deploy \
  --display-name="GitHub Actions deploy"

SA="github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com"

for ROLE in \
  roles/run.admin \
  roles/cloudbuild.builds.editor \
  roles/artifactregistry.admin \
  roles/cloudsql.admin \
  roles/serviceusage.serviceUsageAdmin \
  roles/resourcemanager.projectIamAdmin
do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA}" \
    --role="$ROLE" \
    --quiet
done

gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account="$SA"
```

Download `github-actions-key.json` from Cloud Shell (**User menu → Download file**), then **delete it from Cloud Shell** after adding to GitHub.

## 2. Add GitHub repository secrets

Repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Required | Example / notes |
|--------|----------|-----------------|
| `GCP_PROJECT_ID` | Yes | `quizcred-513114` |
| `GCP_SA_KEY` | Yes | Full JSON contents of `github-actions-key.json` |
| `DB_PASSWORD` | Yes | Alphanumeric Cloud SQL postgres password |
| `JWT_SECRET` | Yes | Long random string (`openssl rand -hex 32`) |
| `GCP_REGION` | No | Default `us-central1` |
| `SQL_INSTANCE` | No | Default `quiz-pg` |

Never commit these values to the repo.

## 3. Run the workflow

- **Actions → Deploy to GCP → Run workflow**, or push to `main` after the workflow file is merged.
- First run can take **30–60+ minutes** (Cloud SQL create + builds).
- Open the job **Summary** for Web / API / Docs URLs.

## 4. After deploy

- Test web URL with `user@quiz.com` / `User123!` (seed on boot).
- Update README deployment URLs if you document live links.

## Troubleshooting

| Issue | Check |
|-------|--------|
| Auth failed | `GCP_SA_KEY` is valid JSON; SA exists in the same project as `GCP_PROJECT_ID` |
| Billing disabled | Link billing to the project in console |
| SQL / build permission | SA has roles listed in step 1 |
| Payment account pending | Billing must be active before CI can create SQL or Cloud Build |

## Security note

Service account keys in GitHub secrets are simple for assignments; production teams often prefer [Workload Identity Federation](https://github.com/google-github-actions/auth#setting-up-workload-identity-federation) instead of long-lived JSON keys.
