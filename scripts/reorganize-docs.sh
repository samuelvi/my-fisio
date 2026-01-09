#!/bin/bash
#
# reorganize-docs.sh - Professional Documentation Reorganization Script
#
# Purpose: Reorganizes documentation into .agents/ and .skills/ structure
#          with multi-LLM compatibility via symlinks
#
# Usage:
#   ./scripts/reorganize-docs.sh [--dry-run] [--verbose] [--no-backup]
#
# Options:
#   --dry-run     Show what would be done without making changes
#   --verbose     Enable detailed logging
#   --no-backup   Skip backup creation (not recommended)
#   --help        Show this help message
#

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backup-docs-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${PROJECT_ROOT}/reorganize-docs.log"

DRY_RUN=false
VERBOSE=false
CREATE_BACKUP=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

info() {
    if [[ "${VERBOSE}" == "true" ]] || [[ "$1" != "-v" ]]; then
        log "INFO" "$@"
        echo -e "${BLUE}ℹ${NC} $*"
    fi
}

success() {
    log "SUCCESS" "$@"
    echo -e "${GREEN}✓${NC} $*"
}

warn() {
    log "WARN" "$@"
    echo -e "${YELLOW}⚠${NC} $*" >&2
}

error() {
    log "ERROR" "$@"
    echo -e "${RED}✗${NC} $*" >&2
}

fatal() {
    error "$@"
    exit 1
}

show_help() {
    sed -n '2,/^$/p' "$0" | sed 's/^# //; s/^#//'
    exit 0
}

# ============================================================================
# VALIDATION
# ============================================================================

validate_environment() {
    info "Validating environment..."

    # Check we're in the right directory
    if [[ ! -f "${PROJECT_ROOT}/composer.json" ]] || [[ ! -f "${PROJECT_ROOT}/package.json" ]]; then
        fatal "Not in project root directory. Expected composer.json and package.json"
    fi

    # Check docs directory exists
    if [[ ! -d "${PROJECT_ROOT}/docs" ]]; then
        fatal "docs/ directory not found"
    fi

    # Check required tools
    for cmd in rsync mkdir ln; do
        if ! command -v "${cmd}" &> /dev/null; then
            fatal "Required command '${cmd}' not found"
        fi
    done

    success "Environment validation passed"
}

# ============================================================================
# BACKUP
# ============================================================================

create_backup() {
    if [[ "${CREATE_BACKUP}" != "true" ]]; then
        warn "Skipping backup (--no-backup flag set)"
        return 0
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
        info "[DRY-RUN] Would create backup at: ${BACKUP_DIR}"
        return 0
    fi

    info "Creating backup at: ${BACKUP_DIR}"

    mkdir -p "${BACKUP_DIR}"

    # Backup docs directory
    if [[ -d "${PROJECT_ROOT}/docs" ]]; then
        rsync -a "${PROJECT_ROOT}/docs/" "${BACKUP_DIR}/docs/"
    fi

    # Backup existing .agents/ and .skills/ if they exist
    for dir in .agents .skills; do
        if [[ -d "${PROJECT_ROOT}/${dir}" ]]; then
            rsync -a "${PROJECT_ROOT}/${dir}/" "${BACKUP_DIR}/${dir}/"
        fi
    done

    success "Backup created at: ${BACKUP_DIR}"
    echo "export BACKUP_DIR='${BACKUP_DIR}'" > "${PROJECT_ROOT}/.last-backup"
}

# ============================================================================
# DIRECTORY CREATION
# ============================================================================

create_directory_structure() {
    info "Creating directory structure..."

    local dirs=(
        ".agents"
        ".agents/core"
        ".agents/development"
        ".agents/integration"
        ".agents/project-specific"
        ".skills"
        ".skills/core"
        ".skills/advanced"
        ".skills/integration"
        ".skills/domain"
        "docs/architecture"
        "docs/features"
        "docs/operations"
        "docs/guides"
        "docs/archive"
        "scripts"
    )

    for dir in "${dirs[@]}"; do
        if [[ "${DRY_RUN}" == "true" ]]; then
            info "[DRY-RUN] Would create: ${PROJECT_ROOT}/${dir}"
        else
            mkdir -p "${PROJECT_ROOT}/${dir}"
            info "Created: ${dir}/"
        fi
    done

    success "Directory structure created"
}

# ============================================================================
# FILE OPERATIONS
# ============================================================================

