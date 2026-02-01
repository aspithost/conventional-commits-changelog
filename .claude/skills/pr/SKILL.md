---
name: pr
description: Create a GitHub pull request for the current branch
---

# Pull Request Skill

Create a GitHub pull request for the current branch.

## Instructions

1. Run `git status` to check for uncommitted changes
2. Run `git branch --show-current` to get current branch name
3. Run `git log main..HEAD --oneline` to see all commits in this branch (adjust base branch if needed)
4. Run `git diff main...HEAD` to see all changes vs main branch
5. Check if branch is pushed: `git rev-parse --abbrev-ref @{upstream}`
6. If not pushed, push with: `git push -u origin <branch-name>`
7. Create PR using `gh pr create` with this format:

```bash
gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## Summary
- Bullet points describing the changes

## Test plan
- [ ] How to test these changes

---
EOF
)"
```

8. Return the PR URL when complete
