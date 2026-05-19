# ADR 005: Contract Signing Integration (Docuseal, self-hosted)

## Status

Accepted (supersedes the prior Dropbox Sign decision and the short-lived in-app
PDF signing experiment).

## Context

The onboarding lifecycle requires legally auditable contract signature
collection and webhook-triggered stage progression. We previously experimented
with Dropbox Sign (third-party SaaS) and an internal PDF + click-to-sign editor;
both added vendor lock-in or significant maintenance overhead.

## Decision

Use **self-hosted Docuseal** (deployed on Render) for contract templates,
submission creation, signing UI, and webhook-driven contract status updates.

- Backend talks to Docuseal via its REST API (`/api/submissions`,
  `/api/submitters/:id`, `/api/templates`). Authentication uses the
  `X-Auth-Token` header. The API key is read from `DOCUSEAL_API_KEY`.
- Driver signing happens on Docuseal's hosted page (`/s/:slug`); the driver
  dashboard surfaces a deep link.
- Templates are authored in Docuseal admin and linked to local
  `ContractTemplate` rows by their numeric Docuseal id.
- Webhooks (`form.completed`, `form.declined`, `form.expired`) hit
  `POST /api/webhooks/docuseal` and progress the workflow accordingly.
  HMAC-SHA256 signatures are verified using `DOCUSEAL_WEBHOOK_SECRET`.

## Consequences

- Pros: self-hosted (data residency, no per-envelope fees), single signing
  provider for the entire flow, simple template management in Docuseal admin,
  webhook + polling for resilience.
- Cons: we operate the Docuseal instance, including upgrades and backups; admins
  manage templates in a second tool rather than directly inside our admin app.

## Environment

| Variable                  | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `DOCUSEAL_BASE_URL`       | Base URL for the Docuseal API (with or without `/api`).    |
| `DOCUSEAL_PUBLIC_URL`     | Optional, public URL drivers visit. Defaults to base.      |
| `DOCUSEAL_API_KEY`        | Token sent as `X-Auth-Token`.                              |
| `DOCUSEAL_WEBHOOK_SECRET` | HMAC secret used to verify incoming webhook signatures.    |
