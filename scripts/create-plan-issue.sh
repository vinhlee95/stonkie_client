#!/bin/bash

# Create GitHub issue from implementation plan
# Usage: ./scripts/create-plan-issue.sh <plan_file> <title>

set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <plan_file> <title>"
  exit 1
fi

PLAN_FILE="$1"
TITLE="$2"

if [ ! -f "$PLAN_FILE" ]; then
  echo "Error: Plan file not found: $PLAN_FILE"
  exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "Error: gh CLI not found. Install it from https://cli.github.com/"
  exit 1
fi

# Read plan content
PLAN_BODY=$(cat "$PLAN_FILE")

# Create GitHub issue with plan label
gh issue create \
  --title "$TITLE" \
  --body "$PLAN_BODY" \
  --label "plan" \
  --label "enhancement"

echo "✓ GitHub issue created successfully"
