# Phase 1.5 - Reliability and Security

## Reliability improvements

- Source retry policies by source type.
- Configurable circuit breaker thresholds.
- Graceful degradation in unified endpoint when one source is down.

## Security improvements

- Optional 2FA for dashboard users.
- Session anomaly detection basics (IP/user-agent mismatch warnings).
- Source credential re-validation and stale secret warnings.

## Auth hardening

- Optional OIDC provider for self-hosted.
- Audit alert on repeated failed logins.
- API key last-used metadata and suspicious usage alerts.
