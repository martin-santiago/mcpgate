# MCPGate Progress Ledger

Living status ledger for MCPGate. This file tracks execution progress only; product requirements, architecture details, and full roadmap definitions remain in the existing planning docs.

Last updated: 2026-05-05  
Current stage: Stage 0 — Foundation / Pre-MVP  
Current status: Foundation local CLI/API control-plane smoke passes with placeholder discovery; MVP runtime path is not demoable yet.

## Source of Truth Links

- Product/architecture index: `README.md`
- Release phases: `planning/release-plan-phases.md`
- ADRs: `planning/adr/`
- Phase 0 discovery: `planning/phase-0-discovery/`
- Phase 1 MVP specs: `planning/phase-1-mvp-self-hosted/`

## Current Snapshot

MCPGate is a pnpm monorepo with:

- `apps/api`: NestJS API / local control plane
- `apps/cli`: Oclif CLI
- `apps/web`: Next.js companion UI / landing
- `legacy/single-package`: preserved legacy implementation

Current known gaps:

- Gateway runtime is not integrated end-to-end.
- CLI source/discovery flow is validated against API local mode for placeholder custom sources; real MCP source discovery remains pending.
- Landing is still placeholder.
- Monorepo infra/CI is incomplete.
- MVP demo path is not yet passing: `init → source add → discover real → unified MCP endpoint → tools/list/call from MCP Inspector`.

Validated on 2026-05-05:

- Root `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm build:api`, `pnpm build:cli`, `pnpm build:web`, `pnpm lint:web`, and `pnpm test:api` pass.
- `pnpm lint:api` still fails due to preexisting API lint debt; root script is non-destructive and does not use `--fix`.
- CLI `init` and `doctor` pass with a temporary home; default local service config resolves the monorepo root and uses root `pnpm --filter` commands.
- Controlled CLI/API local-mode smoke passes with temporary `HOME`, API local mode, and SQLite: `init`, `doctor`, API readiness via `GET /api/workspaces`, `source list`, `source add demo --type custom --url http://localhost:9999`, `source list`, `source discover <id>`, and `tools list`.
- User-facing smoke now passes through `node apps/cli/dist/index.js start --api-only --timeout 45` with a temporary `HOME`: `init`, API readiness through `source list`, `source add demo --type custom --url http://localhost:9999`, `source discover <id>`, `tools list`, and process cleanup leaving ports 3000/3001 free.
- Local SQLite on Node 24 required rebuilding the native `sqlite3` binding before API startup; the API currently has no dedicated unauthenticated health endpoint, so readiness was verified through local-mode `GET /api/workspaces`.

## Stage Definitions

### Stage 0 — Foundation / Pre-MVP

Goal: make the monorepo, CLI, API, and local runtime foundations coherent enough to build the first demoable slice.

Exit criteria:

- [x] Monorepo scripts work from root with `pnpm`.
- [x] CLI can initialize a local MCPGate workspace.
- [x] API/control plane can store sources and discovered tools.
- [ ] Gateway runtime has a concrete implementation plan and first integration path.
- [ ] Web/landing communicates current product direction.
- [ ] CI validates install, lint, typecheck/build for affected apps.

### Stage 1 — MVP Self-Hosted

Goal: deliver a local/self-hosted MCP gateway that can aggregate real MCP sources and expose a unified MCP endpoint.

Exit criteria:

- [ ] Demo path works from a clean machine.
- [ ] At least one real stdio source can be added and discovered.
- [ ] Unified endpoint supports MCP initialize, tools/list, and tools/call.
- [ ] Tool names are namespaced and stable.
- [ ] Basic consent, logs, health, and error handling exist.
- [ ] README explains install, run, and MCP Inspector verification.

### Stage 2 — Cloud / Managed Mode

Goal: introduce hosted/team-oriented operation after the self-hosted MVP is stable.

Exit criteria:

- [ ] Multi-tenant model is implemented.
- [ ] Managed runtime deployment is defined.
- [ ] Auth, billing-ready boundaries, and operational controls exist.
- [ ] Cloud docs distinguish hosted vs self-hosted behavior.

### Stage 3 — Differentiators

Goal: add product advantages beyond a basic MCP gateway.

Exit criteria:

- [ ] Advanced policy engine is available.
- [ ] Better observability, governance, and adapter ecosystem features exist.
- [ ] Enterprise/security capabilities are productized where relevant.

## MVP Gates

### Repo / Monorepo

