import type { BaseReleaseOptions } from '../schemas/releaseOptions.js';

import { validateReleaseInput } from './validateReleaseInput.js';

const VALID_OPTIONS: BaseReleaseOptions = {
  directoryPath: '/path/to/package',
  isDryRun: true,
  releaseType: 'minor',
};

describe('validateReleaseInput', () => {
  describe('valid options', () => {
    it('should not throw an error when the user provides valid release input parameters', () => {
      expect(() => { validateReleaseInput(VALID_OPTIONS); }).not.toThrow();
    });
  });

  describe('invalid options', () => {
    it('should throw an error when the user provides invalid release input parameters', () => {
      const INVALID_OPTIONS = {
        ...VALID_OPTIONS,
        releaseVersion: 'v1.2.3',
      };

      expect(() => { validateReleaseInput(INVALID_OPTIONS); }).toThrow(
        expect.objectContaining({
          message: 'Validation error: invalid release options',
        }),
      );
    });
  });
});
