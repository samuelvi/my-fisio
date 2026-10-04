# PCMS

Physiotherapy Clinic Management System: patients, clinical records, appointment calendar and available slots, billing customers, invoices/PDF exports, and audit history. Patients and billing customers are distinct domain entities.

- Backend: PHP 8.4, Symfony 7.4, API Platform 4, Doctrine ORM 3, MariaDB 11, JWT authentication.
- Frontend: React 18, TypeScript, Vite 6, Tailwind 3, TanStack Query, FullCalendar. Entry: `assets/app.tsx`.
- Dependencies: `composer.json`/`composer.lock`, `package.json`/`pnpm-lock.yaml`; pnpm 11.1.1 requires Node 22+.
- Development: Docker PHP-FPM, Nginx, MariaDB, Redis, MailPit, Adminer, Node watch.
- Tests: PHPUnit, Vitest, Playwright and Gherkin via playwright-bdd.

SQL entity state is the source of truth. Domain events are persisted for audit; the application does not rebuild its state from an event stream.
