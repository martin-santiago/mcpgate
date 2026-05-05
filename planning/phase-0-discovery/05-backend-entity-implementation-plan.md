# Phase 0 - Backend Entity Implementation Plan

## Objective

Turn the initial ERD into an implementation sequence for `mcpgate-api` so development can start without re-thinking the database model tomorrow.

This plan answers three questions:

1. what entities should be implemented first,
2. what should wait until later batches,
3. how those entities map to backend modules and future product flows.

## Main product target to optimize for

The initial backend model should optimize for this workflow:

1. a user authenticates,
2. creates or enters a workspace,
3. connects one or more upstream MCP sources,
4. runs discovery,
5. sees a unified tool catalog,
6. enables or disables tools,
7. later publishes one centralized MCP endpoint backed by those decisions.

Because of that, the first implementation should prioritize tenancy, source registry, and tool catalog state over advanced policy or runtime infrastructure.

## Recommended implementation batches

## Batch 1 - identity and tenancy foundation

Implement first:

- `users`
- `workspaces`
- `workspace_members`

### Why this batch comes first

- every other entity belongs to a workspace,
- dashboard authorization depends on workspace roles,
- source ownership and tool visibility depend on tenancy boundaries.

### Minimum fields

#### `users`
- `id`
- `supabase_user_id` unique
- `email` unique
- `display_name`
- `status`
- timestamps

#### `workspaces`
- `id`
- `name`
- `slug` unique
- `owner_user_id`
- `status`
- timestamps

#### `workspace_members`
- `id`
- `workspace_id`
- `user_id`
- `role`
- `status`
- timestamps

### TypeORM ownership

- `src/users/`
- `src/workspaces/`

Even if `users` stays small, it deserves its own module or at least a dedicated entity file, not an anonymous auth-only table.

## Batch 2 - source registry

Implement second:

- `sources`
- `source_credentials`
- `source_sync_runs`

### Why this batch comes second

- sources are the upstream MCP servers,
- credentials and sync runs are required before real discovery exists,
- this is the first operational layer of the product.

### Minimum fields

#### `sources`
- `id`
- `workspace_id`
- `name`
- `source_key`
- `type`
- `transport`
- `endpoint_url`
- `status`
- `last_connected_at`
- `last_error`
- timestamps

Constraint recommendation:
- unique `(workspace_id, source_key)`

#### `source_credentials`
- `id`
- `source_id`
- `credential_type`
- `secret_ref`
- `encrypted_payload`
- `is_valid`
- `last_validated_at`
- timestamps

#### `source_sync_runs`
- `id`
- `source_id`
- `status`
- `started_at`
- `finished_at`
- `discovered_tools_count`
- `error_message`
- `metadata_json`

### TypeORM ownership

- `src/sources/`

Recommendation: keep `source_credentials` as a separate entity from day one so future secret backends do not force a table split later.

## Batch 3 - tool catalog core

Implement third:

- `source_tools`
- `workspace_tools`

### Why this batch is the product core

This is the main value of MCPGate:

- discover tools from many MCPs,
- keep history,
- project a current catalog,
- allow toggle-based governance.

### Minimum fields

#### `source_tools`
- `id`
- `source_id`
- `sync_run_id`
- `upstream_tool_name`
- `canonical_tool_key`
- `title`
- `description`
- `input_schema`
- `output_schema`
- `annotations`
- `capability_hint`
- `is_current`
- `discovered_at`

Constraint recommendation:
- index `(source_id, is_current)`
- index `(source_id, upstream_tool_name)`

#### `workspace_tools`
- `id`
- `workspace_id`
- `source_id`
- `current_source_tool_id`
- `canonical_tool_key`
- `display_name`
- `description`
- `is_enabled`
- `visibility_status`
- `last_seen_at`
- timestamps

Constraint recommendation:
- unique `(workspace_id, canonical_tool_key)`

### Design rule

Never collapse `source_tools` and `workspace_tools` into one table.

- `source_tools` = upstream discovery history
- `workspace_tools` = current MCPGate catalog state

This split is mandatory for stable toggles, source re-syncs, and future policy snapshots.

### TypeORM ownership

- `src/tools/`

## Batch 4 - policy foundation

Implement fourth:

- `policies`
- `policy_rules`
- `policy_snapshots`

### Why this comes after tool catalog

Policies target the current catalog and source structure.
Without stable `workspace_tools`, policy modeling will stay too abstract.

### Minimum fields

#### `policies`
- `id`
- `workspace_id`
- `name`
- `scope_type`
- `scope_ref`
- `status`
- `version`
- `created_by`
- timestamps

#### `policy_rules`
- `id`
- `policy_id`
- `target_type`
- `target_ref`
- `effect`
- `conditions_json`
- `priority`
- `created_at`

#### `policy_snapshots`
- `id`
- `workspace_id`
- `policy_id`
- `compiled_rules_json`
- `published_by`
- `published_at`

### TypeORM ownership

- `src/policies/` or `src/policy/`

