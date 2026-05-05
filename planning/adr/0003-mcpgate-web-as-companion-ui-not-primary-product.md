# ADR 0003 - mcpgate-web As Companion UI, Not Primary Product

## Status

Accepted

## Context

The original product direction leaned heavily on a dashboard-centered experience.

The revised direction is:

- CLI-first,
- self-hosted,
- local-first,
- open-source,
- composable custom MCP servers.

In this model, the dashboard is still valuable, but it should no longer define the core product architecture.

The primary product promise is the command:

```bash
mcpgate
```

The dashboard should support that workflow, not replace it.

## Decision

`mcpgate-web` will be treated as a companion UI.

It remains important, but it is not the primary product entrypoint.

The main product entrypoint becomes `mcpgate-cli`, which should:

- initialize local state,
- boot local services,
- expose the dashboard URL,
- manage custom MCP servers,
- run diagnostics.

The web app should focus on:

- connection management,
- tool inspection,
- custom server composition,
- runtime status,
- diagnostics.

## Consequences

### Positive

- Aligns architecture with the new product narrative.
- Prevents the dashboard from driving unnecessary cloud-style assumptions.
- Keeps the current web investment useful as a companion and future desktop shell candidate.

### Negative

- Some previously central dashboard assumptions may need to be downgraded.
- Product copy, docs, and implementation priorities must be updated carefully.

## Immediate implementation rule

No new feature should require the dashboard as the only way to operate MCPGate.

All critical product actions must eventually have a CLI path, even if the dashboard exposes them more comfortably.
