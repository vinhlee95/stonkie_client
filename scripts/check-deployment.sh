#!/bin/bash

# Script to check Vercel deployment status
# Usage: ./scripts/check-deployment.sh [commit-sha]

set -e

COMMIT_SHA=${1:-$(git rev-parse HEAD)}
MAX_ATTEMPTS=60  # 5 minutes with 5-second intervals
ATTEMPT=0

echo "🔍 Checking Vercel deployment for commit: ${COMMIT_SHA:0:7}"
echo "⏳ Polling deployment status..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  # Get latest deployments using Vercel CLI
  DEPLOYMENTS=$(vercel ls --yes 2>/dev/null | grep -E "stonkie|${COMMIT_SHA:0:7}" || echo "")

  if [ -z "$DEPLOYMENTS" ]; then
    printf "."
    ATTEMPT=$((ATTEMPT + 1))
    sleep 5
    continue
  fi

  # Get the most recent deployment URL
  DEPLOYMENT_URL=$(echo "$DEPLOYMENTS" | head -1 | awk '{print $2}')

  # Inspect the deployment to get detailed status
  INSPECTION=$(vercel inspect "$DEPLOYMENT_URL" --yes 2>/dev/null || echo "")

  if [ -n "$INSPECTION" ]; then
    # Check if deployment is ready
    if echo "$INSPECTION" | grep -q "Ready"; then
      echo ""
      echo "✅ Deployment successful!"
      echo "🚀 Preview: https://${DEPLOYMENT_URL}"
      echo "🌐 Production: https://stonkie.vercel.app"
      exit 0
    fi

    # Check if deployment failed
    if echo "$INSPECTION" | grep -qE "Error|Failed|Canceled"; then
      echo ""
      echo "❌ Deployment failed!"
      echo "$INSPECTION"
      exit 1
    fi

    # Still building
    printf "."
  else
    printf "."
  fi

  ATTEMPT=$((ATTEMPT + 1))
  sleep 5
done

echo ""
echo "⏱️  Timeout: Deployment not completed within 5 minutes"
echo "Check status at: https://vercel.com/dashboard"
exit 1
