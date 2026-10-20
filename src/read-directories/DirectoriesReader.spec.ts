import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { DirectoriesReader } from './DirectoriesReader.js';

const PACKAGE_JSON_NAME = vi.hoisted(() => 'some-package');
const PACKAGE_JSON = vi.hoisted(() => `{"name": "${PACKAGE_JSON_NAME}"}`);

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn(() => PACKAGE_JSON),
}));

function createDirent(
  isDirectory: boolean,
  name: string,
  parentPath = process.cwd(),
) {
  return {
    isDirectory: () => isDirectory,
    name,
    parentPath,
  } as never;
}

function createEnoentError(): NodeJS.ErrnoException {
  const err = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
}

describe('DirectoriesReader', () => {
  describe('constructor', () => {
    it('should use process.cwd() as default when the user does not provide a path', () => {
      const _ = new DirectoriesReader();

      expect(readdirSync).toHaveBeenCalledWith(
        process.cwd(),
        {
          recursive: true,
          withFileTypes: true,
        },
      );
    });

    it('should accept a custom directory path', () => {
      const customPath = '/custom/path/to/packages';

      const _ = new DirectoriesReader({ directoryPath: customPath });

      expect(readdirSync).toHaveBeenCalledWith(
        customPath,
        {
          recursive: true,
          withFileTypes: true,
        },
      );
    });
  });

  describe('Execution of createDirectoryPathByScopeMap on initialization of class', () => {
    describe('root scope entry in createDirectoryPathByScopeMap', () => {
      it('should not create a root scope entry if not specified', () => {
        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toHaveLength(0);
        expect(directoriesReader.directoryPathByScopeMap.size).toBe(0);
      });

      it('should add a map entry for a root scope when the user opts in', () => {
        const ROOT_SCOPE_NAME = 'root';
        const ROOT_SCOPE_DIRECTORY_PATH = '/path/for/root/scope';
        const directoriesReader = new DirectoriesReader({
          rootScopeOptions: {
            addRootScope: true,
            rootScopeDirectoryPath: ROOT_SCOPE_DIRECTORY_PATH,
            rootScopeName: ROOT_SCOPE_NAME,
          },
        });

        expect([...directoriesReader.scopes]).toStrictEqual([ROOT_SCOPE_NAME]);
        expect(directoriesReader.directoryPathByScopeMap.get(ROOT_SCOPE_NAME)).toStrictEqual({
          directoryPath: ROOT_SCOPE_DIRECTORY_PATH,
        });
      });

      it('should throw when the root scope name conflicts with an existing entry', () => {
        const ROOT_SCOPE_NAME = 'root';
        const ROOT_SCOPE_DIRECTORY_PATH = '/path/for/root/scope';
        vi.mocked(readdirSync).mockReturnValueOnce([createDirent(true, ROOT_SCOPE_NAME)]);
        vi.mocked(readFileSync).mockReturnValueOnce(`{"name": "${ROOT_SCOPE_NAME}"}`);

        expect(() => new DirectoriesReader({
          rootScopeOptions: {
            addRootScope: true,
            rootScopeDirectoryPath: ROOT_SCOPE_DIRECTORY_PATH,
            rootScopeName: ROOT_SCOPE_NAME,
          },
        })).toThrow();
      });
    });

    describe('read and filter directories', () => {
      it('should filter out non-directory entries', () => {
        const PACKAGE_JSON_NAME_TWO = 'some-package-two';
        const PACKAGE_JSON_TWO = `{"name": "${PACKAGE_JSON_NAME_TWO}"}`;
        vi.mocked(readFileSync)
          .mockReturnValueOnce(PACKAGE_JSON)
          .mockReturnValueOnce(PACKAGE_JSON_TWO);
        vi.mocked(readdirSync).mockReturnValueOnce([
          createDirent(true, 'package-one'),
          createDirent(false, 'README.md'),
          createDirent(true, 'package-two'),
          createDirent(false, '.gitignore'),
        ]);
        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes])
          .toStrictEqual([PACKAGE_JSON_NAME, PACKAGE_JSON_NAME_TWO]);
        expect(directoriesReader.directoryPathByScopeMap.size).toBe(2);
        expect(directoriesReader.directoryPathByScopeMap.get(PACKAGE_JSON_NAME)).toStrictEqual({
          directoryPath: join(process.cwd(), 'package-one'),
        });
        expect(directoriesReader.directoryPathByScopeMap.get(PACKAGE_JSON_NAME_TWO)).toStrictEqual({
          directoryPath: join(process.cwd(), 'package-two'),
        });
        expect(readFileSync).toHaveBeenCalledTimes(2);
      });

      it('should throw when the root directory does not exist', () => {
        const error = createEnoentError();
        vi.mocked(readdirSync).mockImplementationOnce(() => {
          throw error;
        });

        expect(() => new DirectoriesReader({
          directoryPath: '/nonexistent/path',
        }))
          .toThrow(expect.objectContaining({ cause: error }));
      });

      it('should handle an empty root directory', () => {
        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toHaveLength(0);
        expect(directoriesReader.directoryPathByScopeMap.size).toBe(0);
      });
    });

    describe('package.json handling for each directory', () => {
      it('should read and parse package.json from each directory', () => {
        const customPath = '/packages/custom';
        vi.mocked(readdirSync).mockReturnValueOnce([createDirent(true, 'my-pkg', customPath)]);

        const _ = new DirectoriesReader({ directoryPath: customPath });

        expect(readFileSync).toHaveBeenCalledWith(
          join(customPath, 'my-pkg', 'package.json'),
          'utf-8',
        );
      });

      describe('unhappy scenarios', () => {
        beforeEach(() => {
          vi.mocked(readdirSync).mockReturnValue([createDirent(true, 'my-pkg')]);
        });

        afterEach(() => {
          vi.resetAllMocks();
        });

        it(
          'should silently skip a directory when it does not contain a package.json file',
          () => {
            vi.mocked(readFileSync).mockImplementationOnce(() => {
              throw createEnoentError();
            });

            const directoriesReader = new DirectoriesReader();

            expect([...directoriesReader.scopes]).toHaveLength(0);
            expect(directoriesReader.directoryPathByScopeMap.size).toBe(0);
          },
        );

        it(
          'should throw when reading package.json fails for a reason other than a missing file',
          () => {
            const someError = new Error('EACCES: permission denied');
            vi.mocked(readFileSync).mockImplementationOnce(() => {
              throw someError;
            });

            expect(() => new DirectoriesReader())
              .toThrow(expect.objectContaining({ cause: someError }));
          },
        );

        it('should throw when package.json contains invalid JSON', () => {
          vi.mocked(readFileSync).mockReturnValueOnce('{not valid json');

          expect(() => new DirectoriesReader()).toThrow();
        });

        it('should throw when the parsed package.json does not have a name field', () => {
          vi.mocked(readFileSync).mockReturnValueOnce('{"key":"value"}');

          expect(() => new DirectoriesReader()).toThrow('Error parsing package.json');
        });
      });
    });
  });

  describe('getters', () => {
    describe('scopes', () => {
      it('should return an iterable of scope names', () => {
        vi.mocked(readdirSync).mockReturnValueOnce([createDirent(true, 'package-one')]);

        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toStrictEqual([PACKAGE_JSON_NAME]);
      });

      it('should return an empty array when readdirSync finds no packages', () => {
        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toHaveLength(0);
      });

      it('should return multiple scope names', () => {
        vi.mocked(readdirSync).mockReturnValueOnce([
          createDirent(true, 'package-one'),
          createDirent(true, 'package-two'),
          createDirent(true, 'package-three'),
        ]);
        vi.mocked(readFileSync)
          .mockReturnValueOnce('{"name": "app-one"}')
          .mockReturnValueOnce('{"name": "app-two"}')
          .mockReturnValueOnce('{"name": "app-three"}');

        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toStrictEqual([
          'app-one',
          'app-two',
          'app-three',
        ]);
      });

      it('should skip directories without a package.json but keep the rest', () => {
        vi.mocked(readdirSync).mockReturnValueOnce([
          createDirent(true, 'package-one'),
          createDirent(true, 'no-package-json'),
        ]);

        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toStrictEqual([PACKAGE_JSON_NAME]);
      });
    });

    describe('directoryPathByScopeMap', () => {
      it('should return a readonly array of ScopeInformation', () => {
        const DIRECTORY_PATH = '/path/to/packages';
        const NESTED_DIRECTORY = join('package-one');
        vi.mocked(readdirSync).mockReturnValueOnce([
          createDirent(
            true,
            NESTED_DIRECTORY,
            DIRECTORY_PATH,
          ),
        ]);

        const directoriesReader = new DirectoriesReader({ directoryPath: DIRECTORY_PATH });

        expect(directoriesReader.directoryPathByScopeMap.size).toBe(1);
        expect(directoriesReader.directoryPathByScopeMap.get(PACKAGE_JSON_NAME)).toStrictEqual({
          directoryPath: join(DIRECTORY_PATH, NESTED_DIRECTORY),
        });
      });

      it('should return nested scopes and their directory paths', () => {
        const DIRECTORY_PATH = '/packages';
        const FIRST_LEVEL_DIRECTORY = join(DIRECTORY_PATH, 'i');
        const SECOND_LEVEL_DIRECTORY = join(FIRST_LEVEL_DIRECTORY, 'am');
        const THIRD_LEVEL_DIRECTORY = join(SECOND_LEVEL_DIRECTORY, 'nested');

        vi.mocked(readdirSync).mockReturnValueOnce([
          createDirent(true, 'i', DIRECTORY_PATH),
          createDirent(true, 'am', FIRST_LEVEL_DIRECTORY),
          createDirent(true, 'nested', SECOND_LEVEL_DIRECTORY),
        ]);

        vi.mocked(readFileSync)
          .mockReturnValueOnce('{"name": "i"}')
          .mockReturnValueOnce('{"name": "am"}')
          .mockReturnValueOnce('{"name": "nested"}');

        const directoriesReader = new DirectoriesReader({ directoryPath: DIRECTORY_PATH });
        expect(directoriesReader.directoryPathByScopeMap.size).toBe(3);
        expect(directoriesReader.directoryPathByScopeMap.get('i')).toStrictEqual({
          directoryPath: FIRST_LEVEL_DIRECTORY,
        });
        expect(directoriesReader.directoryPathByScopeMap.get('am')).toStrictEqual({
          directoryPath: SECOND_LEVEL_DIRECTORY,
        });
        expect(directoriesReader.directoryPathByScopeMap.get('nested')).toStrictEqual({
          directoryPath: THIRD_LEVEL_DIRECTORY,
        });
      });
    });
  });
});
