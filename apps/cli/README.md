# MCPGate CLI

CLI-first entrypoint for MCPGate.

## Local development

```bash
pnpm install
pnpm build
pnpm start --help
pnpm start init
pnpm start doctor
```

The initial slice focuses on local bootstrap:

- `mcpgate init`
- `mcpgate doctor`
- `mcpgate start`

Next slice:

- `mcpgate source list`
- `mcpgate source add <name> --type custom --url <url>`
- `mcpgate source test <source-id>`
- `mcpgate source discover <source-id>`
- `mcpgate tools list`
