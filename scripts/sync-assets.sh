#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bucket="${CRCC_S3_BUCKET:-cruising-rats-cigar-club}"

# Credentials come from the operator's AWS profile/role, never from this repository.
aws s3 sync "$project_root/documents/" "s3://$bucket/documents/" --no-progress
aws s3 sync "$project_root/images/" "s3://$bucket/images/" --no-progress
echo "S3 assets synchronized (no remote deletion)."
