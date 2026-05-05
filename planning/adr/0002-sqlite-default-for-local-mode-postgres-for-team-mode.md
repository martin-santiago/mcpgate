# ADR 0002 - SQLite Default For Local Mode, Postgres For Team Mode

## Status

Accepted

## Context

The new MCPGate product promise is local-first and self-hosted.

The first user experience should feel like this:

1. install MCPGate,
2. run `mcpgate`,
3. open a local dashboard,
4. connect and operate MCPs.

If local mode requires an external Postgres setup from day one, the product loses much of its simplicity.

However, team self-hosted deployments still benefit from Postgres due to:

- stronger concurrency guarantees,
- better ops familiarity,
- easier remote deployment patterns,
- scalability beyond a single machine.

## Decision

MCPGate will default to SQLite for local mode and support Postgres for team/server mode.

Rules:

- local single-machine install -> SQLite by default,
- team/self-hosted server deployment -> Postgres supported and recommended,
- Redis is optional and should not be required for the first local product experience.

The domain model and service boundaries must be written to support both storage modes.

## Consequences

### Positive

- Removes database setup friction for local installs.
- Better matches a CLI-first product.
- Makes `brew install mcpgate && mcpgate start` much more realistic.
- Preserves a path to stronger team/server deployments.

### Negative

- Requires care around SQL portability and ORM usage.
- Some production-grade features may need conditional behavior by storage mode.
- Migration tooling becomes slightly more complex.

## Immediate implementation rule

The first CLI slice should assume SQLite local mode as the default happy path.

Postgres support should be added without forcing it into the default install flow.
