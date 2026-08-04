#!/usr/bin/env python3
"""Upload email assets to the takeprofit-static S3 bucket.

Why this script instead of a bare `aws s3 cp`: the bucket has **no bucket
policy** — public read is granted per object via the `public-read` ACL. An
upload without that ACL lands fine but serves **403** over HTTPS, so the image
silently breaks in the email. This script always sets the ACL, sets a correct
Content-Type / Cache-Control, and then verifies each URL with a real HTTPS GET.

Usage:
    python tools/upload-assets.py <prefix> <file-or-dir> [more...] [--dry-run]

Example:
    python tools/upload-assets.py emails/welcome ./export/*.png

Requires: boto3, and the `tp-static` profile in ~/.aws/credentials.
"""

import argparse
import mimetypes
import struct
import sys
import urllib.request
from pathlib import Path

import boto3

PROFILE = "tp-static"
REGION = "eu-central-1"
BUCKET = "takeprofit-static"
BASE_URL = f"https://{BUCKET}.s3.{REGION}.amazonaws.com/"
CACHE_CONTROL = "public, max-age=31536000, immutable"
EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}


def png_dims(path: Path):
    """Pixel size of a PNG without pulling in Pillow — for the retina check."""
    with path.open("rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", head[16:24])


def collect(inputs):
    files = []
    for raw in inputs:
        p = Path(raw)
        if p.is_dir():
            files += sorted(c for c in p.iterdir() if c.suffix.lower() in EXTS)
        elif p.is_file():
            files.append(p)
        else:
            sys.exit(f"not found: {raw}")
    if not files:
        sys.exit("nothing to upload")
    return files


def verify(url):
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return r.status, r.headers.get("Content-Type")
    except Exception as e:  # noqa: BLE001 — any failure means the URL is unusable
        return None, str(e)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("prefix", help="key prefix in the bucket, e.g. emails/welcome")
    ap.add_argument("paths", nargs="+", help="files and/or directories to upload")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    prefix = args.prefix.strip("/")
    files = collect(args.paths)
    s3 = boto3.Session(profile_name=PROFILE, region_name=REGION).client("s3")

    results, failed = [], False
    for path in files:
        key = f"{prefix}/{path.name}" if prefix else path.name
        ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        dims = png_dims(path)
        size = f"{dims[0]}x{dims[1]}" if dims else "-"

        if args.dry_run:
            print(f"DRY  {path.name:40s} {size:>11s} -> s3://{BUCKET}/{key}")
            continue

        s3.upload_file(
            str(path), BUCKET, key,
            ExtraArgs={
                "ACL": "public-read",          # required: no bucket policy grants public read
                "ContentType": ctype,
                "CacheControl": CACHE_CONTROL,
            },
        )
        url = BASE_URL + key
        status, info = verify(url)
        ok = status == 200
        failed |= not ok
        print(f"{'OK  ' if ok else 'FAIL'} {path.name:40s} {size:>11s} {url}"
              + ("" if ok else f"\n     -> {info}"))
        results.append((path.name, size, url))

    if results:
        print("\nURLs for the template:")
        for name, size, url in results:
            print(f"  {name} ({size} source) — {url}")

    if failed:
        sys.exit("\nSome objects are not publicly readable — check the public-read ACL.")


if __name__ == "__main__":
    main()
