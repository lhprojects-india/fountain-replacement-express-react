# ADR 002: Centralized Stage Engine

## Status

Accepted

## Context

Application progression spans many stages and side effects (notifications, contract sends, document gating). Distributed transition logic across controllers would drift and create inconsistent rules.

## Decision

Use a centralized workflow stage engine with:

- transition matrix
- transition guards
- action hooks
- stage history tracking

## Consequences

- Pros: one source of truth for stage validity and transitions.
- Cons: requires careful testing when adding new stages or actions.
