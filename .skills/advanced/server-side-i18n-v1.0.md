---
type: skill
category: advanced
version: 1.0.0
status: production
compatibility:
  llms: [claude, gemini, openai]
  frameworks: [symfony, react]
tags: [i18n, localization, translations]
created: 2026-01-09
updated: 2026-01-09
author: MyPhysio Team
license: MIT
description: Server-side translation injection pattern to avoid async loading issues.
---

# Server-Side i18n Injection

## Problem
Async translation loading causes:
- Flash of untranslated content
- 401 errors on login page (no auth token yet)
- Extra HTTP requests

## Solution: Synchronous Injection
Inject translations from Symfony into React during HTML render.

## Implementation

### Backend (Symfony Controller)
```php
public function index(): Response
{
    $locale = $request->getLocale();
    $translations = $this->loadTranslations($locale);
    
    return $this->render('base.html.twig', [
        'translations' => json_encode($translations),
        'locale' => $locale,
    ]);
}
```

### Frontend (HTML Template)
```html
<script>
    window.APP_TRANSLATIONS = {{ translations|raw }};
    window.APP_LOCALE = "{{ locale }}";
</script>
```

### React (Usage)
```tsx
// LanguageContext.tsx
const translations = window.APP_TRANSLATIONS;

export function t(key: string): string {
    return translations[key] ?? key;
}

// Component
function Welcome() {
    return <h1>{t('welcome.message')}</h1>;
}
```

## Benefits
- ✅ Zero async calls
- ✅ Instant translation availability
- ✅ Works on login page
- ✅ No FOUC (Flash of Untranslated Content)

## References
- [Symfony Translation](https://symfony.com/doc/current/translation.html)
