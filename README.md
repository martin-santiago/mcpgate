# MCPGate

> **Personal project by Martín Prez.**
> This is not affiliated with, owned by, or related to Carvuk in any way.
> Do not use Carvuk credentials, infrastructure, accounts, or any Carvuk-owned resources in this project.

MCPGate is an open-source, self-hosted control plane and gateway runtime for Model Context Protocol (MCP) operations in teams.

The core product experience is:
- connect MCP servers from different sources,
- discover and unify all tools in one UI,
- operate primarily through a CLI-first workflow,
- graphically enable/disable tools,
- apply access policies (including read-only profiles),
- expose one unified MCP endpoint for clients like Claude, Cursor, and custom hosts.

## Product goals

1. Make MCP integration simple for non-expert teams.
2. Provide granular governance at tool level.
3. Be installable and useful as a local-first, self-hosted product without requiring a managed cloud.
4. Keep auth, authorization, and auditing as first-class system features.
5. Stay open to community adapters, policy ideas, and contributions through an open-source development model.

## Product direction

### 1) Self-hosted open-source core
- Customer runs MCPGate API, UI, DB, and Gateway Runtime in their own infra.
- CLI-first experience is the primary workflow for setup, operations, and endpoint publication.
- Optional UI layers can exist, but they are secondary to the local/self-hosted product.
- Best for security-sensitive teams, internal platforms, and developer-first teams.

### 2) Optional packaged experiences later
- Desktop companion, richer local UI, or hosted convenience layers can exist later if they remain compatible with the self-hosted open core.
- Any future managed offering must be downstream from the self-hosted architecture, not the other way around.

## Core architecture

- **CLI App**: setup, source onboarding, tool discovery, policy operations, runtime publishing, local diagnostics.
- **Optional UI**: dashboard or desktop surfaces for teams that prefer visual operations.
- **Backend / Local Control Plane**: auth, RBAC, source management, policy management, audit APIs.
- **Gateway Runtime (Data Plane)**: MCP protocol enforcement for `list_tools` and `call_tool`.
- **Infra**: local-first packaging, Postgres/SQLite strategy, optional Redis, observability, secret management.

## Auth and authorization principles

- Strong tenant isolation by workspace.
- RBAC roles at minimum: owner, admin, operator, viewer.
- Policy enforcement at two points:
  - tool visibility (`list_tools`),
  - tool execution (`call_tool`).
- API key and OAuth support for client-to-gateway access.
- Complete audit logs for compliance and debugging.

## Repository structure

```text
mcpgate/
  README.md
  mcpgate-cli/
  mcpgate-api/
  mcpgate-web/
  planning/
    main-project-thread.md
    phase-0-discovery/
    phase-1-mvp-self-hosted/
    phase-1-5-hardening/
    phase-2-cloud-managed/
    phase-2-5-enterprise-pack/
    phase-3-differentiators/
```

## Planning index

- `planning/main-project-thread.md`
- `planning/adr/0001-monorepo-target-with-phased-migration.md`
- `planning/adr/0002-sqlite-default-for-local-mode-postgres-for-team-mode.md`
- `planning/adr/0003-mcpgate-web-as-companion-ui-not-primary-product.md`
- `planning/phase-0-discovery/`
- `planning/phase-0-discovery/06-cli-first-self-hosted-product-plan.md`
- `planning/phase-0-discovery/07-mcpgate-cli-initial-architecture.md`
- `planning/phase-1-mvp-self-hosted/`
- `planning/phase-1-5-hardening/`
- `planning/phase-2-cloud-managed/`
- `planning/phase-2-5-enterprise-pack/`
- `planning/phase-3-differentiators/`
