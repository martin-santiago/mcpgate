# Repository Guidelines

## Contexto
MCPGate es un monorepo con pnpm workspaces. La prioridad es mantener una estructura local funcional y con mínima fricción.

## Package manager
- Usar `pnpm` desde la raíz del monorepo.
- No usar `npm`, `yarn` ni lockfiles nuevos por app.

## Apps
- `apps/api`: API NestJS, migrada desde `mcpgate-api`.
- `apps/cli`: CLI Oclif, migrado desde `mcpgate-cli`.
- `apps/web`: Web Next.js, migrada desde `mcpgate-web`.

## Reglas de trabajo
- Mantener y respetar los `AGENTS.md` locales dentro de cada app.
- No crear `packages/` compartidos hasta que exista una necesidad real.
- Cambios cross-app deben ser explícitos y mínimos.
- Ejecutar comandos filtrados con `pnpm --filter <package-name> ...` cuando se trabaje en una app específica.
