# Phase 1 - Self-Hosted Infrastructure Specification

## Deployment target

Single-tenant deployment in customer infra.

## Components

- `mcpgate-web`
- `mcpgate-api`
- `mcpgate-runtime`
- `postgres`
- `redis`

## Delivery artifacts

- Docker Compose for quick start.
- Helm chart for Kubernetes environments.
- `.env.example` and secure config guide.

## Minimal infra requirements

- 2 vCPU / 4GB RAM for pilot deployments.
- TLS termination via ingress or reverse proxy.
- Persistent volumes for Postgres.

## Security controls

- HTTPS required in production mode.
- Secret values via environment or secret manager.
- No default credentials in production templates.
- Optional IP allowlist for runtime endpoint.

## Observability baseline

- Structured logs for all services.
- Basic metrics: request count, latency, deny rate, source failures.
- Health endpoints for API and runtime.
