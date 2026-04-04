# MCPGate — Project Standards

## What is this

MCPGate is a lightweight MCP (Model Context Protocol) gateway that aggregates
multiple MCP servers into a single endpoint with tool filtering and observability.

## Tech Stack

- TypeScript (strict mode), Node.js 22+, ESM modules
- MCP SDK v1.x (@modelcontextprotocol/sdk)
- Hono (HTTP framework)
- pino (structured JSON logging)
- Zod (config validation + type inference)
- yaml (YAML parsing)
- pg (PostgreSQL client, raw SQL, no ORM)
- commander (CLI)
- Vitest (testing)

## Architecture

Single-package structure. NOT a monorepo.

```
src/
├── config/      — YAML config loading + Zod validation
├── gateway/     — Core gateway logic (tool registry, routing, upstream management)
├── transport/   — Stdio and HTTP transport adapters
├── storage/     — Storage interface + implementations (memory, PostgreSQL)
├── dashboard/   — Web UI routes and HTML templates
├── logging/     — Logger setup
└── utils/       — Error types, shared utilities
```

## Coding Conventions

- Use `type` over `interface` everywhere
- Files and directories in kebab-case
- No JSDoc comments — code should be self-explanatory
- Declarative naming: variables describe WHAT they are, not HOW they're used
  - `const registeredTools = getTools()` not `const data = getTools()`
  - `for (const server of servers)` not `for (const s of servers)`
  - `function routeToolCall(toolCall)` not `function processItem(item)`
- Error handling: throw typed McpGateError subclasses, catch at transport boundaries
- No barrel files (index.ts re-exports) — import from specific files directly
- Imports: relative paths within same module, full paths across modules

## Database

- Default: no database, in-memory storage
- When DATABASE_URL env var is set: PostgreSQL with auto-migration (CREATE TABLE IF NOT EXISTS)
- Raw SQL via pg client. No ORM. No migration framework. 2 tables total.

## Config

- Local: mcpgate.yaml file
- Railway/Cloud: MCPGATE_CONFIG env var (base64-encoded YAML)
- Resolution order: --config flag > MCPGATE_CONFIG env > mcpgate.yaml in cwd > error

## Commands

- `npm run dev` — development with tsx hot reload
- `npm run build` — tsc compilation to dist/
- `npm run start` — run built output
- `npm run test` — vitest run
- `npm run lint` — eslint check
- `npm run typecheck` — tsc --noEmit

## Testing

- Vitest for unit and integration tests
- Test files in tests/ directory, mirroring src/ structure
- Name test files *.test.ts
- Mock MCP Client/Server for unit tests

## Logging

- pino to stderr (stdout is reserved for stdio MCP protocol)
- JSON format in production, pretty-print in development
- Never console.log — always use the logger instance
