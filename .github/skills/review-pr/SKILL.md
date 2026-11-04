---
name: review-pr
description: Use when asked to review a pull request, by number, URL, or the current branch's PR.
---
# Review pull request

1. Resolve the PR. Use the given number or URL, or run `gh pr view --json number` for the current branch.
2. Run `gh pr view <pr> --json title,body,commits,baseRefName` and `gh pr diff <pr>`.
3. Check the PR title against the Commits rules in [copilot-instructions.md](../../copilot-instructions.md), since squash merges use it as the commit message.
4. Check that the description explains the change and links its issue, if one exists.
5. Load the [review-code](../review-code/SKILL.md) skill and apply it to the diff.
6. Run `gh pr checks <pr>` and report failing checks as `blocker`.
7. Never post comments or submit a review unless the user asks.