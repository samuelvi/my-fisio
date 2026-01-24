# Skills Library

This directory contains reusable skills that extend Claude's capabilities through specialized knowledge, workflows, and tool integrations.

## Structure

Skills follow the [official Anthropic skills specification](https://github.com/anthropics/skills). Each skill is a self-contained directory with:

```
.skills/
├── skill-name/
│   ├── SKILL.md          # Required: frontmatter + instructions
│   ├── references/       # Optional: documentation loaded as needed
│   ├── scripts/          # Optional: executable code
│   └── assets/           # Optional: templates and output files
```

## Available Skills

### Architecture Patterns
- **cqrs-pattern** - Command Query Responsibility Segregation for Symfony
- **repository-pattern** - Data access abstraction with QueryBuilder
- **event-sourcing** - Domain event capture and replay patterns

### Advanced Patterns
- **n-plus-one-pagination** - High-performance pagination without COUNT queries
- **validation-mapping** - React-Symfony error synchronization
- **server-side-i18n** - Translation catalog injection patterns

### Integration Patterns
- **fosjs-routing** - Expose Symfony routes to JavaScript
- **jwt-authentication** - Token-based auth with LexikJWT
- **doctrine-performance** - Query optimization and caching strategies

### Domain Patterns
- **audit-trail-pattern** - Compliance-focused change tracking
- **draft-recovery-pattern** - Network error resilience for forms

### Code Quality
- **clean-code** - Clean Code principles (Robert C. Martin) for TypeScript/JavaScript
- **dangerous-defaults** - Avoid dangerous default values in method parameters (user IDs, etc.)
- **playwright-bdd-testing** - E2E testing with Playwright-BDD and best practices

### Security
- **secrets-management** - Secure handling of credentials and secrets (never commit real credentials)
- **security-model** - Application security model (single-tenant, authorization decisions)

### Utilities
- **skill-creator** - Official guide for creating effective skills

## Skill Format

Every skill includes a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: skill-name
description: Clear description of what the skill does and when to use it
---
```

The frontmatter fields (`name` and `description`) determine when Claude uses the skill. The description should be comprehensive and clear about the skill's purpose and use cases.

## Creating New Skills

Use the skill-creator skill to create new skills following best practices:

1. Read the skill-creator guide: `.skills/skill-creator/SKILL.md`
2. Use the initialization script: `.skills/skill-creator/scripts/init_skill.py`
3. Edit the generated SKILL.md and add resources as needed
4. Package the skill: `.skills/skill-creator/scripts/package_skill.py`

## Core Principles

**Concise Context**: Only include information Claude doesn't already have. Challenge each piece of information's token cost.

**Appropriate Freedom**: Match specificity to task fragility:
- High freedom (text) for flexible approaches
- Medium freedom (pseudocode) for preferred patterns
- Low freedom (scripts) for error-prone operations

**Progressive Disclosure**: Skills load in three stages:
1. Metadata (~100 words, always present)
2. SKILL.md body (triggered, <5k words)
3. Bundled resources (loaded as needed)

## Usage

Skills are automatically loaded by Claude Code when relevant to the user's request. The `name` and `description` in the frontmatter determine skill activation.

## Migration Notes

This structure was migrated from a legacy category-based organization to follow the official Anthropic skills specification. Original metadata is preserved in `references/metadata.md` within each skill directory.

---

**Structure Version**: 2.0.0 (Anthropic Standard)
**Last Updated**: 2026-01-12
