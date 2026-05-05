# Phase 0 - CLI-First Self-Hosted Product Plan

## Objective

Translate the current MCPGate vision into a concrete product definition for a self-hosted, open-source, CLI-first product with an optional local dashboard.

This document turns the user's current mental model into:

- enriched user stories,
- a feature plan for each story,
- an implementation sequence,
- and a practical technical plan covering framework, language, infrastructure, packaging, and project management.

## Product definition

### Product statement

MCPGate is an open-source, self-hosted MCP control plane and gateway that runs locally or in customer infrastructure.

The product should let a user:

1. install MCPGate via Git clone, package manager, or container,
2. run `mcpgate` locally,
3. connect local and remote MCP sources,
4. inspect and test those sources,
5. discover the tools exposed by each source,
6. compose new custom MCP servers from one or more upstream MCPs,
7. enable or disable tools per custom server,
8. start and stop those custom servers from a local dashboard or CLI.

### Core product principles

1. **Self-hosted first**
   - The primary experience must work without any managed MCPGate cloud.

2. **CLI-first**
   - `mcpgate` is the main entry point.
   - The dashboard is a companion surface, not a required separate product.

3. **Local-first operations**
   - A user should be able to install, run, test, and operate MCPGate on one machine.

4. **Composable MCP graph**
   - MCPGate should not only connect to MCPs.
   - It should also let the user create new higher-level MCP servers from multiple sub-MCPs.

5. **User-controlled governance**
   - Tool exposure must be editable.
   - The user decides what each custom MCP exposes.

6. **Open-source ecosystem**
   - The adapter model must be contribution-friendly.
   - Community additions should be a feature, not an afterthought.

## Product actors

### Local operator

Installs MCPGate, connects MCPs, tests them, and publishes local custom MCP servers.

### Platform engineer

Runs MCPGate for a team, defines which tools are exposed, and maintains local or self-hosted infrastructure.

### MCP builder

Creates custom MCP servers and combines multiple upstream MCPs into one new surface for downstream clients.

### Contributor

Builds adapters, improvements, diagnostics, or packaging enhancements for the open-source project.

## Enriched user stories and feature plans

## US-01 - Install and run MCPGate locally

### User story

As a local operator,
I want to install MCPGate with a simple command and run `mcpgate` on my machine,
so that I can start a local control plane and dashboard without setting up a managed backend first.

### Feature definition

- Support installation paths:
  - Git clone + local dev run,
  - `brew install mcpgate`,
  - Docker-based quick start.
- Running `mcpgate` should:
  - start the local control plane,
  - start the local runtime services,
  - expose a local dashboard URL,
  - show health, ports, and current environment status.
- The first-run experience should create or initialize:
  - local config,
  - local data directory,
  - default admin/operator context,
  - example connection templates.

### MVP acceptance

- A user can install MCPGate in <= 10 minutes.
- `mcpgate` starts all required local services with one command.
- The CLI prints local URLs, health state, and next steps.
- The dashboard is reachable without extra manual orchestration.

### Implementation plan

1. Define the CLI entrypoint and config file structure.
2. Implement `mcpgate start`, `mcpgate doctor`, and `mcpgate init`.
3. Add local service bootstrapping for API + runtime + dashboard.
4. Add first-run setup and default local state.
5. Package for Homebrew and Docker quick start.

## US-02 - Connect MCPs from multiple sources

### User story

As a local operator,
I want to connect MCPs from different origins such as Supabase, Slack, Grafana, or a local Hilos MCP,
so that I can manage all my MCP connections from one place.

### Feature definition

- MCPGate must support local and remote MCP sources.
- Each connection should capture:
  - source name,
  - source type,
  - transport,
  - endpoint or command,
  - authentication method,
  - environment or host metadata.
- Initial adapter classes:
  - Custom MCP,
  - Supabase MCP,
  - Slack MCP,
  - Grafana MCP.
- Local MCP support should include:
  - local command execution,
  - local stdio transport,
  - local environment variables,
  - local endpoint testing.

### MVP acceptance

- A user can create at least one local MCP connection and one remote MCP connection.
- Connected MCPs appear in a dashboard list with status and last test result.
- Credentials or secrets are never shown back in plain text after save.

### Implementation plan

1. Define a stable adapter interface and source schema.
2. Implement the generic Custom MCP adapter first.
3. Add typed adapters for Supabase, Slack, and Grafana.
4. Add secure credential storage and masking.
5. Add source list and source detail views in CLI + dashboard.

