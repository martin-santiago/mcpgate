# MCPGate

Lightweight MCP gateway — aggregate, filter, and observe your MCP tools.

MCPGate sits between your MCP client (Claude Desktop, Cursor, VS Code) and multiple MCP servers. It presents a **single unified MCP endpoint** while giving you granular control over which tools are exposed.

## Features

- **Tool Aggregation** — Connect multiple MCP servers, expose all tools through one endpoint
- **Tool Filtering** — Allow/block specific tools per server via simple YAML config
- **Tool Prefixing** — Automatic namespacing to avoid tool name collisions
- **Structured Logging** — JSON logs for every tool call with timing and errors
- **Dual Transport** — Works as stdio (Claude Desktop) or HTTP (remote clients)
- **Self-Hosted** — Deploy on Railway, Docker, or run locally with `npx`

## Quick Start

### Local (stdio — for Claude Desktop)

```bash
npx mcpgate start --config mcpgate.yaml
```

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcpgate": {
      "command": "npx",
      "args": ["-y", "mcpgate", "start", "--config", "/path/to/mcpgate.yaml"]
    }
  }
}
```

### Docker

```bash
docker run -p 3000:3000 \
  -e MCPGATE_CONFIG=$(cat mcpgate.yaml | base64 -w 0) \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  ghcr.io/mprezz/mcpgate
```

### Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/mcpgate)

## Configuration

Create a `mcpgate.yaml`:

```yaml
gateway:
  name: "my-gateway"
  transport: "stdio"     # stdio | http | both
  port: 3000
  toolPrefix: true       # prefix tools with server name

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

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP port (Railway sets this automatically) |
| `MCPGATE_CONFIG` | No | — | Base64-encoded YAML config (for Railway/Docker) |
| `DATABASE_URL` | No | — | PostgreSQL connection string (enables audit trail) |
| `LOG_LEVEL` | No | `info` | `debug` / `info` / `warn` / `error` |

## License

Apache 2.0 — see [LICENSE](./LICENSE)
