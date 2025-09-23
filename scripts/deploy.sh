#!/bin/bash

# Ensure gcloud is in path
PATH=$PATH:/gcloud/bin
gcloud config set project "${RAPIDS_PROJECT_ID}"

INTERNAL_SERVICES_URL=$(gcloud secrets versions access "latest" --secret "ServicesInternalURL" --project="${RAPIDS_PROJECT_ID}")

echo "INTERNAL_SERVICES_URL: ${INTERNAL_SERVICES_URL}"

# Convert vx.y.z to vx-y-z since tags in cloud run should not include "."
TAG_FORMATTED=$(echo "${RAPIDS_VERTICAL_NAME/./"-"}")
TAG_FORMATTED=$(echo "${TAG_FORMATTED/./"-"}")

POSTGRES_URL="postgresql://testuser:245325!Ad342432@127.0.0.1:5432"

echo "Deploying '$1' image ${IMAGE_NAME}, under tag ${TAG_FORMATTED}"
gcloud run deploy "$1" \
        --image="${IMAGE_NAME}" \
        --min-instances="0" \
        --max-instances="10" \
        --concurrency="100" \
        --cpu="1" \
        --memory="1Gi" \
        --no-cpu-throttling \
        --region=northamerica-northeast1 \
        --no-allow-unauthenticated \
        --add-cloudsql-instances=th-rapids-nonprod-2294:northamerica-northeast1:rpds-chat-rx-test \
        --service-account="rapids-api-cloud-run-sa@${RAPIDS_PROJECT_ID}.iam.gserviceaccount.com" \
        --set-env-vars "RAPIDS_PROJECT_ID=${RAPIDS_PROJECT_ID},LW_CLOUDRUN_ENV_GEN=gen1,RAPIDS_VERTICAL_NAME=${RAPIDS_VERTICAL_NAME},FULLY_QUALIFIED_DOMAIN=${FULLY_QUALIFIED_DOMAIN},NODE_ENV=production,AUTH_SECRET=123456789,POSTGRES_URL=${POSTGRES_URL}" \
        --set-secrets=LaceworkAccessToken=LaceworkAccessToken:latest,LaceworkServerUrl=LaceworkServerUrl:latest \
        --vpc-connector=kong-vpc-connector-${LOAD_BALANCER_VERSION} \
        --ingress=internal \
        --tag="${TAG_FORMATTED}"

gcloud beta run services update "$1" \
  --project="${RAPIDS_PROJECT_ID}" \
  --add-custom-audiences="${INTERNAL_SERVICES_URL}" \
  --region=northamerica-northeast1 \
  --tag="${TAG_FORMATTED}"

# Route traffic to the latest version
gcloud run services update-traffic $1 --to-latest --region=northamerica-northeast1