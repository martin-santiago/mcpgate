# Phase 0 - mcpgate-cli Initial Architecture

## Objective

Define the first implementation shape of `mcpgate-cli` so the next execution step can move directly into scaffolding and runnable behavior.

## Product role of `mcpgate-cli`

`mcpgate-cli` is the primary entrypoint of MCPGate.

Its first job is not to replace the entire product surface.

Its first job is to make this true:

```bash
mcpgate init
mcpgate start
```

After that, the CLI expands into source management, diagnostics, and custom server lifecycle operations.

## First-slice goals

The first slice must deliver a real local product loop:

1. initialize MCPGate local state,
2. create a local config/data home,
3. start the local services needed by the product,
4. print local URLs and status,
5. make the dashboard discoverable from the CLI.

## Initial command set

### Required in slice 1

- `mcpgate init`
- `mcpgate start`
- `mcpgate doctor`

### Expected later

- `mcpgate status`
- `mcpgate source add`
- `mcpgate source test`
- `mcpgate source list`
- `mcpgate server create`
- `mcpgate server start`
- `mcpgate server stop`
- `mcpgate server list`

## Responsibilities by command

## `mcpgate init`

Creates the local MCPGate home.

Expected outputs:

- config file,
- local database path,
- logs directory,
- runtime state directory,
- default ports,
- onboarding message.

Suggested default home:

- macOS/Linux: `~/.mcpgate/`

Suggested initial structure:

```text
~/.mcpgate/
  config.json
  data/
  logs/
  runtime/
  sources/
```

## `mcpgate start`

Starts the local MCPGate environment.

Responsibilities:

- verify config exists,
- run environment checks,
- bootstrap local storage if needed,
- start local control plane API,
- start local runtime manager,
- ensure dashboard access path is available,
- print final status summary.

Initial expected output:

- API URL,
- dashboard URL,
- storage mode,
- logs path,
- current process state.

## `mcpgate doctor`

Runs diagnostics before or after startup.

Checks should include:

- config presence,
- storage accessibility,
- port availability,
- required runtime binaries or node version,
- dashboard/API reachability when already running.

## Initial architecture boundaries

## CLI layer

Responsible for:

- parsing commands,
- interactive prompts when needed,
- showing status and diagnostics,
- orchestrating local service boot.

It should not contain heavy business logic.

## Local service manager

Responsible for:

- starting/stopping child processes or local services,
- port management,
- PID/state tracking,
- health polling.

This can begin as an internal package or module and later become shared runtime infra.

## Config manager

Responsible for:

- reading and writing `config.json`,
- resolving default paths,
- choosing storage mode,
- validating config schema.

## Local control plane API

Responsible for:

- source CRUD,
- discovery orchestration,
- custom MCP server definitions,
- tool exposure state,
- diagnostics and audit.

The current `mcpgate-api` should initially play this role.

## Dashboard companion

Responsible for:

- sources UI,
- tools UI,
- custom servers UI,
- diagnostics UI.

The current `mcpgate-web` should initially play this role.

## Initial storage model

For slice 1:

- default local mode uses SQLite,
- config is file-based,
- process/runtime state can be file-based,
- Redis is not required.

## Recommended startup model for slice 1

`mcpgate start` should initially orchestrate existing apps instead of rewriting everything.

Practical interpretation:

1. start or prepare local storage,
2. start the local API in a development-friendly mode,
3. start the local dashboard in a development-friendly mode,
4. expose one summary in the CLI.

This preserves momentum and validates the CLI-first narrative quickly.

## Suggested internal modules for the CLI app

```text
src/
  commands/
    init.ts
    start.ts
    doctor.ts
  services/
    config-service.ts
    local-service-manager.ts
    doctor-service.ts
    output-service.ts
  utils/
    paths.ts
    ports.ts
    env.ts
  types/
    config.ts
    runtime-state.ts
```

## First implementation milestone

### Milestone name

CLI Local Bootstrap

### Done means

- `mcpgate init` creates valid local state,
- `mcpgate doctor` passes on a healthy machine,
- `mcpgate start` brings up local MCPGate services,
- CLI prints the local dashboard URL and health state,
- docs explain the first-run workflow.

## Current implementation baseline

The first scaffold now exists in `mcpgate-cli` with:

- `init`
- `doctor`
- `start`

Current verified behavior:

- `init` creates `~/.mcpgate/` and default config,
- `doctor` validates local config, paths, and base port availability,
- `start` boots `mcpgate-web` and `mcpgate-api` in local mode.
- `source list` ensures a local workspace exists and lists current sources.
- `source add <name> --type custom --url <url>` creates a source through the local API.
- `source test <source-id>` verifies a custom source connection through the local API.
- `source discover <source-id>` populates the first discovered tools for a source.
- `tools list` shows the current tool catalog stored in the local workspace.

Current local-mode baseline:

- `mcpgate-api` now supports SQLite-backed startup when `MCPGATE_LOCAL_MODE=true` and `MCPGATE_STORAGE_MODE=sqlite`.
- `mcpgate-cli` injects those env vars automatically during `start`.
- the current entities were adjusted for basic SQLite portability in the bootstrap slice.
- local auth is bypassed in CLI mode through a synthetic local operator user so the CLI can drive the local API without Supabase login during bootstrap.
- custom source discovery currently supports config-provided `mockTools` and otherwise falls back to placeholder tools per source type while the real adapter discovery layer is still pending.

Current known limitation:

- `mcpgate-web` still shows the Next.js deprecation warning for `middleware` vs `proxy`, but startup succeeds.

## Risks to watch early

1. existing `mcpgate-api` assumptions may still be too web-backend-centric,
2. existing `mcpgate-web` assumptions may still require external env setup,
3. SQLite support may require refactoring current persistence assumptions,
4. process orchestration can become flaky if startup contracts are not explicit.

## Recommendation

Do not begin by over-designing plugins, desktop packaging, or advanced policy UI.

Begin by making one local bootstrap path feel real and reliable.

If `mcpgate init` and `mcpgate start` feel good, the rest of the product can grow around them with much more confidence.
