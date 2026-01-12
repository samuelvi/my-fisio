---
name: fosjs-routing
description: FOSJsRoutingBundle integration to expose Symfony routes to React without hardcoding URLs.
---

# FOSJsRouting Integration

## Overview
Expose Symfony routes to JavaScript/React for type-safe URL generation.

## Installation
```bash
composer require friendsofsymfony/jsrouting-bundle
npm install fos-router
```

## Backend Configuration

### 1. Expose Routes
```php
#[Route('/api/invoices/{id}/export', name: 'invoice_export', methods: ['GET'])]
#[Route('/api/patients/{id}', name: 'patient_get', options: ['expose' => true])]
public function get(int $id): JsonResponse { }
```

### 2. Configure Routes
```yaml
# config/packages/fos_js_routing.yaml
fos_js_routing:
    routes_to_expose:
        - invoice_export
        - patient_.*
```

### 3. Generate Routes JSON
```bash
make dump-routes
# or
php bin/console fos:js-routing:dump --format=json --target=assets/routing/routes.json
```

## Frontend Usage

### Initialize Router
```typescript
// assets/routing/init.ts
import Routing from 'fos-router';
import routes from './routes.json';

Routing.setRoutingData(routes);

export default Routing;
```

### Use in Components
```tsx
import Routing from '@/routing/init';

function InvoiceExport({ invoiceId }: Props) {
    const exportUrl = Routing.generate('invoice_export', {
        id: invoiceId,
        format: 'pdf'
    });
    
    return <a href={exportUrl}>Download PDF</a>;
}
```

## Benefits
- ✅ No hardcoded URLs
- ✅ Type-safe route generation
- ✅ Refactor routes without breaking frontend
- ✅ Security: Only expose needed routes

## References
- [FOSJsRoutingBundle](https://github.com/FriendsOfSymfony/FOSJsRoutingBundle)
