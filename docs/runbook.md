# Operations Runbook

## Daily Operations

- Review pipeline queues in admin dashboard (`/pipeline`, `/calls`, `/analytics`).
- Prioritize applications in `pending_review`, then move candidates through stage transitions.
- Monitor document review queue and unblock candidates with required notes.
- Check communication failures (email/SMS/contract) and retry where applicable.

## Common Tasks

### Create a region

1. Open admin settings for regions.
2. Create region with operational metadata.
3. Seed region-level document requirements.
4. Verify region appears in jobs and pipeline filters.

### Create and publish a job

1. Create a job under the target region.
2. Publish the job.
3. Generate a public link.
4. Share the generated slug URL externally.

### Progress an application

1. Open application in pipeline.
2. Verify checklist completion for current stage.
3. Transition using workflow controls.
4. Confirm notification dispatch and timeline history.

## Troubleshooting

### Driver cannot log in with OTP

- Confirm application exists for email.
- Check recent verification requests (rate limit can return `429`).
- Verify Resend/Twilio credentials and delivery webhooks.

### Documents fail to upload

- Check `S3_*` environment variables.
- Verify upload URL generation endpoint response.
- Confirm bucket policy allows signed URL operations.

### Contract not progressing

- Confirm Dropbox Sign webhook secret is valid.
- Check `/api/webhooks/dropbox-sign` delivery logs.
- Poll contract status from admin endpoint.

### Frequent `403` for admin actions

- Verify JWT role and DB admin role mapping.
- Ensure account has required role for region/job mutation routes.

## Monitoring

Watch these signals:

- `GET /health` status and dependency checks
- error rates (5xx, webhook failures)
- queue depth (calls, document reviews, pending decisions)
- delivery failures in communication logs

## Incident Response

1. Acknowledge incident and capture timestamp.
2. Check backend health and logs.
3. Triage by domain:
   - Auth
   - Pipeline/workflow
   - Documents/storage
   - Communications/webhooks
4. Apply mitigation (rollback, feature disable, retry queue).
5. Verify recovery via health + core user journey test.
6. Record post-incident notes and follow-ups.

## Database Operations

### Apply migrations

```bash
npm run migrate
```

### Generate Prisma client

```bash
npm run build:backend
```

### Backup guidance

- Ensure managed Postgres automatic backups are enabled.
- Run a manual backup before major schema changes.

## Scaling Guidelines

- Scale backend when sustained CPU/memory pressure or p95 latency rises.
- Scale static apps only if traffic/bandwidth requires it.
- Optimize before scaling:
  - enable caching
  - confirm query indexes
  - reduce large frontend bundles
