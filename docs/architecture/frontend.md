# Frontend Architecture

Modern React SPA (Single Page Application) built with TypeScript, Vite, and Tailwind CSS.

## Core Concepts

### 1. Routing & Navigation
- **Library**: `react-router-dom` v6.
- **Entry Point**: `assets/app.tsx`.
- **Strategy**:
    - **Internal Navigation**: Uses `<Navigate />` and `useNavigate()` to maintain SPA state without full reloads.
    - **Protection**: `ProtectedRoute` wrapper component checks for JWT token presence.
    - **Login Integration**: The `/login` route is part of the main Router, preventing context loss during redirection.

### 2. State Management
- **Local State**: `useState` for component-specific data (forms, UI toggles).
- **Server State**: Direct API calls via `axios` (Standard REST).
- **Draft State**: Custom `useFormDraft` hook persists form data to `localStorage` to prevent data loss.

### 3. Authentication Flow
1. User enters credentials in `/login`.
2. App requests token from `/api/login_check`.
3. Token stored in `localStorage`.
4. `axios` interceptor attaches `Authorization: Bearer <token>` to all subsequent requests.
5. If API returns `401 Unauthorized`, interceptor redirects to `/login?expired=1`.

### 4. Internationalization (i18n)
- **Pattern**: Server-Side Injection.
- **Mechanism**: Symfony renders the initial HTML with a global `window.APP_TRANSLATIONS` object derived from `messages.es.yaml`.
- **Context**: `LanguageContext` provider exposes a `t()` helper to components.
- **Benefit**: Zero-latency translations and no "flicker" on load.

## Directory Structure

```
assets/
├── app.tsx                 # Router & Main Component
├── login.tsx               # Login Entry Point
├── components/             # React Components
│   ├── shared/             # Reusable UI (Alerts, Loaders)
│   ├── invoices/           # Domain-specific components
│   ├── customers/          # Domain-specific components
│   ├── Calendar.tsx        # FullCalendar wrapper
│   └── ...
├── domain/                 # Business logic interfaces
├── infrastructure/         # API services (optional)
└── types/                  # TypeScript definitions
```

## Key Components

### `App.tsx`
Handles the global routing table. Ensure all new pages are registered here inside the `<Routes>` block.

### `FormDraftUI`
A visual component that alerts users when they have unsaved data recovered from a crash or network error. Used in `PatientForm`, `InvoiceForm`, etc.

### `RecordTimeline`
A complex composite component that renders the clinical history of a patient, demonstrating the "Master-Detail" pattern within a single view.
