---
name: jwt-authentication
description: JWT authentication setup with LexikJWTAuthenticationBundle for stateless API auth.
---

# JWT Authentication with LexikJWT

## Installation
```bash
composer require lexik/jwt-authentication-bundle
```

## Configuration

### Generate Keys
```bash
php bin/console lexik:jwt:generate-keypair
```

### security.yaml
```yaml
security:
    firewalls:
        login:
            pattern: ^/api/login
            stateless: true
            json_login:
                check_path: /api/login
                success_handler: lexik_jwt_authentication.handler.authentication_success
                failure_handler: lexik_jwt_authentication.handler.authentication_failure

        api:
            pattern: ^/api
            stateless: true
            jwt: ~

    access_control:
        - { path: ^/api/login, roles: PUBLIC_ACCESS }
        - { path: ^/api, roles: IS_AUTHENTICATED_FULLY }
```

## Frontend Usage
```typescript
// Login
const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' }
});
const { token } = await response.json();
localStorage.setItem('token', token);

// Authenticated requests
fetch('/api/patients', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

## References
- [LexikJWTAuthenticationBundle](https://github.com/lexik/LexikJWTAuthenticationBundle)
