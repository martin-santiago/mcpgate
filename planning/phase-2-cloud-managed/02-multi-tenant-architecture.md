# Phase 2 - Multi-Tenant Architecture

## Tenant isolation model

- Workspace id as strict tenant boundary.
- Logical data isolation in DB with scoped queries.
- Runtime context isolation by workspace credentials and policy snapshots.

## Cloud runtime model

- Dedicated runtime instance pool.
- Workspace-specific runtime context loaded on request.
- Rate limiting and quota controls by workspace plan.

## Auth in cloud edition

- Support email/password and OAuth login.
- Runtime API keys per workspace/project.
- Token revocation propagation within seconds.
