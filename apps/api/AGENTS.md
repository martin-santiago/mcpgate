# Repository Guidelines

## Contexto
MCPGate API es un proyecto personal de Martin. No usar credenciales, infraestructura ni cuentas de Carvuk. Este repo implementa el backend principal en NestJS con Supabase Auth y Postgres.

## Commands
- `yarn start:dev`: levanta la API con hot reload.
- `yarn build`: compila TypeScript a `dist/`.
- `yarn lint`: ejecuta ESLint con autofix.
- `yarn format`: aplica Prettier sobre `src/**/*.ts` y `test/**/*.ts`.
- `yarn test`, `yarn test:e2e`: tests unitarios y e2e.

## Estructura del proyecto
- `src/main.ts`, `src/app.module.ts`: bootstrap y wiring principal.
- `src/auth/`: autenticacion con Supabase, guards y strategy.
- `src/workspaces/`, `src/sources/`, `src/tools/`: modulos de dominio.
- `src/common/`: piezas compartidas cuando empiecen a repetirse entre dominios.
- `test/`: pruebas e2e.

Cada dominio nuevo debe crecer con estructura consistente: `entities/`, `dtos/`, `services/`, `controllers/`, y `repositories/` si la complejidad lo justifica. Evitar mezclar reglas de negocio entre dominios.

## Convenciones de codigo
- Usar `type` sobre `interface` para DTOs y tipos simples.
- Usar `PascalCase` para clases y enums, `camelCase` para funciones/variables, `kebab-case` para archivos.
- No usar JSDoc ni comentarios innecesarios; el codigo debe explicarse solo.
- Mantener imports ordenados: NestJS, librerias externas, imports internos, imports relativos.
- Mantener funciones pequenas y orientadas a una sola responsabilidad.
- Preferir nombres explicitos; evitar nombres vagos como `data`, `item`, `serviceData`.

## Patrones backend
- Los modulos de dominio deben exponer controllers delgados y mover la logica de negocio a services.
- Si aparece acceso a datos mas complejo, introducir repositories dedicados en vez de inflar services.
- Mantener constants y utils separados; no mezclar datos estaticos con funciones en el mismo archivo.
- Si el proyecto crece, mover piezas compartidas a `src/common/` antes de duplicarlas.
- Para relaciones TypeORM, ser explicito con nombres de columnas y decoradores.

## Auth y Supabase
- La API usa `app.setGlobalPrefix('api')`; todos los endpoints publicos salen bajo `/api`.
- Los JWT de Supabase en este proyecto usan `ES256`; no validar localmente con `passport-jwt` + shared secret.
- La validacion actual correcta vive en `src/auth/supabase.strategy.ts` usando `supabaseAdmin.auth.getUser(token)`.
- No reintroducir validacion local del JWT salvo que exista JWKS estable y este probado.

## Base de datos y entorno
- `ConfigModule` lee `.env.staging` en desarrollo actual.
- `synchronize: true` esta permitido solo para desarrollo inicial; si el proyecto madura, migrar a migrations explicitas.
- Nunca commitear secretos reales. Mantener `.env.staging` fuera de git y actualizar solo `.env.example`.
- Recordar que passwords con caracteres especiales en `DATABASE_URL` deben ir URL-encoded.

## Testing
- Cada cambio de comportamiento en services o auth debe venir con test cuando sea razonable.
- Para cambios pequenos, al menos correr `yarn build` o `yarn test` segun impacto.
- Para flujos auth/API, preferir smoke tests reales contra endpoints antes que asumir que Nest compila.

## Git y commits
- Branches: `<developer>/<type>/<feature>` en kebab-case.
- Commits: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...` con mensajes cortos y claros.
- Evitar commits de debugging, `console.log`, comentarios temporales o cambios de formateo sin motivo.
- Antes de abrir PR, dejar la rama limpia y facil de revisar.
