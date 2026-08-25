import type { Mock } from 'vitest';
import { ZodError, type ZodType, type z } from 'zod';

import type { ParsedCommit, ParsedCommits } from '../../parse-commits/CommitsParser.js';
import { commitSchema } from '../schemas/commit.js';
import { BaseCommitsValidator, type BaseCommitsValidatorOptions } from './BaseCommitsValidator.js';

// Note: exported for unit testing purposes in subclasses
export const BASE_PARSED_COMMIT = {
  hash: 'abc123',
  merge: null,
  revert: null,
  header: 'feat(packageOne): add new feature',
  scope: 'packageOne',
  type: 'feat',
  subject: 'add new feature',
  body: 'This is the body of the commit message.',
  footer: null,
  notes: [],
  mentions: [],
  references: [],
} satisfies ParsedCommit;

class TestableBaseCommitsValidator extends BaseCommitsValidator {
  constructor({ onError }: BaseCommitsValidatorOptions = {}) {
    super({ onError });
  }

  *publicValidateCommitsBySchema<Schema extends ZodType>(
    parsedCommits: ParsedCommits,
    schema: Schema,
  ): Iterable<z.infer<Schema>> {
    yield* this.validateCommitsBySchema(parsedCommits, schema);
  }
}

describe('BaseCommitsValidator', () => {
  let onError: Mock;

  beforeEach(() => {
    onError = vi.fn();
  });

  it('should validate commits and yield valid commits', () => {
    const testableBaseCommitsValidator = new TestableBaseCommitsValidator({ onError });

    const result = [...testableBaseCommitsValidator.publicValidateCommitsBySchema(
      [BASE_PARSED_COMMIT],
      commitSchema,
    )];

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual(BASE_PARSED_COMMIT);
  });

  it('should handle errors when the validation of a commit fails', () => {
    const validCommit = BASE_PARSED_COMMIT;
    const invalidCommit = { ...BASE_PARSED_COMMIT, hash: 1234 };

    const result = [...new TestableBaseCommitsValidator({ onError }).publicValidateCommitsBySchema(
      // @ts-expect-error -- Intentionally passing an invalid commit to test error handling
      [validCommit, invalidCommit],
      commitSchema,
    )];

    expect(result).toHaveLength(1);
    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(String), {
      commit: invalidCommit,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Expects a validation error
      error: expect.any(ZodError),
    });
  });
});
