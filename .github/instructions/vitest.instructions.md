---
name: 'Vitest instructions'
description: 'Use when you create or update Vitest unit tests'
applyTo: '**/*.spec.ts'
---
# Vitest Instructions

Model every spec on `src/release/release-packages/releasePackages.spec.ts`.

## Structure

- Name the file `<source>.spec.ts` and place it next to the source. Keep `.js` extensions on relative imports.
- Use Vitest globals without importing them.
- Order the file: imports (collaborators, blank line, unit under test), fixtures and mocks, helper factories, `describe` tree.
- Name the top-level `describe` after the unit. Nest `describe` blocks by method or behavior.
- Start each `it` title with `should` plus an action verb that names the observable outcome.
- Test one behavior per `it`. Use no conditional logic. Cover every source branch with its own `it`, or with `it.each` when branches share one behavior and differ only in input.

## Mocks

- Mock every project module the unit imports with `vi.mock('<path>.js', factory)` at module level. Group one block per collaborator, in import order. Never mock the unit.
- Give each factory a working default: `vi.fn(() => value)`. Mock classes with `vi.fn(class { prop = VALUE })`.
- Declare constants that a factory uses with `vi.hoisted`, directly above that mock.
- Access mocks through `vi.mocked(fn)`.
- Override one call with `mockReturnValueOnce` or `mockImplementationOnce`. Use `beforeEach` only for defaults that a single suite needs.
- Skip `vi.clearAllMocks` and `vi.resetAllMocks`. The vitest preset clears mocks.

## Fixtures and assertions

- Declare shared fixtures as `UPPER_SNAKE_CASE` constants. Cast partial fixtures with `as unknown as Type`.
- Compare objects with `toStrictEqual`.
- Verify a single call with `toHaveBeenCalledExactlyOnceWith`. Verify repeated calls with `toHaveBeenCalledTimes` plus `toHaveBeenNthCalledWith`.
- Assert skipped side effects with `not.toHaveBeenCalled`.
- Assert the unit's output or side effects, never the mock you just configured.