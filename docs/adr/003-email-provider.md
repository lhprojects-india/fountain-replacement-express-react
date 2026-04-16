# ADR 003: Email Provider Selection (Resend)

## Status

Accepted

## Context

The onboarding flow requires transactional email templates, delivery events, and lightweight operational setup.

## Decision

Use Resend as the email provider and process delivery lifecycle through webhook events.

## Consequences

- Pros: simple API, reliable transactional delivery, webhook support.
- Cons: provider dependency and key management requirements.
