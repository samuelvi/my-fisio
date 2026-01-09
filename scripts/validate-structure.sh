#!/bin/bash
#
# validate-structure.sh - Validates the documentation structure integrity
#
# Purpose: Checks symlinks, file locations, metadata, and structure consistency
#
# Usage:
#   ./scripts/validate-structure.sh [--verbose] [--fix]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

VERBOSE=false
FIX_ISSUES=false
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

info() {
    if [[ "${VERBOSE}" == "true" ]]; then
        echo -e "${BLUE}ℹ${NC} $*"
    fi
}

success() {
    echo -e "${GREEN}✓${NC} $*"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $*" >&2
    ((WARNINGS++))
}

error() {
    echo -e "${RED}✗${NC} $*" >&2
    ((ERRORS++))
}

# ============================================================================
# VALIDATION CHECKS
# ============================================================================

check_directories() {
    echo ""
    echo "📁 Checking directory structure..."

    local required_dirs=(
        ".agents"
        ".agents/core"
        ".agents/development"
        ".agents/project-specific"
        ".skills"
        ".skills/core"
        ".skills/advanced"
        ".skills/integration"
        ".skills/domain"
        "docs/architecture"
        "docs/features"
        "docs/operations"
        "docs/specifications"
    )

    for dir in "${required_dirs[@]}"; do
        if [[ -d "${PROJECT_ROOT}/${dir}" ]]; then
            info "Found: ${dir}/"
        else
            error "Missing directory: ${dir}/"
        fi
    done

    if [[ ${ERRORS} -eq 0 ]]; then
        success "All required directories exist"
    fi
}

check_symlinks() {
    echo ""
    echo "🔗 Checking symlinks..."

    local expected_symlinks=(
        "claude-agents:.agents"
        "claude-skills:.skills"
        "gemini-agents:.agents"
        "gemini-skills:.skills"
        "openai-agents:.agents"
        "openai-skills:.skills"
    )

    cd "${PROJECT_ROOT}"

    for entry in "${expected_symlinks[@]}"; do
        IFS=':' read -r link_name target <<< "${entry}"

        if [[ -L "${link_name}" ]]; then
            local actual_target
            actual_target=$(readlink "${link_name}")

            if [[ "${actual_target}" == "${target}" ]]; then
                info "Valid symlink: ${link_name} → ${target}"
            else
                error "Invalid symlink: ${link_name} → ${actual_target} (expected: ${target})"

                if [[ "${FIX_ISSUES}" == "true" ]]; then
                    rm "${link_name}"
                    ln -s "${target}" "${link_name}"
                    success "Fixed: ${link_name} → ${target}"
                fi
            fi
        else
            error "Missing symlink: ${link_name}"

            if [[ "${FIX_ISSUES}" == "true" ]]; then
                ln -s "${target}" "${link_name}"
                success "Created: ${link_name} → ${target}"
            fi
        fi
    done

    if [[ ${ERRORS} -eq 0 ]]; then
        success "All symlinks valid"
    fi
}

check_symlink_targets() {
    echo ""
    echo "🎯 Checking symlink targets..."

    cd "${PROJECT_ROOT}"

    for link in *-agents *-skills agents skills; do
        if [[ -L "${link}" ]]; then
            local target
            target=$(readlink "${link}")

            if [[ ! -d "${target}" ]]; then
                error "Broken symlink: ${link} → ${target} (target does not exist)"
            else
                info "Valid: ${link} → ${target}"
            fi
        fi
    done

    if [[ ${ERRORS} -eq 0 ]]; then
        success "All symlink targets exist"
    fi
}

check_metadata() {
    echo ""
    echo "📋 Checking file metadata..."

    cd "${PROJECT_ROOT}"

    local agent_files
    local skill_files

    agent_files=$(find .agents -type f -name "*.md" 2>/dev/null || true)
    skill_files=$(find .skills -type f -name "*.md" 2>/dev/null || true)

    local files_without_metadata=0

    for file in ${agent_files} ${skill_files}; do
        if head -1 "${file}" | grep -q "^---$"; then
            info "Has metadata: ${file}"
        else
            warn "Missing metadata: ${file}"
            ((files_without_metadata++))
        fi
    done

    if [[ ${files_without_metadata} -eq 0 ]]; then
        success "All files have metadata"
    else
        warn "${files_without_metadata} files missing metadata (run add-metadata.sh)"
    fi
}

