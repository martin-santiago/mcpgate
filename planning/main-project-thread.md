# Main Project Thread - MCPGate

> **Personal project by Martín Prez.**
> This is not affiliated with, owned by, or related to Carvuk in any way.
> Do not use Carvuk credentials, infrastructure, accounts, or any Carvuk-owned resources in this project.

## Context

This project starts from the need to build a differentiated MCP product without directly competing with broad IDE-like agent suites.

The selected direction is an open-source, self-hosted MCP gateway and control plane focused on:
- unified MCP source connection,
- unified tool management,
- CLI-first operation,
- visual tool activation and deactivation,
- policy-driven permissions (including read-only profiles),
- local-first deployment and packaging.

## Key decisions made

1. Product name (temporary): **MCPGate**.
2. Core value: a unified interface for MCP operations and governance.
3. Support at least three initial source types:
   - Supabase MCP,
   - Slack MCP,
   - Custom MCP.
4. User must be able to launch one unified MCP endpoint from configured sources.
5. Auth is mandatory and central, not optional.
6. The primary product must be fully useful as a self-hosted open-source tool.
7. The main interaction model should be CLI-first, with UI layers treated as optional companions.
8. Community contributions for adapters and ecosystem growth are strategically desirable.

## Product hypotheses

### Primary hypothesis
Teams need a single self-hosted control layer to safely use MCP tools across clients and environments without depending on a managed vendor.

### Secondary hypotheses
- Integration setup is currently too fragmented.
- Tool-level control is missing in many current offerings.
- Security and permissions are blockers for team adoption.
- Developer teams prefer local, inspectable, hackable infrastructure over closed managed abstractions for MCP.

## First release vision

Build an open-source self-hosted MVP where a user can:
- connect MCP sources,
- automatically discover tools,
- enable or disable tools per source,
- publish a unified endpoint,
- enforce policies on tool visibility and execution,
- inspect audit logs,
- operate the full flow from a CLI-first interface.

## Auth requirements captured in thread

- Workspace-level identity and isolation.
- Role-based permissions for dashboard actions.
- Client authentication for runtime usage.
- Authorization checks for all tool calls.
- Audit trail for changes and runtime calls.

## Open product questions

1. Should the canonical storage layer be SQLite-first for local installs, or Postgres-first with SQLite as a later packaging target?
2. In early versions, should policy scope be workspace-level only, or also project-level?
3. Should source credentials be mandatory via secrets manager for self-hosted, or env-file acceptable for v1?
4. Should there be default deny for all tools, or default allow with policy profile presets?

Current recommendation:
- Postgres-first core for now, but keep packaging abstraction compatible with a future SQLite/local mode,
- workspace + project scopes,
- secrets manager preferred, env-file allowed for local development only,
- default deny in production mode, explicit allow via profiles.
