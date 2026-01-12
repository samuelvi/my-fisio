---
name: validation-mapping
description: React-Symfony validation error mapping for consistent field-level error display.
---

# Validation Mapping (React-Symfony)

## Overview
Synchronize validation errors between Symfony backend and React frontend for consistent UX.

## Backend (Symfony)
```php
// Validator constraints
#[Assert\NotBlank]
#[Assert\Length(min: 3, max: 100)]
private string $fullName;

// Return structured errors
try {
    $violations = $validator->validate($patient);
    if (count($violations) > 0) {
        $errors = [];
        foreach ($violations as $violation) {
            $errors[$violation->getPropertyPath()] = $violation->getMessage();
        }
        return new JsonResponse(['errors' => $errors], 422);
    }
} catch (ValidationException $e) {
    // ...
}
```

## Frontend (React)
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async (data) => {
    try {
        await api.post('/api/patients', data);
    } catch (error) {
        if (error.response?.status === 422) {
            setErrors(error.response.data.errors);
        }
    }
};

// Display errors next to fields
<input name="fullName" />
{errors.fullName && <span className="error">{errors.fullName}</span>}
```

## Best Practices
- Validate early on frontend (UX)
- Always re-validate on backend (security)
- Map property paths to input names
- Show errors next to fields, not globally

## References
- [Symfony Validation](https://symfony.com/doc/current/validation.html)
