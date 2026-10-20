---
name: 'Vitest instructions'
description: 'Use when you create or update Vitest unit tests'
applyTo: '**/*.spec.ts'
---
# Vitest Instructions

- Use Vitest globals (`describe`, `it`, `expect`, `vi`) without importing them.
- Colocate each test as `<source>.test.ts`.
- Name the top-level `describe` after the unit. Nest `describe` blocks by method or behavior.
- Start every `it` title with `should` plus an action verb. Describe the observable outcome.
- Mock modules with `vi.mock('@/...', factory)` at module level. Access mocks through `vi.mocked(fn)`.
- Declare default mock behavior in the factory, so every test starts with a working mock: `vi.fn(() => '')`. Share mock references with the factory through `vi.hoisted`.
- Override single calls with `mockReturnValueOnce` or `mockImplementationOnce`. Use `beforeEach` only for defaults that one suite needs.
- Cast partial fixtures with `as unknown as Type`. Use `satisfies Type` for complete fixtures.
- Declare shared fixtures as `UPPER_SNAKE_CASE` module constants. Place helper factories above the first `describe`.
- Compare objects with `toStrictEqual`. Verify single calls with `toHaveBeenCalledExactlyOnceWith`.
- Verify wrapped errors with `toThrow(expect.objectContaining({ cause: err }))`.
- Assert skipped side effects with `not.toHaveBeenCalled`.
- Write every title, comment, and sentence in active voice. Never use the verb "to be".