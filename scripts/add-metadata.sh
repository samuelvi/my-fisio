#!/bin/bash
#
# add-metadata.sh - Adds YAML metadata headers to agent/skill files
#
# Purpose: Automatically adds standardized metadata to .agents/ and .skills/ files
#
# Usage:
#   ./scripts/add-metadata.sh [--dry-run] [--force]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DRY_RUN=false
FORCE=false
PROCESSED=0
SKIPPED=0

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# FUNCTIONS
# ============================================================================

has_metadata() {
    local file="$1"
    head -1 "${file}" | grep -q "^---$"
}

get_file_type() {
    local file="$1"
    local basename
    basename=$(basename "${file}")

    if [[ "${file}" == *".agents/"* ]]; then
        echo "agent"
    elif [[ "${file}" == *".skills/"* ]]; then
        echo "skill"
    else
        echo "unknown"
    fi
}

get_category() {
    local file="$1"

    if [[ "${file}" == *"/core/"* ]]; then
        echo "core"
    elif [[ "${file}" == *"/development/"* ]]; then
        echo "development"
    elif [[ "${file}" == *"/integration/"* ]]; then
        echo "integration"
    elif [[ "${file}" == *"/advanced/"* ]]; then
        echo "advanced"
    elif [[ "${file}" == *"/domain/"* ]]; then
        echo "domain"
    elif [[ "${file}" == *"/project-specific/"* ]]; then
        echo "project-specific"
    else
        echo "uncategorized"
    fi
}

extract_version() {
    local file="$1"
    local basename
    basename=$(basename "${file}")

    if [[ "${basename}" =~ -v([0-9]+\.[0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}.0"
    else
        echo "1.0.0"
    fi
}

generate_metadata() {
    local file="$1"
    local file_type
    local category
    local version
    local status="production"

    file_type=$(get_file_type "${file}")
    category=$(get_category "${file}")
    version=$(extract_version "${file}")

    # Determine status based on category
    if [[ "${category}" == "experimental" ]]; then
        status="experimental"
    elif [[ "${category}" == "project-specific" ]]; then
        status="production"
    fi

    cat << EOF
---
type: ${file_type}
category: ${category}
version: ${version}
status: ${status}
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
created: $(date +%Y-%m-%d)
updated: $(date +%Y-%m-%d)
author: MyPhysio Team
license: MIT
description: |
  Auto-generated metadata. Update description with actual content summary.
---

EOF
}

add_metadata_to_file() {
    local file="$1"

    if has_metadata "${file}"; then
        if [[ "${FORCE}" != "true" ]]; then
            echo -e "${YELLOW}⊘${NC} Skipped (has metadata): ${file}"
            ((SKIPPED++))
            return 0
        fi
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
        echo -e "${BLUE}ℹ${NC} [DRY-RUN] Would add metadata to: ${file}"
        ((PROCESSED++))
        return 0
    fi

    # Create backup
    cp "${file}" "${file}.bak"

    # Generate and prepend metadata
    local metadata
    metadata=$(generate_metadata "${file}")

    # If file already has metadata and --force is used, remove old metadata
    if [[ "${FORCE}" == "true" ]] && has_metadata "${file}"; then
        # Remove everything up to and including the second ---
        sed -i.tmp '1,/^---$/d; 1,/^---$/d' "${file}"
        rm -f "${file}.tmp"
    fi

    # Prepend new metadata
    echo "${metadata}" | cat - "${file}" > "${file}.new"
    mv "${file}.new" "${file}"

    # Remove backup if successful
    rm -f "${file}.bak"

    echo -e "${GREEN}✓${NC} Added metadata: ${file}"
    ((PROCESSED++))
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
            --force|-f)
                FORCE=true
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
    echo "  ADDING METADATA TO AGENT/SKILL FILES"
    echo "========================================================================="
    echo ""

    if [[ "${DRY_RUN}" == "true" ]]; then
        echo -e "${YELLOW}⚠${NC} DRY-RUN MODE - No changes will be made"
        echo ""
    fi

    cd "${PROJECT_ROOT}"

    # Process all .md files in .agents/ and .skills/
    while IFS= read -r -d '' file; do
        # Skip README.md files
        if [[ "$(basename "${file}")" == "README.md" ]]; then
            continue
        fi

        add_metadata_to_file "${file}"
    done < <(find .agents .skills -type f -name "*.md" -print0 2>/dev/null)

    echo ""
    echo "========================================================================="
    echo "  SUMMARY"
    echo "========================================================================="
    echo ""
    echo "Processed: ${PROCESSED} files"
    echo "Skipped:   ${SKIPPED} files"
    echo ""

    if [[ "${DRY_RUN}" == "true" ]]; then
        echo "Run without --dry-run to apply changes"
    else
        echo -e "${GREEN}✓${NC} Metadata addition complete!"
    fi
    echo ""
}

main "$@"
