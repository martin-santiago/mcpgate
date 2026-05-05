# Repository Guidelines

## Contexto
MCPGate CLI es el entrypoint principal del producto CLI-first. Este repo existe para inicializar, diagnosticar y levantar MCPGate en modo local o self-hosted. Es un proyecto personal de Martin y no debe usar credenciales, infraestructura ni cuentas de Carvuk.

## Commands
- `pnpm install`: instala dependencias del CLI.
- `pnpm build`: compila TypeScript a `dist/`.
- `pnpm start --help`: ejecuta el CLI compilado.
- `pnpm start init`: inicializa el home local de MCPGate.
- `pnpm start doctor`: corre diagnosticos locales.
- `pnpm start start`: intenta levantar los servicios locales asociados.
- `pnpm start source list`: lista sources del workspace local.
- `pnpm start source add <name> --type custom --url <url>`: crea un source local.
- `pnpm start source test <source-id>`: prueba una conexion existente.
- `pnpm start source discover <source-id>`: descubre tools para un source.
- `pnpm start tools list`: lista tools descubiertas en el workspace local.

## Package manager
- Usar `pnpm` para este repo.

## Estructura del proyecto
- `src/commands/`: comandos CLI (`init`, `doctor`, `start`).
- `src/services/`: orquestacion, config y diagnosticos.
- `src/types/`: contratos del CLI.
- `src/utils/`: paths, puertos y helpers de entorno.

## Convenciones de codigo
- Usar `type` sobre `interface`.
- Mantener el CLI como capa delgada; la logica debe vivir en `services/`.
- Mantener nombres explicitos y orientados al dominio.
- No agregar comentarios salvo que una decision no obvia realmente lo necesite.
- Preferir funciones chicas y composables.

## Reglas de producto
- El CLI es la entrada principal del producto.
- Ninguna feature critica debe quedar solo en la UI web si puede tener camino CLI.
- El flujo feliz local debe asumir SQLite por defecto y cero dependencia obligatoria en servicios externos aparte de Node.
- `mcpgate-web` es companion UI; `mcpgate-api` es control plane local inicial.

## Verificacion
- Ante cambios relevantes, correr `pnpm build`.
- Si cambias comandos, probar al menos `pnpm start -- --help` y el comando afectado.

## Git y commits
- Branches: `<developer>/<type>/<feature>` en kebab-case.
- Commits: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`.
- No commitear secretos, paths personales hardcodeados fuera del contexto necesario del producto local, ni artefactos temporales.
