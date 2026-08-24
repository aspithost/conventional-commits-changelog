import { logError } from './logError.js';

describe('logError', () => {
  it('should log the error message and error object to the console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockReturnValue(undefined);

    const errorMessage = 'Test error message';
    const errorObject = new Error(errorMessage);

    logError(errorMessage, errorObject);

    expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage, errorObject);
  });
});
