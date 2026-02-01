---
name: ci
description: Analyze GitHub Actions CI status for the current branch or PR
---

# CI Status Skill

Analyze GitHub Actions CI status for the current branch or PR.

## Instructions

1. Check current branch: `git branch --show-current`
2. Check for open PR on this branch: `gh pr list --head <branch> --json number,title,url`
3. If PR exists, check its CI status: `gh pr checks <pr-number>`
4. List recent workflow runs: `gh run list --branch <branch> --limit 5`
5. For failed runs, get details: `gh run view <run-id>`
6. If a run failed, analyze the logs: `gh run view <run-id> --log-failed`

## Output Format

Provide a summary including:
- **Branch**: current branch name
- **PR**: PR number and title (if exists)
- **CI Status**: passing/failing/pending
- **Failed Jobs**: list any failures with brief error summary
- **Recommendations**: what to fix if there are failures