move_file() {
    local src="$1"
    local dest="$2"
    local description="${3:-}"

    if [[ ! -f "${src}" ]]; then
        warn "Source file not found: ${src}"
        return 1
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
        info "[DRY-RUN] Would move: ${src} → ${dest}"
        if [[ -n "${description}" ]]; then
            info "           ${description}"
        fi
        return 0
    fi

    # Create destination directory if needed
    local dest_dir
    dest_dir=$(dirname "${dest}")
    mkdir -p "${dest_dir}"

    # Move file
    mv "${src}" "${dest}"
    info "Moved: $(basename "${src}") → ${dest}"
}

copy_file() {
    local src="$1"
    local dest="$2"

    if [[ ! -f "${src}" ]]; then
        warn "Source file not found: ${src}"
        return 1
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
        info "[DRY-RUN] Would copy: ${src} → ${dest}"
        return 0
    fi

    local dest_dir
    dest_dir=$(dirname "${dest}")
    mkdir -p "${dest_dir}"

    cp "${src}" "${dest}"
    info "Copied: $(basename "${src}") → ${dest}"
}

# ============================================================================
# REORGANIZATION
# ============================================================================

reorganize_files() {
    info "Reorganizing files..."

    cd "${PROJECT_ROOT}"

    # Move agent files
    move_file \
        "docs/AGENTS.md" \
        ".agents/project-specific/myphysio-agent-v1.0.md" \
        "Main project agent"

    move_file \
        "docs/AGENTS_TESTING.md" \
        ".agents/development/testing-agent-v1.0.md" \
        "Testing agent"

    if [[ -f "docs/specifications/AGENTS.md" ]]; then
        move_file \
            "docs/specifications/AGENTS.md" \
            ".agents/project-specific/myphysio-specifications-agent-v1.0.md" \
            "Specifications agent"
    fi

    # Move documentation files
    move_file "docs/DATABASE_SCHEMA.md" "docs/architecture/database-schema.md"
    move_file "docs/AUDIT_SYSTEM.md" "docs/features/audit-system.md"
    move_file "docs/AUDIT_EXAMPLES.md" "docs/features/audit-examples.md"
    move_file "docs/AUDIT_README.md" "docs/guides/audit-readme.md"
    move_file "docs/DRAFT_SYSTEM.md" "docs/features/draft-system.md"
    move_file "docs/INSTALLATION.md" "docs/operations/installation.md"
    move_file "docs/DEPLOYMENT.md" "docs/operations/deployment.md"

    # Copy architecture docs from specifications
    if [[ -f "docs/specifications/04-SYSTEM-ARCHITECTURE.md" ]]; then
        copy_file \
            "docs/specifications/04-SYSTEM-ARCHITECTURE.md" \
            "docs/architecture/system-architecture.md"
    fi

    if [[ -f "docs/specifications/06-DATA-MODEL.md" ]]; then
        copy_file \
            "docs/specifications/06-DATA-MODEL.md" \
            "docs/architecture/data-model.md"
    fi

    success "Files reorganized"
}

# ============================================================================
# SYMLINK CREATION
# ============================================================================

create_symlinks() {
    info "Creating LLM compatibility symlinks..."

    cd "${PROJECT_ROOT}"

    local symlinks=(
        "claude-agents:.agents:Claude (Anthropic)"
        "claude-skills:.skills:Claude (Anthropic)"
        "gemini-agents:.agents:Gemini (Google)"
        "gemini-skills:.skills:Gemini (Google)"
        "openai-agents:.agents:OpenAI/ChatGPT"
        "openai-skills:.skills:OpenAI/ChatGPT"
        "agents:.agents:Generic agents"
        "skills:.skills:Generic skills"
    )

    for entry in "${symlinks[@]}"; do
        IFS=':' read -r link_name target description <<< "${entry}"

        if [[ "${DRY_RUN}" == "true" ]]; then
            info "[DRY-RUN] Would create symlink: ${link_name} → ${target} (${description})"
            continue
        fi

        # Remove existing symlink/directory
        if [[ -L "${link_name}" ]] || [[ -d "${link_name}" ]]; then
            rm -rf "${link_name}"
        fi

        # Create symlink
        ln -s "${target}" "${link_name}"
        info "Created symlink: ${link_name} → ${target} (${description})"
    done

    success "Symlinks created"
}

