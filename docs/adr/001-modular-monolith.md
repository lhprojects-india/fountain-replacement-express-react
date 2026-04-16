# ADR 001: Modular Monolith Backend

## Status

Accepted

## Context

The onboarding domain includes tightly coupled workflows (applications, transitions, docs, communications, payments, contracts). Splitting into microservices would add early operational complexity.

## Decision

Use a single Express backend with clear module boundaries per domain.

## Consequences

- Pros: simpler deployments, shared transactions, faster iteration.
- Cons: stronger discipline required to maintain module boundaries.
