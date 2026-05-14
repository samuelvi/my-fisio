# MyPhysio Documentation

This directory contains project-specific documentation for the MyPhysio Physiotherapy Clinic Management System.

## 📁 Structure

```
docs/
├── architecture/            # System architecture & design
│   ├── overview.md
│   ├── system-architecture.md
│   ├── data-model.md
│   └── database-schema.md
│
├── features/                # Feature-specific documentation
│   ├── audit-system.md
│   ├── audit-examples.md
│   └── draft-system.md
│
├── specifications/          # Complete project specifications
│   ├── 00-SUMMARY.md
│   ├── 01-EXECUTIVE-SUMMARY.md
│   ├── 02-PRODUCT-REQUIREMENTS.md
│   ├── 03-SCOPE-AND-ROADMAP.md
│   ├── 04-SYSTEM-ARCHITECTURE.md
│   ├── 05-TECHNICAL-SPECIFICATIONS.md
│   ├── 06-DATA-MODEL.md
│   ├── 07-SECURITY-AND-COMPLIANCE.md
│   ├── 08-VALIDATIONS-AND-QUALITY.md
│   ├── 09-CONSTRAINTS-AND-LIMITATIONS.md
│   ├── 10-RISKS-AND-MITIGATION.md
│   ├── 11-OPEN-QUESTIONS-AND-NEXT-STEPS.md
│   ├── AUDIT_TECHNICAL.md
│   └── DRAFT_TECHNICAL.md
│
├── operations/              # Operational guides
│   ├── installation.md
│   ├── deployment.md
│   └── maintenance.md
│
├── security/                # Security operation guides
│   └── dependency-installation.md
│
├── guides/                  # User & developer guides
│   └── audit-readme.md
│
├── testing/                 # Testing documentation
│   └── e2e.md
│
└── archive/                 # Deprecated documentation
```

## 🎯 Documentation Categories

### Architecture
System design, data models, and technical architecture:
- **overview.md**: High-level system overview
- **system-architecture.md**: Detailed architecture documentation
- **data-model.md**: Entity relationships and domain model
- **database-schema.md**: Database tables, columns, and relationships

### Features
Feature-specific implementation documentation:
- **audit-system.md**: Audit trail and domain events system
- **audit-examples.md**: Real-world audit usage examples
- **draft-system.md**: Network error recovery for forms

### Specifications
Complete project specifications (product, technical, compliance):
- **00-SUMMARY.md**: Executive summary
- **01-EXECUTIVE-SUMMARY.md**: Strategic overview
- **02-PRODUCT-REQUIREMENTS.md**: Functional requirements
- **03-SCOPE-AND-ROADMAP.md**: Project scope and timeline
- **04-SYSTEM-ARCHITECTURE.md**: Architecture specifications
- **05-TECHNICAL-SPECIFICATIONS.md**: Technology stack details
- **06-DATA-MODEL.md**: Entity and domain model specs
- **07-SECURITY-AND-COMPLIANCE.md**: Security policies
- **08-VALIDATIONS-AND-QUALITY.md**: Validation rules and QA
- **09-CONSTRAINTS-AND-LIMITATIONS.md**: Known limitations
- **10-RISKS-AND-MITIGATION.md**: Risk assessment
- **11-OPEN-QUESTIONS-AND-NEXT-STEPS.md**: Pending decisions

### Operations
Installation, deployment, and maintenance guides:
- **installation.md**: Local development setup
- **deployment.md**: Production deployment procedures
- **maintenance.md**: Ongoing maintenance tasks

### Security
Security operation guides:
- **dependency-installation.md**: Safe frontend dependency checks, install workflow, Make targets, and CI gates

### Guides
Step-by-step guides for users and developers:
- **audit-readme.md**: How to use the audit system

### Testing
E2E testing infrastructure and guidelines:
- **e2e.md**: Playwright-BDD setup, fixtures, and conventions

## 🔍 Quick Reference

### Common Tasks

**Setting up development environment:**
```bash
cat docs/operations/installation.md
```

**Understanding system architecture:**
```bash
cat docs/architecture/system-architecture.md
```

**Deploying to production:**
```bash
cat docs/operations/deployment.md
```

**Working with audit system:**
```bash
cat docs/features/audit-system.md
cat docs/guides/audit-readme.md
```

**Adding frontend dependencies safely:**
```bash
cat docs/security/dependency-installation.md
make deps-check pkg=@heroicons/react@2.2.0
```

## 📚 Related Resources

### AI Agent Instructions
For AI-assisted development, see:
- [.agents/README.md](../.agents/README.md) - AI agent instructions
- [.agents/project-specific/myphysio-agent-v1.0.md](../.agents/project-specific/myphysio-agent-v1.0.md) - Main project agent

### Implementation Patterns
For reusable implementation patterns, see:
- [.skills/README.md](../.skills/README.md) - Skills library
- [.skills/domain/audit-trail-pattern-v1.0.md](../.skills/domain/audit-trail-pattern-v1.0.md) - Audit pattern
- [.skills/domain/draft-recovery-pattern-v1.0.md](../.skills/domain/draft-recovery-pattern-v1.0.md) - Draft pattern

### Master Index
For complete navigation, see:
- [index.md](./index.md) - Master documentation index