# ============================================================================
# SKILL EXTRACTION (PLACEHOLDER)
# ============================================================================

extract_skills() {
    info "Skill extraction will be done in a separate step"
    info "Run: ./scripts/extract-skills.sh after this reorganization completes"
    warn "Manual extraction of skills from AGENTS.md is required"
}

# ============================================================================
# POST-REORGANIZATION
# ============================================================================

create_gitignore_updates() {
    local gitignore_additions="${PROJECT_ROOT}/.gitignore.additions"

    if [[ "${DRY_RUN}" == "true" ]]; then
        info "[DRY-RUN] Would create .gitignore.additions"
        return 0
    fi

    cat > "${gitignore_additions}" << 'EOF'
# ============================================================================
# LLM Documentation Structure
# ============================================================================
#
# These symlinks provide multi-LLM compatibility
# Keep them in git for portability across environments
#
# If you want to exclude them, uncomment the lines below:
# claude-agents
# claude-skills
# gemini-agents
# gemini-skills
# openai-agents
# openai-skills
# agents
# skills

# Backup directories
backup-docs-*/

# Reorganization logs
reorganize-docs.log
.last-backup
EOF

    success "Created .gitignore.additions - review and merge manually"
}

# ============================================================================
# SUMMARY
# ============================================================================

print_summary() {
    echo ""
    echo "========================================================================="
    echo "  REORGANIZATION COMPLETE"
    echo "========================================================================="
    echo ""
    echo "📁 New Structure:"
    echo "   .agents/          - Reusable agent instructions"
    echo "   .skills/          - Reusable skill library"
    echo "   docs/             - Project-specific documentation"
    echo ""
    echo "🔗 Symlinks Created:"
    echo "   claude-agents/    → .agents/"
    echo "   claude-skills/    → .skills/"
    echo "   gemini-agents/    → .agents/"
    echo "   gemini-skills/    → .skills/"
    echo "   openai-agents/    → .agents/"
    echo "   openai-skills/    → .skills/"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Review moved files: tree .agents .skills docs"
    echo "   2. Add metadata to files: ./scripts/add-metadata.sh"
    echo "   3. Extract skills: ./scripts/extract-skills.sh"
    echo "   4. Create READMEs: ./scripts/create-readmes.sh"
    echo "   5. Validate structure: ./scripts/validate-structure.sh"
    echo "   6. Review .gitignore.additions and merge to .gitignore"
    echo "   7. Commit changes: git add -A && git commit"
    echo ""

    if [[ "${CREATE_BACKUP}" == "true" ]] && [[ -d "${BACKUP_DIR}" ]]; then
        echo "💾 Backup Location:"
        echo "   ${BACKUP_DIR}"
        echo "   To rollback: rm -rf docs .agents .skills && mv ${BACKUP_DIR}/* ."
        echo ""
    fi

    echo "📊 Statistics:"
    if [[ "${DRY_RUN}" != "true" ]]; then
        echo "   Agents:  $(find .agents -type f -name "*.md" 2>/dev/null | wc -l) files"
        echo "   Skills:  $(find .skills -type f -name "*.md" 2>/dev/null | wc -l) files"
        echo "   Docs:    $(find docs -type f -name "*.md" 2>/dev/null | wc -l) files"
    else
        echo "   (DRY-RUN mode - no actual changes made)"
    fi
    echo ""
    echo "========================================================================="
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --no-backup)
                CREATE_BACKUP=false
                shift
                ;;
            --help|-h)
                show_help
                ;;
            *)
                error "Unknown option: $1"
                show_help
                ;;
        esac
    done

    # Initialize log
    echo "=========================================================================" > "${LOG_FILE}"
    echo "Documentation Reorganization Log - $(date)" >> "${LOG_FILE}"
    echo "=========================================================================" >> "${LOG_FILE}"

    if [[ "${DRY_RUN}" == "true" ]]; then
        warn "DRY-RUN MODE - No changes will be made"
    fi

    # Execute reorganization
    validate_environment
    create_backup
    create_directory_structure
    reorganize_files
    create_symlinks
    extract_skills
    create_gitignore_updates
    print_summary

    success "Reorganization completed successfully!"

    if [[ "${DRY_RUN}" == "true" ]]; then
        echo ""
        warn "This was a DRY-RUN. No changes were made."
        echo "Run without --dry-run to apply changes."
    fi
}

# Run main function
main "$@"
