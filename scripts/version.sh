#!/bin/bash

# Set version information for Cloud Build
echo "Setting version information..."

# Create version.json with build metadata
cat >version.json <<EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commitSha": "${SHORT_SHA}",
  "branchName": "${BRANCH_NAME}",
  "branchTag": "${BRANCH_TAG}",
}
EOF

echo "Version information created:"
cat version.json
