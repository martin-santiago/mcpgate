# Phase 1 - Auth Implementation Specification

## Objective

Implement secure and practical auth for self-hosted MVP.

## Identity model

- Local users table for MVP.
- Password hashing with Argon2 or bcrypt (configurable cost).
- Refresh token table with rotation and revocation support.

## Session model

- Access token TTL: 15 minutes.
- Refresh token TTL: 7 days (configurable).
- Rotate refresh token at each refresh operation.

## RBAC permissions matrix

- Owner:
  - manage workspace settings
  - manage members
  - manage sources and policies
  - manage runtime credentials
- Admin:
  - manage sources and policies
  - manage runtime credentials
- Operator:
  - view sources/tools/policies
  - run connection tests
  - no membership changes
- Viewer:
  - read-only dashboard and audit

## Runtime credential model

- API keys are created by owner/admin.
- Plain value shown once at creation.
- Stored hashed, never retrievable.
- Scope fields: workspace id, optional project id, optional allowed client label.

## Security acceptance criteria

- Protected endpoints reject missing or invalid JWT.
- Role-restricted endpoints reject unauthorized roles.
- Revoked runtime API key cannot call runtime endpoint.
- Audit event generated for login, policy publish, key create/revoke.
