---
name: review-branch
description: Use when asked to review the current branch against a target branch. The target defaults to main.
---
# Review branch against target

1. Set the target to the user's branch name, or `main` when they give none.
2. Run `git fetch origin <target>`, then `git diff origin/<target>...HEAD`. The three-dot form shows only this branch's changes.
3. Run `git log origin/<target>..HEAD --format=%s` and check each subject against the Commits rules in [copilot-instructions.md](../../copilot-instructions.md).
4. Load the [review-code](../review-code/SKILL.md) skill and apply it to the diff.