## Batch 5 - runtime publication

Implement fifth:

- `runtime_endpoints`
- `runtime_credentials`

### Why this waits

Runtime publishing depends on:

- workspace ownership,
- current tool catalog,
- published policy snapshots.

### Minimum fields

#### `runtime_endpoints`
- `id`
- `workspace_id`
- `name`
- `slug`
- `status`
- `base_url`
- `published_policy_snapshot_id`
- timestamps

#### `runtime_credentials`
- `id`
- `workspace_id`
- `runtime_endpoint_id`
- `label`
- `hashed_key`
- `scope_project_id`
- `allowed_client_label`
- `expires_at`
- `revoked_at`
- `created_by`
- `created_at`

### TypeORM ownership

- `src/runtime/` or `src/deployments/`

## Batch 6 - audit and operational logs

Implement sixth:

- `audit_events`
- `tool_call_logs`

### Why this is separate

These entities should be shaped by real flows from auth, sources, tools, policies, and runtime.
If implemented too early, they tend to become vague event dumps.

### Minimum fields

#### `audit_events`
- `id`
- `workspace_id`
- `actor_type`
- `actor_ref`
- `event_type`
- `target_type`
- `target_ref`
- `metadata_json`
- `created_at`

#### `tool_call_logs`
- `id`
- `workspace_id`
- `runtime_endpoint_id`
- `runtime_credential_id`
- `workspace_tool_id`
- `source_id`
- `request_payload_json`
- `response_summary_json`
- `decision`
- `latency_ms`
- `error_code`
- `created_at`

## Recommended enums

Start explicit enums early to avoid string drift.

### User / membership
- `user_status`: `active | invited | disabled`
- `workspace_status`: `active | archived`
- `member_role`: `owner | admin | operator | viewer`
- `member_status`: `active | invited | removed`

### Sources
- `source_type`: `custom | supabase | slack`
- `source_transport`: `stdio | http`
- `source_status`: `pending | connected | error | disconnected`
- `source_sync_status`: `running | success | error`
- `credential_type`: `api_key | bearer | oauth | basic | env | custom`

### Tools
- `tool_capability_hint`: `read | write | admin | unknown`
- `tool_visibility_status`: `visible | hidden | deprecated`

### Policies
- `policy_scope_type`: `workspace | project | role`
- `policy_status`: `draft | published | archived`
- `policy_target_type`: `tool | source | capability`
- `policy_effect`: `allow | deny`

### Runtime / audit
- `runtime_endpoint_status`: `draft | active | disabled`
- `audit_actor_type`: `user | runtime_client | system`
- `tool_call_decision`: `allowed | denied | failed`

## Recommended indexes and constraints

At minimum:

- `users.supabase_user_id` unique
- `users.email` unique
- `workspaces.slug` unique
- `workspace_members(workspace_id, user_id)` unique
- `sources(workspace_id, source_key)` unique
- `workspace_tools(workspace_id, canonical_tool_key)` unique
- index `source_tools(source_id, is_current)`
- index `audit_events(workspace_id, created_at)`
- index `tool_call_logs(workspace_id, created_at)`

## Relationships to implement carefully

### Required `ManyToOne`

- workspace -> owner user
- workspace_member -> workspace
- workspace_member -> user
- source -> workspace
- source_credential -> source
- source_sync_run -> source
- source_tool -> source
- source_tool -> source_sync_run
- workspace_tool -> workspace
- workspace_tool -> source
- workspace_tool -> current_source_tool
- policy -> workspace
- policy_rule -> policy
- policy_snapshot -> workspace
- policy_snapshot -> policy
- runtime_endpoint -> workspace
- runtime_endpoint -> published_policy_snapshot
- runtime_credential -> workspace
- runtime_credential -> runtime_endpoint

## What to postpone intentionally

Do not model these on day one unless implementation forces them:

- `projects`
- advanced secret vault abstraction tables
- policy simulation tables
- OAuth client registration tables for runtime
- MCP transport session storage
- source health history beyond `source_sync_runs`
- billing and plan tables

These belong to later phases or should emerge from real use cases.

## Practical recommendation for tomorrow's first coding session

Start with a narrow, high-leverage batch:

### Tomorrow scope

1. refactor current entities to match Batch 1 and Batch 2 properly
2. introduce missing identity and membership entities
3. reshape current `tool` modeling toward `source_tools` + `workspace_tools`
4. stop relying on `synchronize: true` as the long-term plan and prepare for migrations soon after

### Best first implementation slice

- `users`
- `workspaces`
- `workspace_members`
- `sources`
- `source_credentials`
- `source_sync_runs`
- `source_tools`
- `workspace_tools`

This gives MCPGate a solid base without prematurely implementing policies and runtime publication.

## Deliverables expected after the first backend modeling pass

- final entity files in `mcpgate-api`
- updated module wiring
- clear relation ownership
- initial migration plan
- no ambiguity about where toggles live
- no ambiguity about how discovery history is stored
