# Phase 1 - Frontend Specification

## Tech baseline

- React + TypeScript
- State management: React Query + lightweight local store
- Component system: accessible primitives + consistent table/filter patterns

## Main views

1. **Login and Workspace**
2. **Sources**
3. **Unified Tools Catalog**
4. **Policies**
5. **Deployments**
6. **Audit Logs**

## Detailed view requirements

### Sources
- Card per source with status: connected, degraded, disconnected.
- Add source wizard with type-specific forms.
- Connection test button with inline diagnostics.

### Unified Tools Catalog
- Table columns: tool id, source, capability class, risk, active state.
- Batch actions: enable selected, disable selected, assign profile.
- Search by tool name and source.

### Policies
- Profile presets: read-only, operator, admin.
- Rule editor for explicit allow/deny by tool id.
- Impact preview panel:
  - tools newly denied,
  - tools newly allowed.

### Deployments
- Show unified endpoint URL.
- Show active credential IDs (masked) and creation date.
- Buttons: rotate key, revoke key, regenerate endpoint config snippet.

### Audit
- Filters: date range, actor, source, tool, decision.
- Export to CSV and JSON.

## Frontend auth behavior

- Route guards by role.
- Session refresh handling and forced logout on token expiry.
- Unauthorized action modal with clear reason.
