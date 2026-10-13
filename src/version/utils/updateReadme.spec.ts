import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { updateReadme } from './updateReadme.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('@/shared/error/logError.js');

const PACKAGE_PATH = join('path', 'to', 'package');
const README_PATH = join(PACKAGE_PATH, 'README.md');

const mockOnError = vi.fn();

describe('updateReadme', () => {
  it('should update README with new version by default', () => {
    vi.mocked(readFileSync).mockReturnValue('# Package\n\nVersion: 1.1.0\n\n');

    updateReadme(PACKAGE_PATH, '1.2.0', { onError: mockOnError });

    expect(writeFileSync).toHaveBeenCalledWith(
      README_PATH,
      '# Package\n\nVersion: 1.2.0\n\n',
      'utf-8',
    );
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should replace first semver match in README', () => {
    const NEW_VERSION = '1.1.0';
    vi.mocked(readFileSync).mockReturnValue('Version 1.0.0 - depends on lib 3.4.5');

    updateReadme(PACKAGE_PATH, NEW_VERSION);

    expect(writeFileSync).toHaveBeenCalledWith(
      README_PATH,
      `Version ${NEW_VERSION} - depends on lib 3.4.5`,
      'utf-8',
    );
  });

  it('should log an error if readFileSync Fails fails', () => {
    const ERROR = new Error('read error');
    vi.mocked(readFileSync).mockImplementation((): never => {
      throw ERROR;
    });

    updateReadme('some path', '1.0.0', { onError: mockOnError });
    expect(readFileSync).toHaveBeenCalledOnce();
    expect(mockOnError).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      { error: ERROR },
    );
  });

  it('should log an error if writeFileSync fails', () => {
    const ERROR = new Error('write error');
    vi.mocked(readFileSync).mockReturnValue('Version 1.0.0');
    vi.mocked(writeFileSync).mockImplementation((): never => {
      throw ERROR;
    });

    updateReadme('some path', '1.0.0', { onError: mockOnError });
    expect(writeFileSync).toHaveBeenCalledOnce();
    expect(mockOnError).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      { error: ERROR },
    );
  });
});
