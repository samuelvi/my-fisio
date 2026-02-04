# Proposed Directory Structure

## Complete Structure

```
.
├── .agents/                                    # Reusable AI Agent Instructions
│   ├── README.md                               # Overview, usage, compatibility
│   │
│   ├── core/                                   # Fundamental agents
│   │   ├── symfony-ddd-agent-v1.0.md          # Symfony DDD + Event Sourcing
│   │   ├── react-typescript-agent-v1.0.md     # React + TS + Vite patterns
│   │   └── git-workflow-agent-v1.0.md         # Git conventions
│   │
│   ├── development/                            # Development agents
│   │   ├── testing-agent-v1.0.md              # Playwright + PHPUnit
│   │   └── api-development-agent-v1.0.md      # API Platform patterns
│   │
│   └── project-specific/                       # Project-specific instructions
│       ├── myphysio-agent-v1.0.md             # Main project agent (current AGENTS.md)
│       └── myphysio-specifications-agent-v1.0.md  # Specs agent
│
├── .skills/                                    # Reusable Skills Library
│   ├── README.md                               # Taxonomy, usage, dependencies
│   │
│   ├── core/                                   # Fundamental skills
│   │   ├── cqrs-pattern-v1.0.md               # CQRS implementation
│   │   ├── repository-pattern-v1.0.md         # Repository + QueryBuilder
│   │   └── event-sourcing-v1.0.md             # Event Sourcing patterns
│   │
│   ├── advanced/                               # Advanced skills
│   │   ├── n-plus-one-pagination-v1.0.md      # N+1 pagination strategy
│   │   ├── validation-mapping-v1.0.md         # React-Symfony validation
│   │   └── server-side-i18n-v1.0.md           # Multi-language injection
│   │
│   ├── integration/                            # Integration skills
│   │   ├── fosjs-routing-v1.0.md              # FOSJsRouting setup
│   │   ├── jwt-authentication-v1.0.md         # JWT auth patterns
│   │   └── doctrine-performance-v1.0.md       # Doctrine optimization
│   │
│   └── domain/                                 # Domain-specific skills
│       ├── audit-trail-pattern-v1.0.md        # Audit trail implementation
│       └── draft-recovery-pattern-v1.0.md     # Draft system pattern
│
├── docs/                                       # Project-Specific Documentation
│   ├── README.md                               # Project docs index
│   ├── index.md                                # Master navigation index
│   │
│   ├── architecture/                           # System architecture
│   │   ├── overview.md                         # High-level architecture
│   │   ├── system-architecture.md              # Detailed architecture (04-SYSTEM-ARCHITECTURE.md)
│   │   ├── data-model.md                       # Data model (06-DATA-MODEL.md)
│   │   └── database-schema.md                  # Current DATABASE_SCHEMA.md
│   │
│   ├── features/                               # Feature documentation
│   │   ├── audit-system.md                     # AUDIT_SYSTEM.md
│   │   ├── audit-examples.md                   # AUDIT_EXAMPLES.md
│   │   └── draft-system.md                     # DRAFT_SYSTEM.md
│   │
│   ├── specifications/                         # Complete specifications
│   │   ├── 00-SUMMARY.md
│   │   ├── 00-SUMMARY-SHORT.md
│   │   ├── 01-EXECUTIVE-SUMMARY.md
│   │   ├── 02-PRODUCT-REQUIREMENTS.md
│   │   ├── 03-SCOPE-AND-ROADMAP.md
│   │   ├── 04-SYSTEM-ARCHITECTURE.md           # Duplicated in architecture/
│   │   ├── 05-TECHNICAL-SPECIFICATIONS.md
│   │   ├── 06-DATA-MODEL.md                    # Duplicated in architecture/
│   │   ├── 07-SECURITY-AND-COMPLIANCE.md
│   │   ├── 08-VALIDATIONS-AND-QUALITY.md
│   │   ├── 09-CONSTRAINTS-AND-LIMITATIONS.md
│   │   ├── 10-RISKS-AND-MITIGATION.md
│   │   ├── 11-OPEN-QUESTIONS-AND-NEXT-STEPS.md
│   │   ├── AUDIT_TECHNICAL.md
│   │   └── DRAFT_TECHNICAL.md
│   │
│   ├── operations/                             # Operational guides
│   │   ├── installation.md                     # INSTALLATION.md
│   │   ├── deployment.md                       # DEPLOYMENT.md
│   │   └── maintenance.md                      # (Future)
│   │
│   ├── guides/                                 # User guides
│   │   └── audit-readme.md                     # AUDIT_README.md
│   │
│   └── archive/                                # Legacy/deprecated docs
│       └── .gitkeep
│
├── claude-agents/                              # → symlink to .agents/
├── claude-skills/                              # → symlink to .skills/
├── gemini-agents/                              # → symlink to .agents/
├── gemini-skills/                              # → symlink to .skills/
├── openai-agents/                              # → symlink to .agents/
├── openai-skills/                              # → symlink to .skills/
│
└── scripts/                                    # Automation scripts
    ├── reorganize-docs.sh                      # Main reorganization script
    ├── validate-structure.sh                   # Integrity validation
    ├── check-symlinks.sh                       # Symlink verification
    └── add-metadata.sh                         # Batch metadata addition
```

