# ADR 0001 - Monorepo Target With Phased Migration

## Status

Accepted

## Context

MCPGate was initially shaped as separate repos focused on backend and web dashboard.

The product direction has now changed:

- CLI-first,
- self-hosted,
- open-source,
- shared core across CLI, runtime, dashboard, and adapters.

The existing split-repo setup creates friction for this direction because:

- shared packages would otherwise need duplication or cross-repo coordination,
- adapter SDK and runtime code should not belong only to the backend repo,
- contributor onboarding is simpler with one workspace and one package manager,
- the CLI must orchestrate multiple local services and shared domain logic.

At the same time, forcing a full migration before the first CLI prototype would slow down momentum.

## Decision

MCPGate will target a monorepo architecture, but migration will be phased.

Short term:

- keep the current repos operational,
- define the future monorepo structure now,
- start extracting shared concepts as if they will live in shared packages,
- prioritize a first `mcpgate-cli` prototype before attempting a full repo migration.

Target structure:

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

## Consequences

### Positive

- Aligns repo shape with the CLI-first product.
- Makes adapter SDK and runtime reuse natural.
- Improves OSS contributor experience.
- Reduces long-term duplication across CLI, API, runtime, and UI.

### Negative

- Introduces a future migration cost.
- Requires discipline during the interim split-repo period.
- Tooling and CI will need to be redesigned later.

## Immediate implementation rule

Any new architecture work should be designed as monorepo-ready even if code is still committed in separate repos for now.

That means:

- avoid repo-local assumptions in shared domain design,
- use package-like boundaries conceptually,
- do not deepen coupling between `mcpgate-api` and `mcpgate-web` as if they were the only product surfaces.
