# AI Agents Library

This directory contains reusable AI agent instructions that can be used across multiple LLMs (Claude, Gemini, OpenAI, etc.) and projects.

## 📁 Structure

```
.agents/
├── core/                    # Fundamental agents
│   ├── symfony-ddd-agent-v1.0.md
│   ├── react-typescript-agent-v1.0.md
│   └── git-workflow-agent-v1.0.md
│
├── development/             # Development workflow agents
│   ├── testing-agent-v1.0.md
│   └── api-development-agent-v1.0.md
│
├── integration/             # Integration agents
│   └── (future integrations)
│
└── project-specific/        # Project-specific agents
    ├── myphysio-agent-v1.0.md
    └── myphysio-specifications-agent-v1.0.md
```

## 🎯 Purpose

**Agents** are high-level instructions that define:
- Development workflows and methodologies
- Coding standards and best practices
- Architecture patterns and principles
- Testing strategies
- Git workflows and conventions

## 🔍 Agent Categories

### Core Agents
Fundamental agents that define core development practices:
- **Symfony DDD Agent**: Domain-Driven Design patterns for Symfony applications
- **React TypeScript Agent**: Modern React development with TypeScript best practices
- **Git Workflow Agent**: Conventional commits, branching strategies, and version control

### Development Agents
Agents focused on development workflows:
- **Testing Agent**: E2E (Playwright), Unit (PHPUnit), and integration testing conventions
- **API Development Agent**: RESTful API design with API Platform

### Project-Specific Agents
Agents tailored to specific projects:
- **MyPhysio Agent**: Complete development guide for the MyPhysio physiotherapy clinic management system
- **MyPhysio Specifications Agent**: Documentation maintenance and reverse engineering guidelines

## 🚀 How to Use

### 1. With Claude Code (Anthropic)
```bash
# Use via symlink
cd claude-agents/
cat core/symfony-ddd-agent-v1.0.md

# Or directly
cd .agents/
cat core/symfony-ddd-agent-v1.0.md
```

### 2. With Gemini (Google)
```bash
# Use via symlink
cd gemini-agents/
cat development/testing-agent-v1.0.md
```

### 3. With OpenAI/ChatGPT
```bash
# Use via symlink
cd openai-agents/
cat core/react-typescript-agent-v1.0.md
```

### 4. Programmatically
```python
# Example: Load agent in Python
with open('.agents/core/symfony-ddd-agent-v1.0.md', 'r') as f:
    agent_instructions = f.read()
    # Pass to LLM API...
```

## 📋 File Format

All agent files follow this structure:

```markdown
---
type: agent
category: core|development|integration|project-specific
version: X.Y.Z
status: production|beta|experimental
compatibility:
  llms: [claude, gemini, openai]
  frameworks: [symfony, react, etc.]
dependencies: []
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: Team Name
license: MIT
---

# Agent Name

## Persona
[Define the agent's role and expertise]

## Responsibilities
[What the agent should do]

## Operational Mandate
[Critical rules and validation steps]

## Principles
[Core development principles]

## Standards
[Coding standards, conventions, patterns]

## Workflows
[Step-by-step workflows for common tasks]
```

## 🔗 Multi-LLM Compatibility

This directory is the **single source of truth** for agent instructions. Symlinks provide compatibility:

| LLM Provider | Symlink Path | Target |
|-------------|-------------|--------|
| Claude | `claude-agents/` | `.agents/` |
| Gemini | `gemini-agents/` | `.agents/` |
| OpenAI | `openai-agents/` | `.agents/` |
| Generic | `agents/` | `.agents/` |

**Benefits:**
- ✅ Zero duplication - one file, multiple references
- ✅ Centralized updates - edit once, available everywhere
- ✅ Cross-platform compatibility
- ✅ Easy migration between LLM providers

## 🆕 Adding New Agents

### 1. Create the Agent File
```bash
# Follow naming convention: {category}-{name}-v{version}.md
vim .agents/core/new-agent-v1.0.md
```

### 2. Add Metadata
Use the metadata script:
```bash
./scripts/add-metadata.sh
```

### 3. Validate Structure
```bash
./scripts/validate-structure.sh
```

### 4. Test with LLM
```bash
# Test via symlink
cat claude-agents/core/new-agent-v1.0.md
```

## 📊 Dependencies

Agents may depend on **skills** (see `.skills/` directory):
- Agents define high-level workflows
- Skills provide specific implementation patterns
- Agents reference skills in their metadata

Example:
```yaml
dependencies:
  - .skills/core/cqrs-pattern-v1.0.md
  - .skills/advanced/validation-mapping-v1.0.md
```

## 🎓 Best Practices

### When to Create an Agent
- ✅ Defining a complete development workflow
- ✅ Establishing project-wide standards
- ✅ Providing role-based instructions (e.g., "Senior Backend Engineer")
- ✅ Combining multiple skills into a cohesive approach

### When to Create a Skill Instead
- Use `.skills/` for specific, reusable implementation patterns
- Skills are building blocks; agents orchestrate them

### Versioning
- **Major (X.0.0)**: Breaking changes to agent instructions
- **Minor (0.X.0)**: New sections or significant additions
- **Patch (0.0.X)**: Clarifications, typo fixes, minor updates

### Naming Conventions
```
{category}-{descriptive-name}-v{major}.{minor}.md

Examples:
- core-symfony-ddd-agent-v1.0.md
- development-testing-agent-v1.0.md
- project-specific-myphysio-agent-v1.0.md
```

## 🔧 Maintenance

### Update Metadata
```bash
# Update all agent metadata
./scripts/add-metadata.sh --force
```

### Validate Integrity
```bash
# Check structure and symlinks
./scripts/validate-structure.sh --verbose
```

### Archive Old Versions
```bash
# Move to archive when creating new major version
mkdir -p .agents/archive/
mv .agents/core/old-agent-v1.0.md .agents/archive/
```

## 📚 Related Documentation

- **Skills Library**: [.skills/README.md](../.skills/README.md)
- **Project Documentation**: [docs/README.md](../docs/README.md)
- **Master Index**: [docs/index.md](../docs/index.md)

## 🤝 Contributing

1. **Create** new agent with proper metadata
2. **Validate** structure with validation script
3. **Test** with at least one LLM provider
4. **Document** dependencies and compatibility
5. **Commit** with conventional commit message

## 📞 Support

For questions or issues:
1. Review existing agents in `core/` and `development/`
2. Check [docs/index.md](../docs/index.md) for architecture overview
3. Run `./scripts/validate-structure.sh` to diagnose problems

---

**Last Updated**: 2026-01-09
**Structure Version**: 1.0.0
**Maintained By**: MyPhysio Team
