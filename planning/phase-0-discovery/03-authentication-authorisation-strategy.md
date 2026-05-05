# Phase 0 - Authentication and Authorization Strategy

## Objective

Define identity, access, and security architecture for dashboard and runtime.

## Auth domains

1. **Human users** (dashboard access)
2. **Machine clients** (MCP clients calling gateway)
3. **Service-to-service** (gateway to source MCPs)

## Human authentication

- Primary: email/password + optional OAuth SSO in cloud.
- Self-hosted: allow OIDC provider integration from day one.
- Session model: short-lived JWT + refresh token rotation.

## Human authorization (RBAC)

- `owner`: billing, auth settings, all permissions.
- `admin`: source and policy management, deployments.
- `operator`: runtime operations and read access, limited policy edits.
- `viewer`: read-only dashboard and audit.

## Machine authentication (runtime endpoint)

Support both:
- API key mode (v1 default)
- OAuth client credentials mode (v2)

API keys:
- scoped to workspace/project,
- revocable,
- hashed at rest,
- optional expiration.

## Authorization model for tools

Every `call_tool` requires:
1. client auth validation,
2. workspace/project resolution,
3. policy evaluation,
4. argument checks (when configured),
5. decision + audit event.

## Read-only policy implementation

Read-only profile rules:
- allow only tools explicitly marked read-safe,
- deny all write/admin tools,
- deny unknown classification tools unless explicitly allowed.

## Secret management

- Store source secrets encrypted at rest.
- Use KMS-backed encryption where possible.
- Never expose raw secrets in UI after initial save.

## Audit requirements

Mandatory audit events:
- user login and auth changes,
- source create/update/delete,
- policy create/update/publish/rollback,
- runtime tool allow/deny/error.

## Compliance baseline

- Principle of least privilege.
- Default deny in production profile.
- Configurable retention policy for audit logs.
