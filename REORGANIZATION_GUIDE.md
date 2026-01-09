# Documentation Reorganization - Execution Guide

> **Complete step-by-step guide** to reorganize documentation into `.agents/`, `.skills/`, and `docs/` structure with multi-LLM compatibility.

## 📋 Table of Contents

- [Overview](#-overview)
- [Pre-Execution Checklist](#-pre-execution-checklist)
- [File Mapping Table](#-file-mapping-table)
- [Step-by-Step Execution](#-step-by-step-execution)
- [Post-Reorganization Tasks](#-post-reorganization-tasks)
- [Validation](#-validation)
- [Rollback Procedure](#-rollback-procedure)
- [Next Steps](#-next-steps)

---

## 🎯 Overview

### What This Does

This reorganization:
1. ✅ Creates `.agents/` for reusable AI agent instructions
2. ✅ Creates `.skills/` for reusable implementation patterns
3. ✅ Reorganizes `docs/` for project-specific documentation
4. ✅ Creates symlinks for Claude, Gemini, OpenAI compatibility
5. ✅ Adds metadata to all agent/skill files
6. ✅ Validates structure integrity

### Structure Created

```
.
├── .agents/                    # Reusable AI agent instructions
│   ├── core/                   # Symfony DDD, React TS, Git
│   ├── development/            # Testing, API development
│   └── project-specific/       # MyPhysio agents
│
├── .skills/                    # Reusable implementation patterns
│   ├── core/                   # CQRS, Repository, Event Sourcing
│   ├── advanced/               # Pagination, Validation, i18n
│   ├── integration/            # FOSJsRouting, JWT, Doctrine
│   └── domain/                 # Audit Trail, Draft Recovery
│
├── docs/                       # Project documentation (reorganized)
│   ├── architecture/           # System architecture & design
│   ├── features/               # Feature documentation
│   ├── specifications/         # Complete specifications
│   ├── operations/             # Installation & deployment
│   └── guides/                 # User guides
│
└── [symlinks]                  # Multi-LLM compatibility
    ├── claude-agents → .agents/
    ├── claude-skills → .skills/
    ├── gemini-agents → .agents/
    ├── gemini-skills → .skills/
    ├── openai-agents → .agents/
    └── openai-skills → .skills/
```

---

## ✅ Pre-Execution Checklist

Before running the reorganization:

- [ ] **Backup**: Ensure you have a recent backup or git commit
- [ ] **Working Directory**: Verify you're in project root (has `composer.json`, `package.json`)
- [ ] **Git Status**: Run `git status` to see uncommitted changes
- [ ] **Disk Space**: Ensure sufficient disk space (~50MB for backup)
- [ ] **Review**: Read through this entire guide before starting

### Create Git Checkpoint

```bash
# Commit any current work
git add -A
git commit -m "chore: checkpoint before docs reorganization"

# Or stash changes
git stash save "before docs reorganization"
```

---

## 📊 File Mapping Table

### Existing Files → New Locations

| Original Location | New Location | Type | Action |
|-------------------|--------------|------|--------|
| `docs/AGENTS.md` | `.agents/project-specific/myphysio-agent-v1.0.md` | Agent | **MOVE** |
| `docs/AGENTS_TESTING.md` | `.agents/development/testing-agent-v1.0.md` | Agent | **MOVE** |
| `docs/specifications/AGENTS.md` | `.agents/project-specific/myphysio-specifications-agent-v1.0.md` | Agent | **MOVE** |
| `docs/DATABASE_SCHEMA.md` | `docs/architecture/database-schema.md` | Docs | **MOVE** |
| `docs/AUDIT_SYSTEM.md` | `docs/features/audit-system.md` | Docs | **MOVE** |
| `docs/AUDIT_EXAMPLES.md` | `docs/features/audit-examples.md` | Docs | **MOVE** |
| `docs/AUDIT_README.md` | `docs/guides/audit-readme.md` | Docs | **MOVE** |
| `docs/DRAFT_SYSTEM.md` | `docs/features/draft-system.md` | Docs | **MOVE** |
| `docs/INSTALLATION.md` | `docs/operations/installation.md` | Docs | **MOVE** |
| `docs/DEPLOYMENT.md` | `docs/operations/deployment.md` | Docs | **MOVE** |
| `docs/specifications/04-SYSTEM-ARCHITECTURE.md` | `docs/architecture/system-architecture.md` | Docs | **COPY** |
| `docs/specifications/06-DATA-MODEL.md` | `docs/architecture/data-model.md` | Docs | **COPY** |
| `docs/specifications/*` | `docs/specifications/*` | Docs | **KEEP** |

### New Files to Create (Skills - Manual Extraction)

These skills will be extracted from existing content:

| New File | Content Source | Status |
|----------|----------------|--------|
| `.skills/core/cqrs-pattern-v1.0.md` | Extracted from AGENTS.md (CQRS section) | 📝 TODO |
| `.skills/core/repository-pattern-v1.0.md` | Extracted from AGENTS.md (Repository section) | 📝 TODO |
| `.skills/core/event-sourcing-v1.0.md` | Extracted from AGENTS.md (Event Sourcing section) | 📝 TODO |
| `.skills/advanced/n-plus-one-pagination-v1.0.md` | Extracted from AGENTS.md (Pagination Strategy) | 📝 TODO |
| `.skills/advanced/validation-mapping-v1.0.md` | Extracted from AGENTS.md (Form Validation) | 📝 TODO |
| `.skills/advanced/server-side-i18n-v1.0.md` | Extracted from AGENTS.md (Multi-language) | 📝 TODO |
| `.skills/integration/fosjs-routing-v1.0.md` | Extracted from AGENTS.md (Frontend Routing) | 📝 TODO |
| `.skills/integration/jwt-authentication-v1.0.md` | Extracted from 05-TECHNICAL-SPECIFICATIONS.md | 📝 TODO |
| `.skills/integration/doctrine-performance-v1.0.md` | Extracted from AGENTS.md (Doctrine section) | 📝 TODO |
| `.skills/domain/audit-trail-pattern-v1.0.md` | Extracted from AUDIT_SYSTEM.md | 📝 TODO |
| `.skills/domain/draft-recovery-pattern-v1.0.md` | Extracted from DRAFT_SYSTEM.md | 📝 TODO |

### New Documentation Files

| File | Purpose |
|------|---------|
| `.agents/README.md` | Agent library overview |
| `.skills/README.md` | Skills library overview |
| `docs/README.md` | Project documentation guide |
| `docs/index.md` | Master documentation index |
| `PROPOSED_STRUCTURE.md` | This structure proposal |
| `REORGANIZATION_GUIDE.md` | This execution guide |

---

## 🚀 Step-by-Step Execution

### Phase 1: Dry-Run (RECOMMENDED)

First, run in dry-run mode to see what will happen:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run dry-run
./scripts/reorganize-docs.sh --dry-run --verbose
```

**Review the output carefully!** It shows:
- What directories will be created
- What files will be moved
- What symlinks will be created

### Phase 2: Execute Reorganization

If dry-run looks good, execute the actual reorganization:

```bash
# Execute with backup (RECOMMENDED)
./scripts/reorganize-docs.sh --verbose

# Or without backup (NOT RECOMMENDED)
./scripts/reorganize-docs.sh --no-backup --verbose
```

**What happens:**
1. ✅ Creates backup at `backup-docs-YYYYMMDD-HHMMSS/`
2. ✅ Creates directory structure
3. ✅ Moves files to new locations
4. ✅ Copies architecture docs from specifications/
5. ✅ Creates symlinks for Claude, Gemini, OpenAI
6. ✅ Creates `.gitignore.additions`

**Expected output:**
```
=========================================================================
  REORGANIZATION COMPLETE
=========================================================================

📁 New Structure:
   .agents/          - Reusable agent instructions
   .skills/          - Reusable skill library
   docs/             - Project-specific documentation

🔗 Symlinks Created:
   claude-agents/    → .agents/
   claude-skills/    → .skills/
   gemini-agents/    → .agents/
   gemini-skills/    → .skills/
   openai-agents/    → .agents/
   openai-skills/    → .skills/

📋 Next Steps:
   1. Review moved files: tree .agents .skills docs
   2. Add metadata to files: ./scripts/add-metadata.sh
   3. Extract skills: ./scripts/extract-skills.sh
   4. Create READMEs: ./scripts/create-readmes.sh
   5. Validate structure: ./scripts/validate-structure.sh
   ...

💾 Backup Location:
   /path/to/backup-docs-YYYYMMDD-HHMMSS
   To rollback: rm -rf docs .agents .skills && mv backup-docs-*/* .

📊 Statistics:
   Agents:  3 files
   Skills:  0 files
   Docs:    24 files
```

### Phase 3: Add Metadata

Add YAML metadata headers to all agent/skill files:

```bash
# Dry-run first
./scripts/add-metadata.sh --dry-run

# Execute
./scripts/add-metadata.sh
```

**What this does:**
- Adds YAML frontmatter to all `.md` files in `.agents/` and `.skills/`
- Skips files that already have metadata
- Infers metadata from file location and name

**Example metadata added:**
```yaml
---
type: agent
category: project-specific
version: 1.0.0
status: production
compatibility:
  llms:
    - claude
    - gemini
    - openai
  frameworks:
    - symfony
    - react
    - doctrine
    - api-platform
dependencies: []
tags: []
created: 2026-01-09
updated: 2026-01-09
author: MyPhysio Team
license: MIT
description: |
  Auto-generated metadata. Update description with actual content summary.
---
```

### Phase 4: Validate Structure

Verify the reorganization was successful:

```bash
# Full validation
./scripts/validate-structure.sh --verbose

# Quick validation
./scripts/validate-structure.sh
```

**What is checked:**
- ✅ All required directories exist
- ✅ Symlinks are valid and point to correct targets
- ✅ Symlink targets exist
- ✅ Files have metadata
- ✅ Files follow naming conventions
- ✅ No orphaned files in old locations
- ✅ No duplicate files

**Expected output:**
```
=========================================================================
  DOCUMENTATION STRUCTURE VALIDATION
=========================================================================

📁 Checking directory structure...
✓ All required directories exist

🔗 Checking symlinks...
✓ All symlinks valid

🎯 Checking symlink targets...
✓ All symlink targets exist

📋 Checking file metadata...
✓ All files have metadata

📝 Checking naming conventions...
✓ All files follow naming conventions

🔍 Checking for orphaned files...
✓ No orphaned files found

🔄 Checking for duplicate content...
✓ No duplicate files found

=========================================================================
  VALIDATION STATISTICS
=========================================================================

📊 File counts:
   Agents:   3 files
   Skills:   0 files
   Docs:     24 files
   Symlinks: 6 links

📈 Validation results:
   Errors:   0
   Warnings: 0

✓ Structure is valid!
```

### Phase 5: Update Git Configuration

Review and merge `.gitignore.additions`:

```bash
# Review additions
cat .gitignore.additions

# Merge to .gitignore (manually)
cat .gitignore.additions >> .gitignore

# Or keep symlinks in git (recommended)
# - Symlinks help with cross-platform/team consistency
# - Don't add symlinks to .gitignore
```

---

## 📝 Post-Reorganization Tasks

### Task 1: Extract Skills (MANUAL)

Skills need to be manually extracted from existing documentation:

```bash
# Create skill files
vim .skills/core/cqrs-pattern-v1.0.md
vim .skills/core/repository-pattern-v1.0.md
# ... etc
```

**Use this template for each skill:**

```markdown
---
type: skill
category: core|advanced|integration|domain
version: 1.0.0
status: production
compatibility:
  llms: [claude, gemini, openai]
  frameworks: [symfony, react, doctrine, api-platform]
dependencies: []
tags: []
created: 2026-01-09
updated: 2026-01-09
author: MyPhysio Team
license: MIT
description: |
  Brief description of what this skill provides
---

# Skill Name

## Overview
[Brief description]

## Problem Statement
[What problem does this solve?]

## Solution
[High-level solution]

## Implementation

### Prerequisites
[Required dependencies, setup]

### Step-by-Step Guide
1. [Step 1 with code example]
2. [Step 2 with code example]
3. [Step 3 with code example]

### Code Templates
```php
// Full working example
```

## Configuration
[Config files, environment variables]

## Testing
[How to test this pattern]

## Performance Considerations
[Optimization tips]

## Troubleshooting
[Common issues]

## References
[Related skills, docs]
```

**Where to extract from:**

| Skill | Extract From | Section |
|-------|-------------|---------|
| CQRS Pattern | `.agents/project-specific/myphysio-agent-v1.0.md` | "CQRS" section (lines ~107-109) |
| Repository Pattern | `.agents/project-specific/myphysio-agent-v1.0.md` | "Repositories" + "Repository Pattern" sections |
| Event Sourcing | `.agents/project-specific/myphysio-agent-v1.0.md` | "Event Sourcing & Auditing" section |
| N+1 Pagination | `.agents/project-specific/myphysio-agent-v1.0.md` | "Pagination Strategy" section (lines ~160-164) |
| Validation Mapping | `.agents/project-specific/myphysio-agent-v1.0.md` | "Form Validation Best Practices" section |
| Server-Side i18n | `.agents/project-specific/myphysio-agent-v1.0.md` | "Multi-language Support" section |
| FOSJsRouting | `.agents/project-specific/myphysio-agent-v1.0.md` | "Frontend Routing" section |
| JWT Auth | `docs/specifications/05-TECHNICAL-SPECIFICATIONS.md` | LexikJWT section |
| Doctrine Performance | `.agents/project-specific/myphysio-agent-v1.0.md` | "Doctrine & Performance" section |
| Audit Trail | `docs/features/audit-system.md` | Entire document (extract pattern) |
| Draft Recovery | `docs/features/draft-system.md` | Entire document (extract pattern) |

### Task 2: Update Agent Dependencies

After creating skills, update agent metadata to reference them:

```bash
# Example: Update myphysio-agent-v1.0.md
vim .agents/project-specific/myphysio-agent-v1.0.md
```

Update the `dependencies` section in YAML frontmatter:

```yaml
dependencies:
  - .skills/core/cqrs-pattern-v1.0.md
  - .skills/core/repository-pattern-v1.0.md
  - .skills/core/event-sourcing-v1.0.md
  - .skills/advanced/n-plus-one-pagination-v1.0.md
  - .skills/domain/audit-trail-pattern-v1.0.md
  - .skills/domain/draft-recovery-pattern-v1.0.md
```

### Task 3: Test LLM Access

Verify symlinks work for each LLM:

```bash
# Claude
cat claude-agents/project-specific/myphysio-agent-v1.0.md
cat claude-skills/core/cqrs-pattern-v1.0.md

# Gemini
cat gemini-agents/development/testing-agent-v1.0.md
cat gemini-skills/advanced/n-plus-one-pagination-v1.0.md

# OpenAI
cat openai-agents/core/git-workflow-agent-v1.0.md
cat openai-skills/integration/jwt-authentication-v1.0.md

# All should display content correctly
```

### Task 4: Update Project README

Add a section to your main `README.md`:

```markdown
## 📚 Documentation

This project uses a professional documentation structure:

- **AI Agents**: [.agents/README.md](./.agents/README.md) - AI assistant instructions
- **Skills Library**: [.skills/README.md](./.skills/README.md) - Reusable implementation patterns
- **Project Docs**: [docs/index.md](./docs/index.md) - Complete documentation index

### Quick Links

- [Installation Guide](./docs/operations/installation.md)
- [System Architecture](./docs/architecture/system-architecture.md)
- [Main Agent (for AI)](./agents/project-specific/myphysio-agent-v1.0.md)

### Multi-LLM Support

Documentation is compatible with multiple LLM providers:
- Claude: `claude-agents/`, `claude-skills/`
- Gemini: `gemini-agents/`, `gemini-skills/`
- OpenAI: `openai-agents/`, `openai-skills/`
```

---

## ✅ Validation

### Quick Validation Checklist

Run these commands and verify success:

```bash
# 1. Structure validation
./scripts/validate-structure.sh
# Expected: 0 errors, 0 warnings (or only warnings about missing skills)

# 2. Check symlinks
ls -la *-agents *-skills
# Expected: All show → .agents/ or → .skills/

# 3. Count files
find .agents -name "*.md" -not -name "README.md" | wc -l
# Expected: 3+ files

find docs -name "*.md" | wc -l
# Expected: 25+ files

# 4. Verify no orphans
ls docs/*.md 2>/dev/null
# Expected: "No such file or directory" (all moved to subdirectories)

# 5. Test LLM access
cat claude-agents/project-specific/myphysio-agent-v1.0.md | head -20
# Expected: Content displays correctly
```

### Full Validation Report

```bash
# Generate comprehensive validation report
./scripts/validate-structure.sh --verbose > validation-report.txt

# Review report
cat validation-report.txt
```

---

## 🔄 Rollback Procedure

If something goes wrong, rollback to the backup:

### Option 1: Use Backup Directory

```bash
# Find your backup
ls -d backup-docs-*

# Restore from backup
BACKUP_DIR="backup-docs-YYYYMMDD-HHMMSS"  # Use your actual backup dir

# Remove new structure
rm -rf .agents .skills docs

# Restore old structure
cp -r "${BACKUP_DIR}/docs" ./docs

# If .agents or .skills existed before
cp -r "${BACKUP_DIR}/.agents" ./.agents  # If it exists in backup
cp -r "${BACKUP_DIR}/.skills" ./.skills  # If it exists in backup

# Remove symlinks
rm -f claude-agents claude-skills gemini-agents gemini-skills openai-agents openai-skills

echo "Rollback complete!"
```

### Option 2: Use Git

If you created a git checkpoint:

```bash
# Rollback to checkpoint
git reset --hard HEAD~1

# Or restore from stash
git stash pop
```

### Option 3: Manual Rollback

If no backup exists, manually move files back:

```bash
# Move agent files back
mv .agents/project-specific/myphysio-agent-v1.0.md docs/AGENTS.md
mv .agents/development/testing-agent-v1.0.md docs/AGENTS_TESTING.md
mv .agents/project-specific/myphysio-specifications-agent-v1.0.md docs/specifications/AGENTS.md

# Move documentation files back
mv docs/architecture/database-schema.md docs/DATABASE_SCHEMA.md
mv docs/features/audit-system.md docs/AUDIT_SYSTEM.md
mv docs/features/audit-examples.md docs/AUDIT_EXAMPLES.md
mv docs/guides/audit-readme.md docs/AUDIT_README.md
mv docs/features/draft-system.md docs/DRAFT_SYSTEM.md
mv docs/operations/installation.md docs/INSTALLATION.md
mv docs/operations/deployment.md docs/DEPLOYMENT.md

# Remove new directories
rm -rf .agents .skills
rm -rf docs/architecture docs/features docs/operations docs/guides

# Remove symlinks
rm -f claude-agents claude-skills gemini-agents gemini-skills openai-agents openai-skills
```

---

## 🎯 Next Steps

After successful reorganization:

### Immediate (Today)

1. ✅ **Commit changes**:
   ```bash
   git add -A
   git commit -m "docs: reorganize into .agents/, .skills/, docs/ structure with multi-LLM support"
   ```

2. ✅ **Update README**: Add documentation section (see Task 4 above)

3. ✅ **Test with your LLM**: Try loading agents via symlinks

### Short-term (This Week)

4. 📝 **Extract skills**: Manually create skill files (see Task 1 above)

5. 🔗 **Update dependencies**: Add skill references to agent metadata

6. ✅ **Validate**: Run `./scripts/validate-structure.sh` again

7. 📚 **Review index**: Read through `docs/index.md` and familiarize yourself

### Medium-term (This Month)

8. 🎓 **Team onboarding**: Share `docs/index.md` with team

9. 🤖 **AI integration**: Test agents with Claude Code, Gemini, ChatGPT

10. 📊 **Metrics**: Track documentation usage and quality

11. 🔄 **Iterate**: Refine agents/skills based on usage

### Long-term (Ongoing)

12. 🆕 **New skills**: Extract new patterns as you discover them

13. 🔄 **Version updates**: Maintain semantic versioning for agents/skills

14. 📈 **Documentation maintenance**: Keep reverse-engineering docs updated

15. 🌍 **Share patterns**: Consider open-sourcing reusable skills

---

## 📊 Summary

### What Was Accomplished

✅ **Structure Created**:
- `.agents/` directory with core, development, and project-specific agents
- `.skills/` directory with core, advanced, integration, and domain skills (ready for extraction)
- `docs/` reorganized into architecture, features, operations, guides

✅ **Files Reorganized**:
- 3 agent files moved and renamed
- 10 documentation files moved to categorized locations
- 2 architecture files copied for easy access

✅ **Multi-LLM Support**:
- 6 symlinks created (claude-*, gemini-*, openai-*)
- Single source of truth with multiple access paths
- Zero file duplication

✅ **Documentation Added**:
- README.md for `.agents/`, `.skills/`, `docs/`
- Master index at `docs/index.md`
- Comprehensive guides and diagrams

✅ **Automation Created**:
- Reorganization script with dry-run and backup
- Validation script with integrity checks
- Metadata addition script
- Symlink verification

### Benefits Achieved

🎯 **For Developers**:
- Clear separation of reusable vs project-specific docs
- Easy navigation via `docs/index.md`
- Consistent structure across projects

🤖 **For AI Assistants**:
- Standardized agent instruction format
- Reusable skill library
- Multi-LLM compatibility via symlinks

📚 **For Teams**:
- Zero duplication (symlinks, not copies)
- Centralized updates (edit once, available everywhere)
- Professional structure following industry standards

---

## 🆘 Troubleshooting

### Issue: "Permission denied" when running scripts

**Solution:**
```bash
chmod +x scripts/*.sh
```

### Issue: Symlinks not working on Windows

**Solution:**
Windows requires admin privileges for symlinks. Options:
1. Enable Developer Mode in Windows 10/11
2. Run terminal as administrator
3. Use Git Bash (which handles symlinks)
4. Use WSL (Windows Subsystem for Linux)

### Issue: "Directory not empty" error

**Solution:**
Old structure exists. Either:
1. Use rollback procedure first
2. Run with `--force` flag (if available)
3. Manually remove old directories

### Issue: Broken symlinks after reorganization

**Solution:**
```bash
# Fix broken symlinks
./scripts/validate-structure.sh --fix

# Or manually recreate
rm -f claude-agents claude-skills gemini-agents gemini-skills openai-agents openai-skills
ln -s .agents claude-agents
ln -s .skills claude-skills
ln -s .agents gemini-agents
ln -s .skills gemini-skills
ln -s .agents openai-agents
ln -s .skills openai-skills
```

### Issue: Validation shows warnings about missing skills

**Expected behavior**: Skills haven't been extracted yet. This is normal.

**Solution**: Extract skills manually (see Post-Reorganization Tasks > Task 1)

---

## 📞 Support

If you encounter issues:

1. **Check validation**: `./scripts/validate-structure.sh --verbose`
2. **Review logs**: `cat reorganize-docs.log`
3. **Check backup**: `ls -d backup-docs-*`
4. **Rollback if needed**: See Rollback Procedure above
5. **Review structure**: `tree .agents .skills docs -L 2`

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-09
**Created By**: Claude Code (Anthropic)
**Maintained By**: MyPhysio Team
