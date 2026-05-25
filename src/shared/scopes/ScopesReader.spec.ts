import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ScopesReader } from './ScopesReader.js';

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const PACKAGE_NAME = 'some-package';
const PACKAGE_JSON = '{"name": "some-package"}';

function createDirent(name: string, isDirectory: boolean) {
  return {
    name,
    isDirectory: () => isDirectory,
  } as never;
}

describe('ScopesReader', () => {
  beforeAll(() => {
    console.error = vi.fn(); // Prevent console.errors from clogging unit test output
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    beforeEach(() => {
      vi.mocked(readdirSync).mockReturnValue([]);
    });

    it('should use process.cwd() as default directory when no path provided', () => {
      const _ = new ScopesReader();

      expect(readdirSync).toHaveBeenCalledWith(
        process.cwd(),
        { withFileTypes: true },
      );
    });

    it('should accept a custom directory path', () => {
      const customPath = '/custom/path/to/packages';

      const _ = new ScopesReader(customPath);

      expect(readdirSync).toHaveBeenCalledWith(
        customPath,
        { withFileTypes: true },
      );
    });

    it('should expose a static helper to create an instance that combines process.cwd() with packages path', () => {
      const _ = ScopesReader.withPackagesDirectory();

      expect(readdirSync).toHaveBeenCalledWith(
        join(process.cwd(), 'packages'),
        { withFileTypes: true },
      );
    });
  });

  describe('Execution of getScopesInformation on initialization of class', () => {
    describe('read and filter directories', () => {
      beforeEach(() => {
        vi.mocked(readFileSync).mockReturnValue(PACKAGE_JSON);
      });

      it('should filter out non-directory entries', () => {
        vi.mocked(readdirSync).mockReturnValue([
          createDirent('package-one', true),
          createDirent('README.md', false),
          createDirent('package-two', true),
          createDirent('.gitignore', false),
        ]);
        const reader = new ScopesReader();

        expect(reader.scopes).toHaveLength(2);
        expect(readFileSync).toHaveBeenCalledTimes(2);
      });

      it('should throw when a directory read fails', () => {
        vi.mocked(readdirSync).mockImplementation(() => {
          throw new Error('ENOENT: no such file or directory');
        });

        expect(() => new ScopesReader('/nonexistent/path')).toThrow('ENOENT: no such file or directory');
      });

      it('should handle an empty directory', () => {
        vi.mocked(readdirSync).mockReturnValue([]);

        const reader = new ScopesReader();

        expect(reader.scopes).toHaveLength(0);
        expect(reader.scopesInformation).toHaveLength(0);
      });
    });

    describe('package.json handling for each directory', () => {
      beforeEach(() => {
        vi.mocked(readdirSync).mockReturnValue([createDirent('my-pkg', true)]);
        vi.mocked(readFileSync).mockReturnValue(PACKAGE_JSON);
      });

      it('should read and parse package.json from each directory', () => {
        const customPath = '/packages/custom';

        const _ = new ScopesReader(customPath);

        expect(readFileSync).toHaveBeenCalledWith(
          join(customPath, 'my-pkg', 'package.json'),
          'utf-8',
        );
      });

      it('should throw when package.json is missing', () => {
        vi.mocked(readFileSync).mockImplementation(() => {
          throw new Error('ENOENT: no such file or directory');
        });

        expect(() => new ScopesReader('/packages')).toThrow('ENOENT: no such file or directory');
      });

      it('should throw when the parsed package.json does not have a name field', () => {
        vi.mocked(readFileSync).mockReturnValue('{"key":"value"}');

        expect(() => new ScopesReader('/packages')).toThrow('Error parsing package.json');
      });
    });
  });

  describe('getters', () => {
    describe('scopes', () => {
      beforeEach(() => {
        vi.mocked(readFileSync).mockReturnValue(PACKAGE_JSON);
      });

      it('should return an array of scope names', () => {
        vi.mocked(readdirSync).mockReturnValue([createDirent('package-one', true)]);

        const reader = new ScopesReader();

        expect(reader.scopes).toStrictEqual([PACKAGE_NAME]);
      });

      it('should return an empty array when readdirSync finds no packages', () => {
        vi.mocked(readdirSync).mockReturnValue([]);

        const reader = new ScopesReader();

        expect(reader.scopes).toHaveLength(0);
      });

      it('should return multiple scope names', () => {
        vi.mocked(readdirSync).mockReturnValue([
          createDirent('package-one', true),
          createDirent('package-two', true),
          createDirent('package-three', true),
        ]);
        vi.mocked(readFileSync).mockReturnValueOnce('{"name": "app-one"}')
          .mockReturnValueOnce('{"name": "app-two"}')
          .mockReturnValueOnce('{"name": "app-three"}');

        const reader = new ScopesReader();

        expect(reader.scopes).toStrictEqual(['app-one', 'app-two', 'app-three']);
      });
    });

    describe('scopesInformation', () => {
      it('should return a readonly array of ScopeInformation', () => {
        const customPath = '/path/to/packages';
        vi.mocked(readdirSync).mockReturnValue([createDirent('package-one', true)]);
        vi.mocked(readFileSync).mockReturnValue(PACKAGE_JSON);
        const reader = new ScopesReader(customPath);

        expect(reader.scopesInformation).toStrictEqual([
          {
            directoryPath: join(customPath, 'package-one'),
            scopeName: PACKAGE_NAME,
          },
        ]);
      });
    });
  });
});
