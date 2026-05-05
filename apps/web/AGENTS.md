# Repository Guidelines

## Contexto
MCPGate Web es un proyecto personal de Martin. No usar credenciales, infraestructura ni cuentas de Carvuk. Este repo implementa la interfaz de control de MCPGate en Next.js App Router.

## Commands
- `npm run dev`: levanta la app en desarrollo.
- `npm run build`: compila la aplicacion y sirve como chequeo fuerte de tipos/rutas.
- `npm run lint`: ejecuta ESLint.

Usar `npm` en este repo para mantener consistencia con el lockfile actual.

## Estructura del proyecto
- `app/`: rutas y layouts con App Router.
- `components/dashboard/`: componentes de dominio del dashboard.
- `components/ui/`: primitives compartidas y componentes de shadcn/ui.
- `lib/api/`: cliente HTTP y tipos del backend.
- `lib/supabase/`: clientes browser/server para auth.
- `middleware.ts`: proteccion de rutas autenticadas.

Cuando una feature crezca, mantener separacion por dominio: UI en `components/<feature>/`, logica de integracion en `lib/<feature>/` o `lib/api/`, y evitar mezclar reglas de negocio directamente en las paginas.

## Convenciones de codigo
- Usar `type` sobre `interface`.
- Event handlers empiezan con `handle`.
- Preferir componentes pequenos, composicion simple y nombres explicitos.
- No agregar comentarios salvo que una decision no obvia realmente lo necesite.
- Mantener imports ordenados y consistentes.
- Archivos en `kebab-case`; componentes y tipos en `PascalCase`; funciones/variables en `camelCase`.

## Patrones frontend
- Preferir Server Components por defecto; usar Client Components solo cuando haya estado, eventos o hooks del browser.
- El fetching autenticado del backend debe pasar por `lib/api/client.ts`.
- Para estado async en cliente, usar React Query; no inventar stores globales si no hacen falta.
- Reutilizar `components/ui/` antes de crear nuevos primitives.
- Mantener layouts y pantallas alineadas con el lenguaje actual del producto: dashboard sobrio, utilitario y enfocado en operaciones.
- Usar Tailwind para styling; evitar CSS suelto e inline styles.

## Auth y navegacion
- Las rutas autenticadas viven bajo `app/dashboard/`.
- La sesion del usuario se resuelve con Supabase SSR helpers en server y con el cliente browser en client components.
- El backend expone endpoints bajo `/api`; `NEXT_PUBLIC_API_URL` debe incluir ese prefijo.
- Si se toca proteccion de rutas, considerar que Next 16 depreca `middleware.ts` en favor de `proxy.ts`; no migrar parcialmente.

## UI y naming
- Evitar nombres genericos como `List`, `Card`, `Modal` si el componente es de dominio; preferir `WorkspaceList`, `ToolsCatalog`, etc.
- Antes de agregar un componente nuevo, revisar si puede resolverse con `components/ui/` + composicion.
- Mantener textos de UI claros y breves; producto/ops primero, marketing despues.

## Testing y verificacion
- Aunque el repo todavia no tenga test suite, verificar cambios importantes con `npm run build`.
- Para flujos de auth o integracion, probar al menos login, carga de dashboard y llamadas al API afectadas.
- Si un cambio depende del backend, validar tambien que `NEXT_PUBLIC_API_URL` y Supabase sigan funcionando end-to-end.

## Git y commits
- Branches: `<developer>/<type>/<feature>` en kebab-case.
- Commits: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`.
- No commitear secretos reales ni `.env.local` con credenciales sensibles.
- Evitar commits de debug, logs temporales o refactors cosmeticos mezclados con cambios funcionales.
