#!/bin/bash

# Script to check Vercel deployment status via GitHub API
# Usage: ./scripts/check-deployment.sh [commit-sha]

set -e

COMMIT_SHA=${1:-$(git rev-parse HEAD)}
REPO_OWNER=$(git remote get-url origin | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')
REPO_NAME=$(git remote get-url origin | sed -n 's/.*\/\([^.]*\)\.git/\1/p')

MAX_ATTEMPTS=60  # 5 minutes with 5-second intervals
ATTEMPT=0

echo "🔍 Checking deployment for commit: ${COMMIT_SHA:0:7}"
echo "📦 Repo: $REPO_OWNER/$REPO_NAME"
echo "⏳ Polling deployment status..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  # Get deployments from GitHub API
  RESPONSE=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments?per_page=10" \
    -H "Accept: application/vnd.github.v3+json" 2>/dev/null || echo "[]")

  # Find deployment for our commit using jq (matches partial SHA)
  DEPLOYMENT_ID=$(echo "$RESPONSE" | jq -r ".[] | select(.sha | startswith(\"$COMMIT_SHA\")) | .id" | head -1)

  if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
    # Get deployment status
    STATUS_RESPONSE=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments/$DEPLOYMENT_ID/statuses" \
      -H "Accept: application/vnd.github.v3+json" 2>/dev/null || echo "[]")

    # Get the latest status
    STATE=$(echo "$STATUS_RESPONSE" | jq -r '.[0].state // empty')
    ENV_URL=$(echo "$STATUS_RESPONSE" | jq -r '.[0].environment_url // empty')
    DESCRIPTION=$(echo "$STATUS_RESPONSE" | jq -r '.[0].description // empty')

    if [ -n "$STATE" ]; then
      case "$STATE" in
        "success")
          echo ""
          echo "✅ Deployment successful!"
          echo "🚀 Preview: $ENV_URL"
          echo "🌐 Production: https://stonkie.vercel.app"
          [ -n "$DESCRIPTION" ] && echo "📝 $DESCRIPTION"
          exit 0
          ;;
        "failure"|"error")
          echo ""
          echo "❌ Deployment failed!"
          echo "📝 $DESCRIPTION"
          [ -n "$ENV_URL" ] && echo "🔗 $ENV_URL"
          exit 1
          ;;
        "pending"|"in_progress"|"queued")
          printf "."
          ;;
      esac
    fi
  else
    printf "."
  fi

  ATTEMPT=$((ATTEMPT + 1))
  sleep 5
done

echo ""
echo "⏱️  Timeout: Deployment not found or not completed within 5 minutes"
echo "🔗 Check status: https://github.com/$REPO_OWNER/$REPO_NAME/deployments"
exit 1