## US-03 - Test and diagnose each connection

### User story

As a local operator,
I want to test every MCP connection and see diagnostics,
so that I can verify whether the MCP is working before using it inside a custom server.

### Feature definition

- Each source must have:
  - connection test,
  - health check,
  - last successful handshake,
  - last error details,
  - transport diagnostics.
- The operator should be able to run tests from:
  - dashboard button,
  - `mcpgate source test <source>` CLI command.
- Diagnostics should distinguish:
  - invalid credentials,
  - unreachable endpoint,
  - command boot failure,
  - MCP handshake failure,
  - tool discovery failure.

### MVP acceptance

- Every configured source can be tested manually.
- The operator sees a clear pass/fail result and a reason.
- Last known health is visible from the source list.

### Implementation plan

1. Standardize source health status and test result payloads.
2. Build adapter-level `validateConnection` and `healthCheck` methods.
3. Persist test runs and latest diagnostic result.
4. Expose health APIs and CLI commands.
5. Add dashboard diagnostics panel and retry actions.

## US-04 - Inspect tools from each MCP

### User story

As a local operator,
I want to see which tools each MCP exposes,
so that I can understand what capabilities are available before composing custom servers.

### Feature definition

- MCPGate must discover and persist tool metadata per source.
- The user must see:
  - tool name,
  - source,
  - title/description,
  - input schema,
  - capability hint,
  - last discovered time,
  - current availability.
- The product must distinguish:
  - upstream discovered tools,
  - tools currently exposed through MCPGate custom servers.

### MVP acceptance

- The user can trigger discovery for a source.
- The dashboard and CLI show the discovered tools per source.
- The user can search or filter by source and tool name.

### Implementation plan

1. Keep `source_tools` as discovery history.
2. Introduce `workspace_tools` or equivalent current-catalog state.
3. Implement discovery jobs and catalog normalization.
4. Add list/filter/search views for discovered tools.
5. Add future-safe metadata fields for capability and risk hints.

## US-05 - Create a new custom MCP server from sub-MCPs

### User story

As an MCP builder,
I want to create a new custom MCP server and attach multiple upstream MCPs to it,
so that I can publish one curated MCP surface that combines the tools I actually want.

### Feature definition

- The user can create a named custom MCP server inside MCPGate.
- A custom MCP server can reference one or many upstream MCP sources.
- Each custom MCP server must include:
  - name,
  - slug or runtime id,
  - listen port or endpoint config,
  - attached sub-MCPs,
  - enabled tool set,
  - lifecycle status.
- A custom MCP server is a first-class object, not just a saved filter.

### MVP acceptance

- A user can create a custom MCP server from at least two upstream sources.
- The product can publish one endpoint that aggregates tools from those sources.
- The custom MCP configuration survives restart.

### Implementation plan

1. Define the `custom_mcp_servers` domain model.
2. Define the relationship between custom servers and attached sources.
3. Implement CLI and dashboard create/edit flows.
4. Generate runtime configuration from saved server definitions.
5. Persist and reload server state on process restart.

## US-06 - Edit tool exposure inside each custom MCP server

### User story

As an MCP builder,
I want to enable or disable individual tools for each custom MCP server,
so that the published server only exposes the exact tools I choose.

### Feature definition

- Tool exposure rules must be scoped to the custom MCP server.
- A tool can be:
  - enabled,
  - disabled,
  - hidden from listing,
  - reserved for future policy restrictions.
- The operator must be able to:
  - toggle tools individually,
  - bulk enable/disable by source,
  - see effective tool count before publish.
- Tool editing must not modify the upstream MCP itself.
- It only changes the custom MCP surface published by MCPGate.

### MVP acceptance

- A user can disable a tool from a sub-MCP and confirm it no longer appears in `list_tools` for the custom MCP.
- A disabled tool cannot be invoked through the custom MCP endpoint.
- Tool toggles remain stable across rediscovery as long as canonical keys remain stable.

### Implementation plan

1. Scope current tool catalog state to custom MCP server exposure.
2. Keep stable canonical tool identities.
3. Implement tool toggle persistence and batch operations.
4. Connect toggle state to runtime filtering and invocation rules.
5. Add clear “upstream vs exposed” views in CLI and dashboard.

