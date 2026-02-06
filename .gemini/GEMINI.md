# Contexto del Proyecto: TinaRemake (New3)

## Mandato Principal: Adherencia a Skills
Este proyecto cuenta con documentación técnica estricta en el directorio `.skills/`.
**Instrucción Permanente:** Antes de realizar cualquier análisis, refactorización o generación de código, DEBO consultar los archivos en `.skills/` (especialmente `clean-code`) y aplicar sus patrones sin excepción.

## Estándares de Código (Resumen de .skills/clean-code)
- **PHP:** Strict types, English only, Inyección de dependencias por constructor, Early returns.
- **TypeScript:** Stepdown rule (imports -> types -> public -> private), Funciones pequeñas, Single Responsibility.
- **Arquitectura:** DDD (Domain-Driven Design), Separación estricta (Domain / Application / Infrastructure).

## Stack Tecnológico
- **Backend:** Symfony, API Platform, Doctrine.
- **Frontend:** React, TypeScript, Vite, Tailwind.
- **Testing:** PHPUnit (Unit/Integration), Playwright (E2E).
- **Calidad:** PHPStan, PHP-CS-Fixer, Rector.

## Notas de Memoria
- El usuario valora la arquitectura limpia y el desacoplamiento.
- No asumir configuraciones; verificar siempre `composer.json` o `package.json`.
