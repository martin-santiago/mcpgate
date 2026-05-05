# Phase 1 - Gateway Runtime Specification

## Runtime objective

Expose one MCP-compatible endpoint that enforces tool visibility and execution policies.

## Core runtime responsibilities

- Authenticate runtime client.
- Resolve workspace/project context.
- Intercept `list_tools` and filter tools.
- Intercept `call_tool` and enforce policy.
- Route allowed calls to upstream source.
- Emit structured audit events.

## Request flow

1. Receive client request.
2. Verify API key and scope.
3. Load effective policy snapshot.
4. Evaluate action:
   - `list_tools`: return filtered list.
   - `call_tool`: allow or deny.
5. If allowed, invoke upstream source adapter.
6. Emit audit event with latency and result.

## Deny response contract

When denied, return a stable error payload:
- code: `TOOL_DENIED_BY_POLICY`
- tool id
- policy id
- human-readable reason

## Runtime resilience

- Upstream timeout per source.
- Retry strategy for transient source errors.
- Circuit breaker for repeatedly failing sources.
- Health endpoint for deployment monitoring.

## Runtime auth details

- Accept API key via header.
- Optional key scope binding to project.
- Reject key if revoked or expired.
