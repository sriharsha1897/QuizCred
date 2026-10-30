#!/usr/bin/env bash
# Deploy the API and web app to Cloud Run with Cloud SQL for PostgreSQL.
# Run from Cloud Shell or any shell where gcloud and billing are already set up.
#
# Required environment:
#   GCP_PROJECT_ID   GCP project id
#   DB_PASSWORD      alphanumeric Cloud SQL postgres password
#   JWT_SECRET       long random string
#
# Optional:
#   GCP_REGION       default us-central1
#   SQL_INSTANCE     default quiz-pg
#   PUBLIC_API_URL   browser-facing API (DigitalAPI gateway); baked into the web image

set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${DB_PASSWORD:?Set DB_PASSWORD to an alphanumeric password}"
: "${JWT_SECRET:?Set JWT_SECRET}"

REGION="${GCP_REGION:-us-central1}"
SQL_INSTANCE="${SQL_INSTANCE:-quiz-pg}"
PUBLIC_API_URL="${PUBLIC_API_URL:-https://personal-test.ft-gateway.digitalapicraft.com}"
PUBLIC_API_URL="${PUBLIC_API_URL%/}"
REPO="quiz"
API_IMAGE="${REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO}/api:latest"
WEB_IMAGE="${REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO}/web:latest"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

gcloud config set project "$GCP_PROJECT_ID"
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Quiz application images"
fi

if ! gcloud sql instances describe "$SQL_INSTANCE" >/dev/null 2>&1; then
  gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_16 \
    --edition=enterprise \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-size=10GB \
    --root-password="$DB_PASSWORD"
fi

gcloud sql databases create quiz --instance="$SQL_INSTANCE" >/dev/null 2>&1 || true

CONN="$(gcloud sql instances describe "$SQL_INSTANCE" --format='value(connectionName)')"
PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client" \
  --quiet >/dev/null

build_api_image() {
  if [ "${USE_DOCKER_BUILD:-}" = "1" ]; then
    gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
    docker build -t "$API_IMAGE" "$ROOT/backend"
    docker push "$API_IMAGE"
  else
    gcloud builds submit "$ROOT/backend" \
      --config "$ROOT/backend/cloudbuild.yaml" \
      --substitutions "_IMAGE=${API_IMAGE}"
  fi
}

build_api_image

gcloud run deploy quiz-api \
  --image "$API_IMAGE" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --add-cloudsql-instances "$CONN" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET},JWT_EXPIRES_IN=1d,SEED_ON_BOOT=true,CORS_ORIGIN=http://localhost:3000" \
  --set-env-vars "DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@localhost/quiz?host=/cloudsql/${CONN}"

API_URL="$(gcloud run services describe quiz-api --region "$REGION" --format='value(status.url)')"

if [ "${USE_DOCKER_BUILD:-}" = "1" ]; then
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
  docker build --build-arg "NEXT_PUBLIC_API_URL=${PUBLIC_API_URL}" -t "$WEB_IMAGE" "$ROOT/frontend"
  docker push "$WEB_IMAGE"
else
  gcloud builds submit "$ROOT/frontend" \
    --config "$ROOT/frontend/cloudbuild.yaml" \
    --substitutions "_IMAGE=${WEB_IMAGE},_API_URL=${PUBLIC_API_URL}"
fi

gcloud run deploy quiz-web \
  --image "$WEB_IMAGE" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi

WEB_URL="$(gcloud run services describe quiz-web --region "$REGION" --format='value(status.url)' | tr -d '\r\n')"
PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
WEB_ALT_URL="https://quiz-web-${PROJECT_NUMBER}.${REGION}.run.app"
# --update-env-vars cannot put commas/semicolons in values; YAML file sets the full env block safely.
API_ENV_FILE="$(mktemp)"
trap 'rm -f "$API_ENV_FILE"' EXIT
{
  printf 'JWT_SECRET: "%s"\n' "$JWT_SECRET"
  printf 'JWT_EXPIRES_IN: "1d"\n'
  printf 'SEED_ON_BOOT: "true"\n'
  printf 'CORS_ORIGIN: "%s,%s"\n' "$WEB_URL" "$WEB_ALT_URL"
  printf 'DATABASE_URL: "postgresql://postgres:%s@localhost/quiz?host=/cloudsql/%s"\n' "$DB_PASSWORD" "$CONN"
} >"$API_ENV_FILE"
gcloud run services update quiz-api \
  --region "$REGION" \
  --env-vars-file="$API_ENV_FILE"

echo "API (Cloud Run upstream): ${API_URL}"
echo "API (public / web client):  ${PUBLIC_API_URL}"
echo "Web:                        ${WEB_URL}"
echo "Docs (upstream):            ${API_URL}/docs"
echo "Write these URLs into the README deployment section."
