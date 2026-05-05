# Phase 1 - Backend API Specification

## Core services

- Auth service
- Workspace and membership service
- Source registry service
- Tool catalog service
- Policy service
- Deployment and credential service
- Audit service

## API domains

### Auth
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Workspaces
- `POST /workspaces`
- `GET /workspaces/:id`
- `POST /workspaces/:id/members`

### Sources
- `POST /sources`
- `POST /sources/:id/test`
- `POST /sources/:id/discover-tools`
- `GET /sources`

### Tools
- `GET /tools`
- `PATCH /tools/:id` (active true/false)
- `POST /tools/batch-update`

### Policies
- `GET /policies`
- `POST /policies`
- `POST /policies/:id/publish`
- `POST /policies/:id/rollback`

### Deployments
- `POST /deployments/unified-endpoint`
- `GET /deployments/unified-endpoint`
- `POST /deployments/credentials`
- `POST /deployments/credentials/:id/revoke`

### Audit
- `GET /audit/events`
- `GET /audit/export`

## Data model essentials

- `users`
- `workspaces`
- `workspace_members`
- `sources`
- `source_credentials`
- `tools`
- `policies`
- `policy_rules`
- `runtime_credentials`
- `audit_events`

## Security requirements in API

- Role checks at controller and service layer.
- Workspace ownership checks for all mutable resources.
- Input validation and strict schema parsing.
- Rate limit on auth and credential endpoints.
