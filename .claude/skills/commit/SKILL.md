---
name: commit
description: Create a git commit with staged and unstaged changes using conventional commit format
---

# Commit Skill

Create a git commit with the staged and unstaged changes.

## Instructions

1. Run `git status` to see all changes (do not use -uall flag)
2. Run `git diff` to see unstaged changes and `git diff --cached` for staged changes
3. Run `git log --oneline -5` to see recent commit message style
4. Analyze the changes and draft a concise commit message:
   - Use conventional commit format: `type(scope): description`
   - Types: feat, fix, chore, docs, refactor, test, style, ci
   - Focus on "why" not "what"
   - Do NOT include "Co-Authored-By" lines
5. Stage relevant files (prefer specific files over `git add .`)
6. Activate virtualenv and create the commit: `source venv/Scripts/activate && git commit -m "message"`
7. Show the result with `git status`

## Commit Message Format

```
type(scope): short description

Optional longer description if needed.
```
