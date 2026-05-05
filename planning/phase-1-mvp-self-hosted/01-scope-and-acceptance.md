# Phase 1 - MVP Self-Hosted Scope and Acceptance

## Goal

Ship a production-usable self-hosted MVP for early design partners.

## In-scope features

- Dashboard auth and workspace creation.
- Source onboarding: Supabase, Slack, Custom.
- Tool discovery and unified catalog.
- Visual tool enable/disable controls.
- Policy profiles with read-only baseline.
- Unified MCP endpoint publication.
- Runtime policy enforcement and audit trail.

## Out-of-scope

- Cloud multi-tenant hosting.
- SSO/SAML and SCIM.
- Advanced argument-level policy DSL.
- Billing and subscription engine.

## MVP acceptance checklist

- [ ] User can login and create workspace.
- [ ] User can add each initial source type.
- [ ] Tool list appears in unified catalog.
- [ ] User toggles tool off and runtime denies that tool.
- [ ] User applies read-only profile and write tools are denied.
- [ ] Endpoint credentials can be generated and revoked.
- [ ] Audit page shows policy changes and runtime calls.

## Pilot success metrics

- Time to first source connection < 15 min.
- Time to first endpoint < 20 min.
- >= 90% of blocked calls are intentional policy blocks.
