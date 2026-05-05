# Phase 0 - Product Requirements

## Objective

Define clear product scope, actors, user journeys, and acceptance criteria for MCPGate v1.

## Target users

- Engineering managers adopting MCP in teams.
- Platform engineers managing tool access.
- Developers using MCP clients (Claude, Cursor, internal agents).

## Core user stories

1. As an admin, I can add MCP sources from different origins.
2. As an admin, I can see all tools from all connected sources in one place.
3. As an admin, I can enable or disable tools graphically.
4. As an admin, I can apply a read-only profile to a team or project.
5. As a developer, I can use one unified endpoint instead of many MCP endpoints.
6. As a security owner, I can audit tool calls and policy changes.

## Functional requirements (FR)

- FR-01: Support source onboarding for Supabase MCP, Slack MCP, Custom MCP.
- FR-02: Perform source connection test before activation.
- FR-03: Discover tools via MCP protocol and persist catalog metadata.
- FR-04: Provide source-level and tool-level toggles.
- FR-05: Provide preset policy profiles (`read-only`, `operator`, `admin`).
- FR-06: Enforce policies at runtime for `list_tools` and `call_tool`.
- FR-07: Publish one unified endpoint per workspace/project.
- FR-08: Capture immutable audit events for policy and runtime actions.
- FR-09: Expose role-based access for dashboard operations.

## Non-functional requirements (NFR)

- NFR-01: Average tool call overhead added by gateway < 80ms (p50).
- NFR-02: Runtime availability target >= 99.5% in cloud mode.
- NFR-03: Audit logs queryable by user, source, tool, date range.
- NFR-04: Secrets never returned in API responses or logs.
- NFR-05: Multi-tenant isolation by workspace boundary.

## UX requirements

- Source onboarding in <= 6 steps.
- Time-to-first-unified-endpoint <= 10 minutes for default setup.
- Tool management page must support search, source filter, and risk filter.
- Policy changes must show impact preview before apply.

## Acceptance criteria

- New workspace can connect at least 1 source and publish endpoint.
- User can disable one tool and observe runtime deny.
- User can apply read-only preset and block write-like tools.
- Audit trail includes who changed policy and who called blocked tool.
