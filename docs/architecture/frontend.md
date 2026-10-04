# Frontend architecture

React 18 SPA with TypeScript, Vite, Tailwind CSS and React Router 7.

## Entry points and layers

| Path | Purpose |
| --- | --- |
| `assets/app.tsx` | Main router, protected screens and providers |
| `assets/login.tsx` | Standalone login entry |
| `assets/components/` | Existing screens and shared components |
| `assets/application/`, `assets/domain/` | Frontend use cases and contracts |
| `assets/infrastructure/` | Adapters and persistence integrations |
| `assets/presentation/` | Bootstrap, API client, session store and query client |
| `assets/routing/` | FOSJsRouting integration |
| `assets/tests/` | Frontend tests |

Follow the structure of the feature being changed. Some screens use older direct
API calls while others use the supporting layers and TanStack Query.

## Session and data

- `/api/login_check` returns a JWT. `presentation/auth/sessionStore.ts` stores it
  in `localStorage`; the HTTP client sends it in the Authorization header.
- `presentation/bootstrap/frontendBootstrap.ts` restores the token, applies
  theme variables and installs the unauthorized-response handler.
- `presentation/query/queryClient.ts` defines shared TanStack Query defaults.
- Draft recovery is described in the [draft guide](../features/draft-system.md).

## Translations and routes

`templates/default/index.html.twig` injects `window.APP_TRANSLATIONS`, populated
by `TranslationExtension` from Symfony catalogs. `LanguageContext` exposes the
translation helper and persists language selection locally.

Export exposed backend routes with `make dump-routes` after changing them.
`make build-assets` does this before Vite builds. See [configuration](../operations/configuration.md)
for environment settings and [testing](../testing/e2e.md) for validation.