## US-07 - Start, stop, and toggle custom MCP servers

### User story

As a local operator,
I want to turn my custom MCP servers on or off from a dashboard or CLI,
so that I can control which MCP endpoints are currently active on my machine or infra.

### Feature definition

- Every custom MCP server must have lifecycle controls:
  - start,
  - stop,
  - restart,
  - enable on boot,
  - disable on boot.
- The user should see:
  - running state,
  - endpoint URL,
  - port binding,
  - last start time,
  - last failure.
- The dashboard should provide simple toggles.
- The CLI should provide deterministic commands for automation.

### MVP acceptance

- A user can start and stop a custom MCP server from dashboard and CLI.
- Running state is visible in both views.
- A stopped server no longer answers MCP requests.

### Implementation plan

1. Define runtime lifecycle manager.
2. Persist server desired state and actual runtime state.
3. Implement `mcpgate server start|stop|restart` commands.
4. Add dashboard toggles and status polling.
5. Add logs and failure reasons per custom server.

## US-08 - Self-host custom MCPs safely

### User story

As a platform engineer,
I want MCPGate users to host their own custom MCPs in their own infrastructure,
so that they can keep control of secrets, local adapters, and deployment constraints.

### Feature definition

- The product must support:
  - local single-machine mode,
  - Docker Compose mode,
  - server deployment mode.
- Custom MCP definitions should be exportable and portable.
- The runtime should support local-only adapters and internal endpoints that are not exposed publicly.
- Secrets must stay in user-controlled infrastructure.

### MVP acceptance

- A user can run MCPGate locally and in a self-hosted server environment.
- A user can move a saved config from one machine to another with explicit export/import flows.
- No MCPGate-managed cloud is required for normal operation.

### Implementation plan

1. Define deployment modes and config boundaries.
2. Support local data directory and team deployment config.
3. Add config export/import workflow.
4. Ship Docker Compose and self-hosting docs.
5. Add startup checks for secrets, ports, and storage configuration.

## US-09 - Grow an open-source adapter ecosystem

### User story

As a contributor,
I want to add new source adapters and improve existing ones,
so that MCPGate grows through community adoption and contributions.

### Feature definition

- The source adapter system must be well-defined and documented.
- The project should provide:
  - adapter interface package,
  - example adapter,
  - contribution guide,
  - test harness for adapters,
  - compatibility expectations.
- Community-added adapters should not require editing the entire core.

### MVP acceptance

- A contributor can add a new adapter with a documented contract.
- The repo includes a reference adapter and adapter tests.
- The architecture separates core runtime behavior from source-specific code.

### Implementation plan

1. Define the adapter SDK contract.
2. Publish one or more reference adapters in-tree.
3. Add adapter fixture tests and fake MCP servers.
4. Document contribution workflow.
5. Plan plugin or package-based adapter loading after MVP.

## Detailed project plan

## 1. Recommended technical direction

### Primary language

- **TypeScript end-to-end** for v1.

### Why

- It preserves the current investment in `mcpgate-api` and `mcpgate-web`.
- It reduces context switching across CLI, runtime, backend, and UI.
- It is contributor-friendly for an open-source developer tool.

### Runtime baseline

- **Node.js 22 LTS**

### Package management

- **pnpm**

### Why

- Better fit than maintaining mixed `yarn` + `npm` once the product becomes CLI-first and package-oriented.
- Better workspace support for shared packages and OSS contributor ergonomics.

## 2. Recommended repo strategy

### Recommended target

Move toward a monorepo once the CLI-first reset is approved.

### Suggested structure

```text
mcpgate/
  apps/
    mcpgate-cli/
    mcpgate-api/
    mcpgate-web/
  packages/
    core/
    runtime/
    source-adapter-sdk/
    source-adapters/
    policy-engine/
    shared-types/
```

### Why

- The product now needs one shared core across CLI, runtime, and dashboard.
- Adapter contracts should live outside a single backend app.
- OSS contributors will benefit from one workspace and one build system.

### Transition plan

1. Keep current repos working short term.
2. Define the shared packages first.
3. Decide whether to migrate to monorepo before or after first CLI prototype.

## 3. Recommended framework choices

### CLI

- **oclif**

### Why

- Strong fit for OSS CLI distribution.
- Good command structure and future plugin compatibility.

### API / local control plane

- **NestJS**

### Why

- Already in place.
- Good fit for modular domains, adapters, services, and runtime orchestration APIs.