check_naming_conventions() {
    echo ""
    echo "📝 Checking naming conventions..."

    cd "${PROJECT_ROOT}"

    local pattern='^(agent|skill)-[a-z0-9-]+-v[0-9]+\.[0-9]+\.md$'
    local non_compliant=0

    for file in .agents/**/*.md .skills/**/*.md; do
        if [[ -f "${file}" ]]; then
            local basename
            basename=$(basename "${file}")

            # Skip README.md files
            if [[ "${basename}" == "README.md" ]]; then
                continue
            fi

            if [[ "${basename}" =~ $pattern ]] || [[ "${basename}" =~ ^myphysio-.*-v[0-9]+\.[0-9]+\.md$ ]]; then
                info "Valid name: ${basename}"
            else
                warn "Non-compliant naming: ${file}"
                ((non_compliant++))
            fi
        fi
    done

    if [[ ${non_compliant} -eq 0 ]]; then
        success "All files follow naming conventions"
    else
        warn "${non_compliant} files don't follow naming conventions"
    fi
}

check_orphaned_files() {
    echo ""
    echo "🔍 Checking for orphaned files..."

    cd "${PROJECT_ROOT}"

    # Check for old files in root docs/
    local old_locations=(
        "docs/AGENTS.md"
        "docs/AGENTS_TESTING.md"
        "docs/DATABASE_SCHEMA.md"
        "docs/AUDIT_SYSTEM.md"
        "docs/DRAFT_SYSTEM.md"
        "docs/INSTALLATION.md"
        "docs/DEPLOYMENT.md"
    )

    local orphaned=0

    for file in "${old_locations[@]}"; do
        if [[ -f "${file}" ]]; then
            warn "Orphaned file (should be moved): ${file}"
            ((orphaned++))
        fi
    done

    if [[ ${orphaned} -eq 0 ]]; then
        success "No orphaned files found"
    fi
}

check_duplicates() {
    echo ""
    echo "🔄 Checking for duplicate content..."

    cd "${PROJECT_ROOT}"

    # Check if old and new locations both exist
    local duplicates=(
        "docs/AGENTS.md:.agents/project-specific/myphysio-agent-v1.0.md"
        "docs/DATABASE_SCHEMA.md:docs/architecture/database-schema.md"
        "docs/AUDIT_SYSTEM.md:docs/features/audit-system.md"
    )

    local found_duplicates=0

    for entry in "${duplicates[@]}"; do
        IFS=':' read -r old_path new_path <<< "${entry}"

        if [[ -f "${old_path}" ]] && [[ -f "${new_path}" ]]; then
            warn "Duplicate content: ${old_path} and ${new_path} both exist"
            ((found_duplicates++))
        fi
    done

    if [[ ${found_duplicates} -eq 0 ]]; then
        success "No duplicate files found"
    fi
}

# ============================================================================
# STATISTICS
# ============================================================================

print_statistics() {
    echo ""
    echo "========================================================================="
    echo "  VALIDATION STATISTICS"
    echo "========================================================================="
    echo ""

    cd "${PROJECT_ROOT}"

    local agent_count
    local skill_count
    local doc_count
    local symlink_count

    agent_count=$(find .agents -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    skill_count=$(find .skills -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    doc_count=$(find docs -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    symlink_count=$(find . -maxdepth 1 -type l \( -name "*-agents" -o -name "*-skills" \) 2>/dev/null | wc -l | tr -d ' ')

    echo "📊 File counts:"
    echo "   Agents:   ${agent_count} files"
    echo "   Skills:   ${skill_count} files"
    echo "   Docs:     ${doc_count} files"
    echo "   Symlinks: ${symlink_count} links"
    echo ""
    echo "📈 Validation results:"
    echo "   Errors:   ${ERRORS}"
    echo "   Warnings: ${WARNINGS}"
    echo ""

    if [[ ${ERRORS} -eq 0 ]] && [[ ${WARNINGS} -eq 0 ]]; then
        echo -e "${GREEN}✓ Structure is valid!${NC}"
    elif [[ ${ERRORS} -eq 0 ]]; then
        echo -e "${YELLOW}⚠ Structure is valid but has warnings${NC}"
    else
        echo -e "${RED}✗ Structure has errors that need fixing${NC}"
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
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --fix)
                FIX_ISSUES=true
                shift
                ;;
            --help|-h)
                sed -n '2,/^$/p' "$0" | sed 's/^# //; s/^#//'
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    echo "========================================================================="
    echo "  DOCUMENTATION STRUCTURE VALIDATION"
    echo "========================================================================="

    # Run all checks
    check_directories
    check_symlinks
    check_symlink_targets
    check_metadata
    check_naming_conventions
    check_orphaned_files
    check_duplicates

    # Print summary
    print_statistics

    # Exit with error code if errors found
    if [[ ${ERRORS} -gt 0 ]]; then
        exit 1
    fi

    exit 0
}

main "$@"
