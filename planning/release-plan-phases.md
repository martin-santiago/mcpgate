# MCPGate Release Plan by Phases

## Planning assumptions

- Team size for baseline plan: 4-6 people.
- Roles: 1 product lead, 1 frontend engineer, 2 backend/runtime engineers, 1 infra engineer, 1 QA/shared.
- Cadence: 2-week sprints.
- Product direction: open-source, self-hosted, CLI-first. Visual surfaces remain optional companions, not the core dependency.

## Global milestone map

- Phase 0: product and architecture definition.
- Phase 1: self-hosted MVP.
- Phase 1.5: hardening and onboarding optimization.
- Phase 2: packaged local experiences and ecosystem growth.
- Phase 2.5: enterprise pack.
- Phase 3: differentiators and moat.

## Phase 0 timeline (2 weeks)

### Sprint outcomes
- Finalized PRD and acceptance criteria.
- Validated data model and API contracts.
- Security model defined for dashboard and runtime.

### Exit gate
- Product sign-off + architecture sign-off + security sign-off.

## Phase 1 timeline (8-10 weeks)

### Sprint 1
- Repo bootstrap and local dev environment.
- Auth skeleton and local operator workflow.
- Initial DB schema and migrations.
- CLI architecture and config model baseline.

### Sprint 2
- Source onboarding API and CLI for Custom source.
- Connection test and health check endpoints.
- Tool discovery pipeline first version.

### Sprint 3
- Supabase and Slack source adapters.
- Unified tool catalog read-only operations.
- Tool metadata normalization and capability classification.

### Sprint 4
- Tool activation toggles and policy operations in CLI.
- Policy profiles and policy persistence.
- Runtime `list_tools` filtering.

### Sprint 5
- Runtime `call_tool` enforcement.
- Unified endpoint publication and credential creation.
- Audit event persistence and local inspection UX v1.

### Sprint 6
- End-to-end stabilization.
- Pilot deployment templates (Docker Compose and local-first packaging).
- Security and performance testing baseline.

### Exit gate
- Pilot customer can run self-hosted deployment.
- Mandatory acceptance checklist in phase-1 scope doc passes.

## Phase 1.5 timeline (4 weeks)

### Sprint 7
- Guided setup wizards for Supabase and Slack.
- Better diagnostics for source onboarding failures.

### Sprint 8
- Policy linting and safer defaults.
- Runtime resilience controls + improved observability.

### Exit gate
- Time-to-first-value improved and support load reduced.

## Phase 2 timeline (6-8 weeks)

### Sprint 9
- Optional packaged desktop or richer local UI layer.
- Multi-tenant schema hardening only if it still supports the self-hosted open core.

### Sprint 10
- Advanced secrets integration.
- Install and upgrade ergonomics.

### Sprint 11
- Ecosystem adapters and community extension workflow.
- Operational runbooks and SLO dashboards.

### Exit gate
- Self-hosted teams can onboard and operate MCPGate with minimal friction.

## Phase 2.5 timeline (6 weeks)

### Sprint 12
- SAML SSO and SCIM baseline.
- Custom roles and permission bundles.

### Sprint 13
- SIEM export and compliance controls.
- Extended audit retention and integrity verification.

### Exit gate
- Enterprise procurement checklist achievable.

## Phase 3 timeline (continuous)

- Argument-aware policy engine.
- Policy simulation and recommendation engine.
- Risk scoring and anomaly detection.

## Strategic note

- A future managed cloud offering is no longer the default assumption.
- If it ever exists, it should reuse the open-source self-hosted core instead of defining the architecture from the top down.

## Cross-phase auth checklist

- [ ] Dashboard user auth
- [ ] RBAC and permission checks
- [ ] Runtime client auth
- [ ] Secret encryption and rotation
- [ ] Audit logging for all security-sensitive events
- [ ] Tenant isolation tests