- [x] Root `pnpm install` succeeds.
- [x] Root scripts exist for lint/build/test or filtered equivalents.
- [x] No new package manager lockfiles outside root.
- [x] `apps/api`, `apps/cli`, and `apps/web` keep local `AGENTS.md` rules respected.
- [ ] Legacy code remains isolated under `legacy/single-package`.

### CLI

- [x] `mcpgate init` creates/validates local config.
- [ ] `mcpgate source add` supports at least one real stdio MCP source.
- [x] CLI auth/config behavior is corrected and predictable for local-mode source/discovery flows.
- [x] CLI can trigger discovery or call the API path that does it.
- [ ] CLI errors are actionable and non-destructive.

### API / Control Plane

- [x] Source registry exists.
- [x] Discovered tools are persisted or represented consistently.
- [ ] Health endpoints exist for local diagnostics.
- [ ] Runtime publication data can be read by the gateway.
- [ ] API contracts align with Phase 1 backend spec.

### Gateway Runtime

- [ ] Supports MCP `initialize`.
- [ ] Advertises `capabilities.tools`.
- [ ] Supports `tools/list`.
- [ ] Supports `tools/call`.
- [ ] Connects to local stdio MCP sources.
- [ ] Exposes unified Streamable HTTP endpoint.
- [ ] Applies stable namespacing for tools.
- [ ] Returns clear health/error states.

### Web

- [ ] Companion UI role remains secondary to CLI/self-hosted flow.
- [ ] Displays sources/tools/runtime status when API support exists.
- [ ] Does not block MVP demo path.

### Landing / Docs

- [ ] Landing is no longer placeholder.
- [ ] README explains value proposition and quickstart.
- [ ] Demo instructions include MCP Inspector verification.
- [ ] Docs clearly state current limitations.

### Infra / CI

- [ ] CI runs install and validation.
- [ ] Docker/self-hosted baseline is documented or scaffolded.
- [ ] Environment examples exist.
- [ ] Commands are filtered by package where appropriate.

### Security / Governance

- [ ] Source credentials are not logged.
- [ ] Tool call logs avoid sensitive payload exposure by default.
- [ ] Consent/allowlist model exists for exposed tools.
- [ ] Runtime credentials can be rotated or regenerated.
- [ ] Audit trail exists for source/tool/runtime actions.

## Prioritized Roadmap

### M0 — Foundation Closeout

Exit criteria:

- [ ] Monorepo operational.
- [x] CLI init/config corrected; local-mode source/discovery auth validated.
- [x] API baseline validated.
- [ ] Landing/README updated from placeholder state.

### M1 — First Real Source Discovery

Exit criteria:

- [ ] Add one real stdio MCP source.
- [ ] Discover tools from that source.
- [ ] Store/display discovered tool metadata.
- [ ] Namespaced tool identity defined.

### M2 — Unified Gateway Demo

Exit criteria:

- [ ] Unified Streamable HTTP endpoint runs.
- [ ] MCP Inspector can initialize and list tools.
- [ ] MCP Inspector can call at least one proxied tool.
- [ ] Logs show source, tool, result/error.

### M3 — MVP Hardening

Exit criteria:

- [ ] Health checks and error contracts are consistent.
- [ ] Basic policy/consent is enforced.
- [ ] README demo path works from scratch.
- [ ] CI protects the MVP path.

## Immediate Backlog

### P0

- [ ] Implement or wire source add/discovery for one real stdio MCP.
- [ ] Implement unified gateway endpoint with minimal MCP methods.
- [ ] Verify with MCP Inspector: initialize, tools/list, tools/call.

### P1

- [ ] Persist normalized source/tool metadata in API.
- [ ] Add health/error reporting across CLI/API/gateway.
- [ ] Replace landing placeholder with concise product page.
- [ ] Add root CI for pnpm install/build/lint.

### P2

- [ ] Add consent/allowlist UI or config surface.
- [ ] Improve logs/audit views.
- [ ] Add self-hosted Docker/dev environment docs.
- [ ] Expand supported source types beyond first stdio source.

## Update Protocol

At the end of each implementation session:

1. Update `Last updated`.
2. Move completed checklist items to checked state.
3. Add newly discovered gaps under `Current Snapshot`.
4. Keep detailed specs in existing phase docs; only summarize execution status here.
5. Update `Immediate Backlog` priorities.
6. If a decision changes architecture, add or update an ADR instead of only editing this file.
