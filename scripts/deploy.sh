#!/bin/bash
set -euo pipefail

# Required: RAPIDS_PROJECT_ID, IMAGE_NAME, RAPIDS_VERTICAL_NAME, LOAD_BALANCER_VERSION, FULLY_QUALIFIED_DOMAIN

PATH=$PATH:/gcloud/bin
gcloud config set project "${RAPIDS_PROJECT_ID}"

INTERNAL_SERVICES_URL=$(gcloud secrets versions access "latest" --secret "ServicesInternalURL" --project="${RAPIDS_PROJECT_ID}")
echo "INTERNAL_SERVICES_URL: ${INTERNAL_SERVICES_URL}"

# Convert vx.y.z -> vx-y-z for Cloud Run tag
TAG_FORMATTED=${RAPIDS_VERTICAL_NAME//./-}

# DB settings
DB_INSTANCE_NAME="rpds-chat-rx-test"
DB_USER="testuser"
DB_PASS_RAW='245325!Ad342432'   # TODO: move to Secret Manager

# Get private IP of the Cloud SQL instance
PRIVATE_IP=$(gcloud sql instances describe "${DB_INSTANCE_NAME}" \
  --project="${RAPIDS_PROJECT_ID}" \
  --format="value(ipAddresses[0].ipAddress)")

if [[ -z "${PRIVATE_IP}" ]]; then
  echo "ERROR: No private IP found for instance ${DB_INSTANCE_NAME} in project ${RAPIDS_PROJECT_ID}."
  exit 1
fi

echo "DB ${DB_INSTANCE_NAME} Connection Info - Host: ${PRIVATE_IP}, User: ${DB_USER}"

POSTGRES_URL="postgresql://${DB_USER}:${DB_PASS_RAW}@${PRIVATE_IP}:5432"

# ForgeRock sandbox test envs
FORGEROCK_CLIENT_ID=rPdSbGszH7NywPEmNV8
FORGEROCK_CLIENT_SECRET=bRWkDxk3QnpAwboxvjTb9yJKvKD6D5ntCMXPjwnD
FORGEROCK_ISSUER=https://openam-telushealth-sandboxnane1.forgeblocks.com/am/oauth2/alpha

echo "Deploying '$1' image ${IMAGE_NAME}, tag ${TAG_FORMATTED}"
gcloud run deploy "$1" \
  --image="${IMAGE_NAME}" \
  --min-instances="0" \
  --max-instances="10" \
  --concurrency="100" \
  --cpu="1" \
  --memory="1Gi" \
  --no-cpu-throttling \
  --region="northamerica-northeast1" \
  --no-allow-unauthenticated \
  --service-account="rapids-api-cloud-run-sa@${RAPIDS_PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="RAPIDS_PROJECT_ID=${RAPIDS_PROJECT_ID},LW_CLOUDRUN_ENV_GEN=gen1,RAPIDS_VERTICAL_NAME=${RAPIDS_VERTICAL_NAME},FULLY_QUALIFIED_DOMAIN=${FULLY_QUALIFIED_DOMAIN},NODE_ENV=production,AUTH_SECRET=123456789,POSTGRES_URL=${POSTGRES_URL},FORGEROCK_CLIENT_ID=${FORGEROCK_CLIENT_ID},FORGEROCK_CLIENT_SECRET=${FORGEROCK_CLIENT_SECRET},FORGEROCK_ISSUER=${FORGEROCK_ISSUER}" \
  --set-secrets="LaceworkAccessToken=LaceworkAccessToken:latest,LaceworkServerUrl=LaceworkServerUrl:latest" \
  --vpc-connector="kong-vpc-connector-${LOAD_BALANCER_VERSION}" \
  --egress-settings="private-ranges-only" \
  --ingress="internal" \
  --tag="${TAG_FORMATTED}"

gcloud beta run services update "$1" \
  --project="${RAPIDS_PROJECT_ID}" \
  --add-custom-audiences="${INTERNAL_SERVICES_URL}" \
  --region="northamerica-northeast1" \
  --tag="${TAG_FORMATTED}"

gcloud run services update-traffic "$1" --to-latest --region="northamerica-northeast1"