## 🔄 Documentation Workflow

### Reverse Engineering Documentation
**IMPORTANT**: Documentation should be maintained using **reverse engineering**:
- Document what has been implemented, not what is planned
- Update docs immediately after implementing features
- Keep documentation in sync with actual code

### When to Update Documentation

| Change Type | Documentation to Update |
|------------|------------------------|
| New feature | specifications/, architecture/, features/ |
| Database change | architecture/database-schema.md, data-model.md |
| Deployment change | operations/deployment.md |
| Security change | specifications/07-SECURITY-AND-COMPLIANCE.md |
| Dependency security change | security/dependency-installation.md, operations/installation.md, specifications/07-SECURITY-AND-COMPLIANCE.md |
| Validation change | specifications/08-VALIDATIONS-AND-QUALITY.md |

### Documentation Update Format
```markdown
## [YYYY-MM-DD] Change Title

### Description
Brief description of what changed

### Files Modified
- `path/to/file1.php`
- `path/to/file2.tsx`

### Implementation Details
Technical details of the change

### Impact
How this affects the system

### Examples
Code examples or usage examples
```

## 🛠️ Maintenance

### Validate Documentation Structure
```bash
./scripts/validate-structure.sh
```

### Search Documentation
```bash
# Find documentation about a topic
grep -r "audit" docs/

# Search specific category
grep -r "validation" docs/specifications/
```

### Update Table of Contents
```bash
# Auto-generate TOC for a document
./scripts/generate-toc.sh docs/architecture/system-architecture.md
```

## 📈 Documentation Metrics

### Current State
```bash
# Count documentation files
find docs -name "*.md" | wc -l

# Total documentation size
du -sh docs/

# Files by category
find docs -type d -maxdepth 1 -exec sh -c 'echo -n "{}: "; find "{}" -name "*.md" | wc -l' \;
```

## 🎓 Best Practices

### Writing Documentation

**DO:**
- ✅ Use clear, concise language
- ✅ Include code examples
- ✅ Add diagrams for complex concepts
- ✅ Keep it up-to-date with code
- ✅ Use consistent formatting
- ✅ Link to related documentation

**DON'T:**
- ❌ Document future plans (use roadmap instead)
- ❌ Duplicate information across files
- ❌ Use vague or ambiguous language
- ❌ Leave outdated documentation

### Linking Between Documents
```markdown
# Absolute path from project root
[Agent Instructions](../.agents/project-specific/myphysio-agent-v1.0.md)

# Relative path within docs/
[Database Schema](./architecture/database-schema.md)

# External link
[Symfony Documentation](https://symfony.com/doc/current/index.html)
```

### Code Examples
````markdown
```php
// Include complete, working examples
namespace App\Domain\Patient\Entity;

class Patient
{
    // Full class definition...
}
```
````

### Diagrams
Use Mermaid for diagrams:
````markdown
```mermaid
graph TD
    A[Browser] --> B[Nginx]
    B --> C[PHP-FPM]
    C --> D[Symfony]
    D --> E[MariaDB]
```
````

## 📋 Documentation Checklist

Before considering documentation complete:

- [ ] All public APIs are documented
- [ ] Architecture diagrams are current
- [ ] Database schema matches actual database
- [ ] Installation guide is tested
- [ ] Deployment guide is validated
- [ ] Security policies are documented
- [ ] All features have usage examples
- [ ] Error handling is explained
- [ ] Performance considerations are noted
- [ ] Known limitations are listed

## 🔐 Confidential Information

**Never include in documentation:**
- ❌ Production credentials
- ❌ API keys or secrets
- ❌ Customer data
- ❌ Personal information
- ❌ Internal IP addresses
- ❌ Unpatched security vulnerabilities

**Use placeholders instead:**
```bash
# Good
DATABASE_URL="mysql://user:password@host:3306/db"

# Bad
DATABASE_URL="mysql://admin:SuperSecret123@prod-db-01.internal:3306/myphysio"
```

## 🆘 Troubleshooting Documentation

### Documentation Not Found
```bash
# Verify file location
find docs -name "*audit*"

# Check if file was moved
git log --follow -- docs/old-filename.md
```

### Broken Links
```bash
# Find broken internal links
./scripts/check-links.sh docs/
```

### Outdated Information
```bash
# Find last update date
git log -1 --format="%ai" -- docs/path/to/file.md
```

## 📞 Support

For documentation questions:
1. Check [index.md](./index.md) for navigation
2. Search documentation: `grep -r "keyword" docs/`
3. Check git history: `git log -- docs/path/to/file.md`
4. Review related agent: [.agents/project-specific/myphysio-agent-v1.0.md](../.agents/project-specific/myphysio-agent-v1.0.md)

## 🤝 Contributing to Documentation

1. **Identify** what needs documentation
2. **Locate** the correct category (architecture, features, etc.)
3. **Write** following the documentation format
4. **Link** from index.md
5. **Validate** structure and links
6. **Commit** with conventional commit message

Example commit:
```bash
git add docs/features/new-feature.md
git commit -m "docs(features): add documentation for new feature"
```

---

**Project**: MyPhysio - Physiotherapy Clinic Management System
**Last Updated**: 2026-01-09
**Documentation Version**: 1.0.0
**Maintained By**: MyPhysio Team
