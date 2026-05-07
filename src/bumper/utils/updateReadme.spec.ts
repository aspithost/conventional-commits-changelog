import { readFileSync, writeFileSync } from 'node:fs';
import { updateReadme } from './updateReadme.js';
import { join } from 'node:path';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

const PACKAGE_PATH = join('path', 'to', 'package');
const README_PATH = join(PACKAGE_PATH, 'README.md');

describe('updateReadme', () => {
  it('should update README with new version by default', () => {
    vi.mocked(readFileSync).mockReturnValue('# Package\n\nVersion: 1.1.0\n\n');

    updateReadme(PACKAGE_PATH, '1.2.0');

    expect(writeFileSync).toHaveBeenCalledWith(
      README_PATH,
      '# Package\n\nVersion: 1.2.0\n\n',
      'utf-8',
    );
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

  it('should throw an error if readFileSync Fails fails', () => {
    const ERROR = new Error('read error');
    vi.mocked(readFileSync).mockImplementation((): never => {
      throw ERROR;
    });

    expect(() => {
      updateReadme('some path', '1.0.0');
    }).toThrow(ERROR);
    expect(readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if writeFileSync fails', () => {
    const ERROR = new Error('write error');
    vi.mocked(readFileSync).mockReturnValue('Version 1.0.0');
    vi.mocked(writeFileSync).mockImplementation((): never => {
      throw ERROR;
    });

    expect(() => {
      updateReadme('some path', '1.0.0');
    }).toThrow(ERROR);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });
});
