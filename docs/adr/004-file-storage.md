# ADR 004: File Storage via S3-Compatible Object Storage

## Status

Accepted

## Context

Driver document upload/review requires secure, scalable storage without proxying large files through backend memory.

## Decision

Use S3-compatible storage (AWS S3 or Cloudflare R2) with signed upload/download URLs.

## Consequences

- Pros: scalable storage, lower backend bandwidth/memory pressure, secure scoped URL access.
- Cons: additional bucket policy and credentials management.
