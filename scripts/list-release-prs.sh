#!/bin/bash
#
# List PRs merged since last QA version (JSON output)
#
# Usage:
#   ./scripts/list-release-prs.sh --from-tfvars [--label <label>] [to_commit]
#
# Example:
#   ./scripts/list-release-prs.sh --from-tfvars --label feature-marketplace
#

set -euo pipefail

REPO="ezily-io/ezily-commerce-core"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

FROM=""
TO="HEAD"
LABEL_FILTER=""
FROM_TFVARS=false

# --------------------------------------------------
# Parse arguments
# --------------------------------------------------
while [[ $# -gt 0 ]]; do
  case $1 in
    --from-tfvars)
      FROM_TFVARS=true
      shift
      ;;
    --label)
      LABEL_FILTER="$2"
      shift 2
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      TO="$1"
      shift
      ;;
  esac
done

# --------------------------------------------------
# Resolve FROM from qa.tfvars
# --------------------------------------------------
if [ "$FROM_TFVARS" = true ]; then
  TFVARS_FILE="$REPO_ROOT/terraform/cm/qa.tfvars"

  if [ ! -f "$TFVARS_FILE" ]; then
    echo "Error: Cannot find $TFVARS_FILE" >&2
    exit 1
  fi

  FROM=$(grep -E 'ui_version\s*=' "$TFVARS_FILE" \
    | sed -E 's/.*"([^"]+)".*/\1/')

  if [ -z "$FROM" ]; then
    echo "Error: Could not extract ui_version from qa.tfvars" >&2
    exit 1
  fi
else
  echo "Error: --from-tfvars is required in CI usage" >&2
  exit 1
fi

# --------------------------------------------------
# Helper functions
# --------------------------------------------------
get_pr_title() {
  local pr_num=$1
  gh pr view "$pr_num" --json title --jq '.title' 2>/dev/null || echo ""
}

has_label() {
  local pr_num=$1
  local label=$2

  gh pr view "$pr_num" --json labels \
    --jq '.labels[].name' 2>/dev/null | grep -qx "$label"
}

# --------------------------------------------------
# Resolve commits
# --------------------------------------------------
FROM_FULL=$(git rev-parse "$FROM" 2>/dev/null || echo "$FROM")
TO_FULL=$(git rev-parse "$TO" 2>/dev/null || echo "$TO")

# --------------------------------------------------
# Collect PR numbers between commits
# --------------------------------------------------
PR_NUMBERS=$(
  git log "${FROM_FULL}..${TO_FULL}" --oneline |
    grep -oE '#[0-9]+' |
    tr -d '#' |
    sort -n |
    uniq
)

# --------------------------------------------------
# Build Slack-ready text
# --------------------------------------------------
TEXT=""
TEXT+="Deploying \`${TO_FULL:0:7}\` to QA"$'\n\n'

if [ -n "$LABEL_FILTER" ]; then
  TEXT+="Changes (label: ${LABEL_FILTER}):"$'\n'
else
  TEXT+="Changes:"$'\n'
fi

CHANGE_COUNT=0

for PR_NUM in $PR_NUMBERS; do
  if [ -n "$LABEL_FILTER" ]; then
    if ! has_label "$PR_NUM" "$LABEL_FILTER"; then
      continue
    fi
  fi

  PR_TITLE=$(get_pr_title "$PR_NUM")
  PR_TITLE_ESCAPED=$(echo "$PR_TITLE" | sed 's/|/∣/g')

  if [ -n "$PR_TITLE_ESCAPED" ]; then
    TEXT+="- <https://github.com/${REPO}/pull/${PR_NUM}|${PR_TITLE_ESCAPED}> (#${PR_NUM})"$'\n'
  else
    TEXT+="- <https://github.com/${REPO}/pull/${PR_NUM}|#${PR_NUM}>"$'\n'
  fi

  ((CHANGE_COUNT++)) || true
done

if [ "$CHANGE_COUNT" -eq 0 ]; then
  TEXT+="_No changes found_"$'\n'
fi

# --------------------------------------------------
# Emit JSON for ActivePieces
# --------------------------------------------------
jq -n \
  --arg from "$FROM_FULL" \
  --arg to "$TO_FULL" \
  --arg label "$LABEL_FILTER" \
  --arg text "$TEXT" \
  --argjson count "$CHANGE_COUNT" \
  '{
    from: $from,
    to: $to,
    label: ($label | select(length > 0)),
    changeCount: $count,
    text: $text
  }'
