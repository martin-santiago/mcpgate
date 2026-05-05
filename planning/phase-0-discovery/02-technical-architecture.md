# Phase 0 - Technical Architecture

## Objective

Define the reference architecture used by both self-hosted and cloud editions.

## High-level architecture

- **Dashboard (Frontend)**
  - Source management UI
  - Unified tools catalog UI
  - Policy editor and profile manager
  - Deployment and endpoint management
  - Audit UI

- **Control Plane API (Backend)**
  - Auth and RBAC
  - Source CRUD + credentials references
  - Tool catalog synchronization
  - Policy CRUD + policy compilation
  - Deployment orchestration metadata
  - Audit query API

- **Gateway Runtime (Data Plane)**
  - MCP endpoint exposed to clients
  - Source routing and upstream transport adapter
  - Tool filtering for `list_tools`
  - Tool authorization for `call_tool`
  - Observability and runtime audit events

- **Data layer**
  - Postgres for metadata and policy persistence
  - Redis for cache, short-lived sessions, and optional rate limits

## Source adapter model

Each MCP source follows a common adapter interface:
- `validateConnection(config)`
- `discoverTools(config)`
- `invokeTool(config, toolName, args)`

Initial adapters:
- supabase adapter,
- slack adapter,
- custom adapter.

## Unified tool identity

Tool IDs should be globally unique inside workspace:
- format: `sourceKey:toolName`
- example: `slack-main:post_message`

This enables stable policy targeting regardless of source updates.

## Policy model (v1)

Decision order:
1. workspace base policy,
2. project override,
3. role override,
4. explicit deny wins.

Policy actions:
- allow,
- deny,
- read-only preset expansion.

## Deployment model

### Self-hosted
- single tenant deployment in customer infra.
- all components in one network domain.

### Cloud
- multi-tenant control plane.
- per-tenant isolated runtime context.

## Security boundaries

- Dashboard users authenticate via app auth provider.
- MCP clients authenticate to runtime endpoint.
- Runtime authenticates to upstream sources using stored secrets.
- Strict separation between control API tokens and runtime access tokens.
