# Entity Implementation Plan

This file is the execution-facing version of the database modeling plan for `mcpgate-api`.

Canonical planning sources:
- `/Users/mprez/mcpgate/planning/phase-0-discovery/04-initial-erd.md`
- `/Users/mprez/mcpgate/planning/phase-0-discovery/05-backend-entity-implementation-plan.md`

## Immediate goal

Prepare the backend for the core MCPGate workflow:

1. authenticated user enters a workspace,
2. workspace connects upstream MCP sources,
3. backend discovers tools,
4. backend persists current tool catalog separately from discovery history,
5. dashboard can toggle tools before runtime publication exists.

## First entity batch to implement

### Identity and tenancy
- `users`
- `workspaces`
- `workspace_members`

### Source registry
- `sources`
- `source_credentials`
- `source_sync_runs`

### Tool catalog core
- `source_tools`
- `workspace_tools`

## Non-negotiable design rules

1. Supabase Auth is the authentication system; local `users` is the application identity table.
2. `workspace_members` is the source of truth for RBAC inside a workspace.
3. `sources` and `source_credentials` must stay separate.
4. `source_tools` and `workspace_tools` must stay separate.
5. The product toggle belongs in `workspace_tools.is_enabled`, not in discovery history.

## Module ownership suggestion

- `src/users/`
- `src/workspaces/`
- `src/sources/`
- `src/tools/`

## Refactor target for existing model

Current scaffold has simplified entities for workspace, source, and tool.

Refactor direction:

- keep `Workspace` but align fields with the plan
- expand source modeling to support credentials and sync runs
- replace the current single `Tool` concept with:
  - `SourceTool`
  - `WorkspaceTool`

## Minimum constraints to add

- `users.supabase_user_id` unique
- `users.email` unique
- `workspaces.slug` unique
- `workspace_members(workspace_id, user_id)` unique
- `sources(workspace_id, source_key)` unique
- `workspace_tools(workspace_id, canonical_tool_key)` unique

## Recommended implementation order inside mcpgate-api

1. create `User` entity
2. update `Workspace` entity
3. create `WorkspaceMember` entity
4. update `Source` entity
5. create `SourceCredential` entity
6. create `SourceSyncRun` entity
7. replace current `Tool` modeling with `SourceTool`
8. create `WorkspaceTool`
9. wire relations in modules and repositories
10. validate builds and basic CRUD flows

## Explicitly out of scope for the first pass

- policy entities
- runtime endpoint entities
- runtime credentials
- audit entities
- Redis-backed runtime session state

Those will come after the source and tool catalog foundation is stable.