### Dashboard

- **Next.js App Router**

### Why

- Already in place.
- Good companion UI for local and team use.

### Desktop later

- **Tauri** on top of the web UI when desktop becomes necessary.

### Why

- Better footprint than Electron.
- Lets MCPGate reuse its web UI and local API.

## 4. Recommended storage and infrastructure strategy

### Local mode

- Default storage: **SQLite**
- Local secrets: encrypted local store or file-backed encrypted config

### Team / server mode

- Supported storage: **Postgres**
- Optional cache and background coordination: **Redis** only when needed

### Why this split

- Local-first installs should not require a database server.
- Team self-hosted installs still benefit from Postgres.
- Avoid forcing Redis in early local mode.

## 5. Distribution plan

### Required delivery artifacts

1. Git clone developer mode
2. Homebrew install
3. Docker image
4. Docker Compose quick start

### Later artifacts

1. Tauri desktop build
2. Helm chart
3. Plugin/adapters registry strategy

## 6. Core architecture plan

### Core subsystems

1. **CLI orchestrator**
   - start local services
   - inspect config
   - run diagnostics
   - manage custom MCP servers

2. **Local control plane**
   - source CRUD
   - test and discovery
   - custom MCP server definitions
   - tool exposure state
   - audit and diagnostics

3. **Runtime engine**
   - load custom MCP definitions
   - aggregate sub-MCP tools
   - filter enabled tools
   - route allowed calls

4. **Dashboard companion UI**
   - sources
   - tools
   - custom servers
   - runtime lifecycle
   - diagnostics

5. **Adapter SDK**
   - validate connection
   - health check
   - discover tools
   - invoke tool

## 7. Execution framework for the project

### Working model

- Product planning in markdown under `planning/`
- GitHub Issues for implementation tasks
- GitHub Projects for milestone tracking
- Lightweight ADRs for architecture decisions
- 1-week build cycles for early product shaping

### Suggested process

1. **Product definition**
   - define story
   - define acceptance
   - define technical approach

2. **Architecture decision**
   - create ADR when a decision changes repo layout, storage, runtime model, or packaging

3. **Implementation batch**
   - one vertical slice at a time
   - each slice must end in runnable behavior

4. **Verification**
   - CLI e2e test
   - dashboard smoke test
   - fake MCP integration test

5. **Documentation**
   - update install docs
   - update adapter docs
   - update roadmap

## 8. Recommended implementation sequence

### Track A - Product reset

1. Confirm CLI-first architecture.
2. Confirm repo strategy: keep split repos temporarily or migrate to monorepo.
3. Confirm local storage strategy: SQLite default, Postgres supported.

### Track B - Local core

1. Build `mcpgate init`
2. Build `mcpgate start`
3. Build local config and local data directory
4. Start API + runtime + dashboard from one CLI

### Track C - Source management

1. Custom MCP adapter
2. Source CRUD and credential flow
3. Source testing and diagnostics
4. Tool discovery and normalization

### Track D - Custom server composition

1. Create custom MCP server objects
2. Attach many sub-MCPs
3. Publish aggregated tool catalog
4. Start and stop custom MCP servers

### Track E - Tool governance

1. Per-server tool toggles
2. Runtime filtering for `list_tools`
3. Runtime deny for `call_tool`
4. Audit trail and diagnostics

### Track F - Packaging and OSS launch

1. Homebrew distribution
2. Docker Compose template
3. Adapter SDK docs
4. Contribution guide
5. Public roadmap and issue labels

## 9. Immediate next decisions required

Before implementation resumes, the project should explicitly decide:

1. whether MCPGate keeps the current multi-repo structure or moves to monorepo,
2. whether local-first storage is SQLite by default,
3. whether `mcpgate-web` remains a companion dashboard or gets folded into a future desktop shell,
4. whether the first custom server model is workspace-based, machine-based, or both,
5. whether adapter loading is built as in-tree packages first or as external plugins from day one.

## 10. Recommended short answer

If speed and product clarity matter most, the recommended path is:

- keep TypeScript,
- keep NestJS and Next.js for now,
- add a new `mcpgate-cli` as the primary product entry,
- support SQLite for local mode and Postgres for team mode,
- treat the dashboard as a companion,
- build the custom MCP server composition flow before advanced policy work,
- and optimize the whole project around one command: `mcpgate`.
