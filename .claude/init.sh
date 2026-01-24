#!/bin/bash

# Stonkie Workflow Infrastructure Initialization Script
# Run once to set up the two-agent feature development workflow

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Initializing Stonkie workflow infrastructure..."
echo "Project root: $PROJECT_ROOT"

# Check if already initialized
if [ -f "$SCRIPT_DIR/.initialized" ]; then
    echo "⚠️  Workflow already initialized. Delete .claude/.initialized to re-run."
    exit 0
fi

# 1. Create directory structure
echo "📁 Creating .claude directory structure..."
mkdir -p "$SCRIPT_DIR/templates"
mkdir -p "$SCRIPT_DIR/sessions"  # For future session-specific files

# 2. Initialize features.json
echo "📝 Creating features.json..."
cat > "$SCRIPT_DIR/features.json" << 'EOF'
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-24T00:00:00.000Z",
  "features": []
}
EOF

# 3. Initialize progress.md
echo "📝 Creating progress.md..."
cat > "$SCRIPT_DIR/progress.md" << 'EOF'
# Stonkie Feature Development Progress

This file tracks incremental progress across Claude Code sessions using the two-agent workflow pattern.

## Sessions Log

Sessions appear below in reverse chronological order (newest first).

---
EOF

# 4. Create session startup template
echo "📝 Creating session-startup.md template..."
cat > "$SCRIPT_DIR/templates/session-startup.md" << 'EOF'
# Session Startup Checklist

Execute these steps at the beginning of each coding session (read-only phase).

## 1. Load State
[... template content ...]
EOF

# 5. Create session completion template
echo "📝 Creating session-completion.md template..."
cat > "$SCRIPT_DIR/templates/session-completion.md" << 'EOF'
# Session Completion Checklist

Execute these steps before ending each coding session.

## 1. Verification (Mandatory)
[... template content ...]
EOF

# 6. Update .gitignore
echo "🔧 Updating .gitignore..."
if ! grep -q "^# Claude Code workflow" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    cat >> "$PROJECT_ROOT/.gitignore" << 'EOF'

# Claude Code workflow
.claude/sessions/
.claude/.initialized
EOF
    echo "✓ Added .claude entries to .gitignore"
else
    echo "✓ .gitignore already contains .claude entries"
fi

# 7. Create initialized marker
echo "✅ Creating .initialized marker..."
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$SCRIPT_DIR/.initialized"

echo ""
echo "✅ Workflow infrastructure initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Review files in .claude/ directory"
echo "2. Commit infrastructure: git add .claude/ .gitignore && git commit -m 'Add workflow infrastructure'"
echo "3. Add features to .claude/features.json"
echo "4. Start coding session following .claude/templates/session-startup.md"
echo ""
