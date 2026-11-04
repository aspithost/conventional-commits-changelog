---
name: review-staged
description: Use when asked to review staged changes, or changes about to be committed.
---
# Review staged changes

1. Run `git diff --staged`. If the diff stays empty, tell the user nothing sits staged and stop.
2. Load the [review-code](../review-code/SKILL.md) skill and apply it to the diff.
3. Check the pending commit message against the Commits rules in [copilot-instructions.md](../../copilot-instructions.md) when the user supplies one.