## File Mapping Table

| Original File | New Location | Type | Symlinks Created |
|--------------|--------------|------|------------------|
| `docs/AGENTS.md` | `.agents/project-specific/myphysio-agent-v1.0.md` | Agent | claude-agents/, gemini-agents/, openai-agents/ |
| `docs/AGENTS_TESTING.md` | `.agents/development/testing-agent-v1.0.md` | Agent | (same) |
| `docs/specifications/AGENTS.md` | `.agents/project-specific/myphysio-specifications-agent-v1.0.md` | Agent | (same) |
| `docs/DATABASE_SCHEMA.md` | `docs/architecture/database-schema.md` | Docs | - |
| `docs/AUDIT_SYSTEM.md` | `docs/features/audit-system.md` | Docs | - |
| `docs/AUDIT_EXAMPLES.md` | `docs/features/audit-examples.md` | Docs | - |
| `docs/AUDIT_README.md` | `docs/guides/audit-readme.md` | Docs | - |
| `docs/DRAFT_SYSTEM.md` | `docs/features/draft-system.md` | Docs | - |
| `docs/INSTALLATION.md` | `docs/operations/installation.md` | Docs | - |
| `docs/DEPLOYMENT.md` | `docs/operations/deployment.md` | Docs | - |
| `docs/specifications/*` | `docs/specifications/*` | Docs | - |

## New Files to Create (Skills Extracted from Content)

| New File | Content Source | Type |
|----------|----------------|------|
| `.skills/core/cqrs-pattern-v1.0.md` | Extracted from AGENTS.md (CQRS section) | Skill |
| `.skills/core/repository-pattern-v1.0.md` | Extracted from AGENTS.md (Repository section) | Skill |
| `.skills/core/event-sourcing-v1.0.md` | Extracted from AGENTS.md (Event Sourcing section) | Skill |
| `.skills/advanced/n-plus-one-pagination-v1.0.md` | Extracted from AGENTS.md (Pagination Strategy) | Skill |
| `.skills/advanced/validation-mapping-v1.0.md` | Extracted from AGENTS.md (Form Validation) | Skill |
| `.skills/advanced/server-side-i18n-v1.0.md` | Extracted from AGENTS.md (Multi-language Support) | Skill |
| `.skills/integration/fosjs-routing-v1.0.md` | Extracted from AGENTS.md (Frontend Routing) | Skill |
| `.skills/integration/jwt-authentication-v1.0.md` | Extracted from 05-TECHNICAL-SPECIFICATIONS.md | Skill |
| `.skills/integration/doctrine-performance-v1.0.md` | Extracted from AGENTS.md (Doctrine & Performance) | Skill |
| `.skills/domain/audit-trail-pattern-v1.0.md` | Extracted from AUDIT_SYSTEM.md | Skill |
| `.skills/domain/draft-recovery-pattern-v1.0.md` | Extracted from DRAFT_SYSTEM.md | Skill |
| `.agents/core/symfony-ddd-agent-v1.0.md` | Extracted from AGENTS.md (DDD sections) | Agent |
| `.agents/core/react-typescript-agent-v1.0.md` | Extracted from AGENTS.md (Frontend sections) | Agent |
| `.agents/core/git-workflow-agent-v1.0.md` | Extracted from AGENTS.md (Git Workflow) | Agent |
| `.agents/development/api-development-agent-v1.0.md` | Extracted from AGENTS.md (API Platform) | Agent |

## Symlink Strategy

### Claude (Anthropic)
```bash
ln -s ./.agents ./claude-agents
ln -s ./.skills ./claude-skills
```

### Gemini (Google)
```bash
ln -s ./.agents ./gemini-agents
ln -s ./.skills ./gemini-skills
```

### OpenAI/ChatGPT
```bash
ln -s ./.agents ./openai-agents
ln -s ./.skills ./openai-skills
```

### Generic fallbacks
```bash
ln -s ./.agents ./agents
ln -s ./.skills ./skills
```

## Metadata Template

Each agent/skill file will include:

```yaml
---
type: agent|skill
category: core|integration|automation|development|domain|advanced|project-specific
version: 1.0.0
status: production|beta|experimental
compatibility:
  llms: [claude, gemini, openai]
  frameworks: [symfony, react, doctrine, api-platform]
dependencies: []
tags: []
created: 2026-01-09
updated: 2026-01-09
author: MyPhysio Team
license: MIT
---
```

## Git Integration

`.gitignore` additions:
```gitignore
# LLM symlinks (keep them in git for portability)
# claude-agents
# claude-skills
# gemini-agents
# gemini-skills
# openai-agents
# openai-skills
```

`.gitattributes` additions:
```gitattributes
# Ensure symlinks are tracked correctly
*-agents export-ignore
*-skills export-ignore
```

## Next Steps

1. ✅ Review and approve this structure
2. 🔄 Run `scripts/reorganize-docs.sh` (will be created)
3. 🔍 Validate with `scripts/validate-structure.sh`
4. 📝 Update project README to reference new structure
5. 🔗 Test symlinks across different LLM tools
