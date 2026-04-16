# ADR 005: Contract Signing Integration (Dropbox Sign)

## Status

Accepted

## Context

The onboarding lifecycle requires legally auditable contract signature collection and webhook-triggered stage progression.

## Decision

Use Dropbox Sign for contract templates, signature requests, and webhook-driven contract status updates.

## Consequences

- Pros: managed e-signature workflow, template support, event callbacks.
- Cons: third-party dependency and webhook security requirements.
