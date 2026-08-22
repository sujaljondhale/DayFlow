#!/bin/bash

# =========================================================
# Dayflow HRMS - Hourly Git Sync Script for Hackathons
# =========================================================

echo "----------------------------------------------------"
echo "⏰ Running Hourly Git Push Script for Dayflow HRMS..."
echo "Current Time: $(date)"
echo "----------------------------------------------------"

# Navigate to project root if needed
cd "$(dirname "$0")"

# Check git status
STATUS=$(git status --porcelain)

if [ -z "$STATUS" ]; then
    echo "ℹ️  No changes detected in working tree. Skipping commit."
else
    echo "📦 Staging changes..."
    git add .

    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    COMMIT_MSG="hackathon-sync: hourly backend sync at $TIMESTAMP"

    echo "✍️  Creating commit: '$COMMIT_MSG'"
    git commit -m "$COMMIT_MSG"

    echo "🚀 Pushing to remote branch..."
    git push origin HEAD

    if [ $? -eq 0 ]; then
        echo "✅ Hourly push completed successfully!"
    else
        echo "⚠️  Git push failed. Please check remote repository settings or conflicts."
    fi
fi

echo "----------------------------------------------------"
