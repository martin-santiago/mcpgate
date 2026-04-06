# MCPGate

Lightweight MCP gateway — aggregate, filter, and observe your MCP tools.

MCPGate sits between your MCP client (Claude Desktop, Claude Code, Cursor, VS Code) and multiple MCP servers. It presents a **single unified MCP endpoint** while giving you granular control over which tools are exposed.

## Features

- **Tool Aggregation** — Connect multiple MCP servers, expose all tools through one endpoint
- **Tool Filtering** — Allow/block specific tools per server via simple YAML config
- **Tool Prefixing** — Automatic namespacing (`github.create_issue`) to avoid collisions
- **Web Dashboard** — Real-time status page showing servers, tools, and request logs
- **Dual Transport** — Stdio (Claude Desktop) or HTTP/SSE (remote clients)
- **Audit Trail** — Every tool call logged with timing; optional PostgreSQL persistence
- **Self-Hosted** — Deploy on Railway, Docker, or run locally

## Quick Start

### Local (stdio — for Claude Desktop)

```bash
npx mcp-gate start --config mcpgate.yaml
```

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcpgate": {
      "command": "npx",
      "args": ["-y", "mcp-gate", "start", "--config", "/path/to/mcpgate.yaml"]
    }
  }
}
```

### Local (HTTP — with dashboard)

```bash
npx mcp-gate start --config mcpgate.yaml
# Dashboard at http://localhost:3000
# MCP endpoint at http://localhost:3000/mcp
```

### Docker

```bash
docker compose up
# Dashboard at http://localhost:3000
# Includes PostgreSQL for persistent audit trail
```

Or standalone:

```bash
docker run -p 3000:3000 \
  -e MCPGATE_CONFIG=$(cat mcpgate.yaml | base64 -w 0) \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  ghcr.io/mprezz/mcpgate
```

### Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/mcpgate)

Add a PostgreSQL plugin for persistent audit trail — MCPGate detects `DATABASE_URL` automatically.

## Configuration

Create a `mcpgate.yaml`:

```yaml
gateway:
  name: "my-gateway"
  transport: "stdio" # stdio | http | both
  port: 3000
  toolPrefix: true # prefix tools with server name

servers:
  - name: "github"
    transport: "stdio"
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
    tools:
      allow:
        - "create_issue"
        - "search_repos"

  - name: "filesystem"
    transport: "stdio"
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user"]
    tools:
      block:
        - "write_file"
        - "delete_file"

logging:
  level: "info"
```

See [mcpgate.example.yaml](./mcpgate.example.yaml) for the full reference.

### Tool Filtering

Each server supports `allow` or `block` (mutually exclusive):

- **`allow`** — Only these tools are exposed (whitelist)
- **`block`** — All tools EXCEPT these are exposed (blacklist)
- **Neither** — All tools are exposed

### Authentication

Add a bearer token to protect the HTTP transport:

```yaml
gateway:
  auth:
    token: "${MCPGATE_AUTH_TOKEN}"
```

When auth is configured:

- All endpoints require `Authorization: Bearer <token>` header
- `/health` remains public (for Railway/Docker health checks)
- MCP clients pass the token via custom headers in their transport config

Without auth configured, all endpoints are open (for local/private use).

### Environment Variable Interpolation

Use `${VAR}` or `${VAR:-default}` in YAML to reference environment variables:

```yaml
env:
  GITHUB_TOKEN: "${GITHUB_TOKEN}"
  API_URL: "${API_URL:-https://api.example.com}"
```

## Dashboard

When running in HTTP mode, MCPGate serves a web dashboard at the root URL:

- **`/`** — Status page with upstream servers, tools, and request logs
- **`/api/status`** — JSON API for programmatic access
- **`/health`** — Health check endpoint (for Railway/Docker)
- **`/mcp`** — MCP protocol endpoint (Streamable HTTP)

## Storage

MCPGate logs every tool call with timing and error information.

- **Default** — In-memory (no setup required, lost on restart)
- **PostgreSQL** — Set `DATABASE_URL` environment variable (tables created automatically)

```bash
# Local development with Docker Compose
docker compose up postgres -d
export DATABASE_URL=postgresql://mcpgate:mcpgate@localhost:5432/mcpgate
npx mcp-gate start --config mcpgate.yaml
```

## Environment Variables

| Variable             | Required | Default | Description                                                                |
| -------------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `PORT`               | No       | `3000`  | HTTP port (Railway sets this automatically)                                |
| `MCPGATE_CONFIG`     | No       | —       | Base64-encoded YAML config (for Railway/Docker)                            |
| `DATABASE_URL`       | No       | —       | PostgreSQL connection string (enables persistent audit trail)              |
| `LOG_LEVEL`          | No       | `info`  | `debug` / `info` / `warn` / `error`                                        |
| `MCPGATE_AUTH_TOKEN` | No       | —       | Bearer token for HTTP auth (reference in YAML via `${MCPGATE_AUTH_TOKEN}`) |

## Development

```bash
git clone https://github.com/mprezz/mcpgate.git
cd mcpgate
npm install

npm run dev          # development with hot reload
npm run build        # compile TypeScript
npm run test         # run tests (vitest)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

## Architecture

```
Client (Claude, Cursor)
    │
    ▼ stdio or HTTP/SSE
┌──────────────────────────────┐
│         MCPGate              │
│                              │
│  ┌─────────────────────┐     │
│  │   Tool Registry     │     │  ← filters + namespaces tools
│  └─────────────────────┘     │
│  ┌─────────────────────┐     │
│  │   Tool Router       │     │  ← routes calls to correct server
│  └─────────────────────┘     │
│  ┌─────────────────────┐     │
│  │  Upstream Manager   │     │  ← manages server connections
│  └─────────────────────┘     │
│  ┌─────────────────────┐     │
│  │   Storage           │     │  ← memory or PostgreSQL
│  └─────────────────────┘     │
└──────────────────────────────┘
    │           │           │
    ▼           ▼           ▼
 Server A    Server B    Server C
 (GitHub)  (Filesystem)  (Custom)
```

## License

Apache 2.0 — see [LICENSE](./LICENSE)
