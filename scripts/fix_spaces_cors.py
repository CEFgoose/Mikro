#!/usr/bin/env python3
"""
One-shot admin script: reconciles Mikro's CORS rules on the shared
`kaart` Spaces bucket so the browser-direct multipart upload for
transcription works.

Reads credentials from the same DO_SPACES_* env vars Flask uses, so it
runs cleanly from inside the backend pod (`kubectl exec`, DO App
Platform Console, etc.) with no extra config.

Puts Mikro rules FIRST so S3's first-match-wins CORS evaluation
selects our ExposeHeaders: ETag rule before any broader wildcard rule
from another Kaart app.

Usage (from the Mikro backend pod):

    curl -sS https://raw.githubusercontent.com/CEFgoose/Mikro/master/scripts/fix_spaces_cors.py | python3
"""

import os
import sys
import boto3
from botocore.exceptions import ClientError


MIKRO_RULES = [
    {
        "ID": "mikro-transcribe-prod",
        "AllowedOrigins": ["https://mikro.kaart.com"],
        "AllowedMethods": ["GET", "PUT", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000,
    },
    {
        "ID": "mikro-transcribe-dev",
        "AllowedOrigins": ["http://localhost:3000"],
        "AllowedMethods": ["GET", "PUT", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000,
    },
]
MIKRO_ORIGINS = {o for r in MIKRO_RULES for o in r["AllowedOrigins"]}


def main():
    missing = [v for v in (
        "DO_SPACES_ENDPOINT",
        "DO_SPACES_KEY",
        "DO_SPACES_SECRET",
        "DO_SPACES_REGION",
        "DO_SPACES_BUCKET",
    ) if not os.environ.get(v)]
    if missing:
        print(f"Missing env vars: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ["DO_SPACES_ENDPOINT"],
        aws_access_key_id=os.environ["DO_SPACES_KEY"],
        aws_secret_access_key=os.environ["DO_SPACES_SECRET"],
        region_name=os.environ["DO_SPACES_REGION"],
    )
    bucket = os.environ["DO_SPACES_BUCKET"]

    try:
        existing = s3.get_bucket_cors(Bucket=bucket).get("CORSRules", [])
    except ClientError as e:
        if e.response["Error"]["Code"].startswith("NoSuchCORS"):
            existing = []
        else:
            print(f"get_bucket_cors failed: {e}", file=sys.stderr)
            sys.exit(2)

    preserved = [r for r in existing if not (set(r.get("AllowedOrigins", [])) & MIKRO_ORIGINS)]
    merged = MIKRO_RULES + preserved

    print("BEFORE ─────────────────────────────────────")
    for i, r in enumerate(existing):
        print(f"  [{i}] {r.get('ID', '<no-id>')}: origins={r.get('AllowedOrigins', [])}")

    print()
    print("AFTER ──────────────────────────────────────")
    for i, r in enumerate(merged):
        tag = " (MIKRO)" if i < len(MIKRO_RULES) else ""
        print(f"  [{i}]{tag} {r.get('ID', '<no-id>')}: origins={r.get('AllowedOrigins', [])}")

    try:
        s3.put_bucket_cors(Bucket=bucket, CORSConfiguration={"CORSRules": merged})
    except ClientError as e:
        print(f"put_bucket_cors FAILED: {e}", file=sys.stderr)
        sys.exit(3)

    print()
    print(f"OK: wrote {len(merged)} rules to '{bucket}'. Mikro rules now at positions 0-{len(MIKRO_RULES)-1}.")


if __name__ == "__main__":
    main()
