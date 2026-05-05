# Monorepo migration

## Summary
MCPGate was migrated to a pnpm workspace monorepo with three apps under `apps/`.

## Apps
- `apps/api`: copied from `mcpgate-api` without `.git`, `node_modules`, `dist`, or lockfiles.
- `apps/web`: copied from `mcpgate-web` without `.git`, `node_modules`, `.next`, or lockfiles.
- `apps/cli`: copied from `mcpgate-cli` without `node_modules`, `dist`, or lockfiles.

## Preservation
The legacy folders remain at the repository root as backups and are ignored by the root git repository:
- `mcpgate-api`
- `mcpgate-web`
- `mcpgate-cli`

`mcpgate-api` had uncommitted changes before the migration, so subtree migration was intentionally skipped to avoid losing local state. Those working-tree files were copied into `apps/api`.

## Verification
- `pnpm install`: succeeded and generated the root `pnpm-lock.yaml`.
- `pnpm --filter mcpgate-api run build`: succeeded.
- `pnpm --filter mcpgate-cli run build`: succeeded.
- `pnpm --filter mcpgate-web run build`: succeeded with a Next.js middleware deprecation warning.
- `pnpm --filter mcpgate-api exec eslint "{src,apps,libs,test}/**/*.ts"`: failed on pre-existing lint issues in copied API source.
- `pnpm --filter mcpgate-web run lint`: succeeded with two warnings.
