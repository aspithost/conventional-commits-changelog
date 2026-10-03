import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { DirectoriesReader } from './DirectoriesReader.js';

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const PACKAGE_JSON_NAME = 'some-package';
const PACKAGE_JSON = `{"name": "${PACKAGE_JSON_NAME}"}`;

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
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    beforeEach(() => {
      vi.mocked(readdirSync).mockReturnValue([]);
    });

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
      beforeEach(() => {
        vi.mocked(readdirSync).mockReturnValue([]);
      });

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
        const onError = vi.fn();
        const ROOT_SCOPE_NAME = 'root';
        const ROOT_SCOPE_DIRECTORY_PATH = '/path/for/root/scope';
        vi.mocked(readdirSync).mockReturnValue([createDirent(true, ROOT_SCOPE_NAME)]);
        vi.mocked(readFileSync).mockReturnValue(`{"name": "${ROOT_SCOPE_NAME}"}`);

        expect(() => new DirectoriesReader({
          rootScopeOptions: {
            addRootScope: true,
            rootScopeDirectoryPath: ROOT_SCOPE_DIRECTORY_PATH,
            rootScopeName: ROOT_SCOPE_NAME,
          },
          onError,
        })).toThrow();
        expect(onError).toHaveBeenCalledExactlyOnceWith(
          expect.any(String),
          expect.any(Error),
        );
      });
    });

    describe('read and filter directories', () => {
      it('should filter out non-directory entries', () => {
        const PACKAGE_JSON_NAME_TWO = 'some-package-two';
        const PACKAGE_JSON_TWO = `{"name": "${PACKAGE_JSON_NAME_TWO}"}`;
        vi.mocked(readFileSync)
          .mockReturnValueOnce(PACKAGE_JSON)
          .mockReturnValueOnce(PACKAGE_JSON_TWO);
        vi.mocked(readdirSync).mockReturnValue([
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
        const onError = vi.fn();
        const error = createEnoentError();
        vi.mocked(readdirSync).mockImplementation(() => {
          throw error;
        });

        expect(() => new DirectoriesReader({
          directoryPath: '/nonexistent/path',
          onError,
        }))
          .toThrow(error);
        expect(onError).toHaveBeenCalledExactlyOnceWith(
          expect.any(String),
          error,
        );
      });

      it('should handle an empty root directory', () => {
        vi.mocked(readdirSync).mockReturnValue([]);

        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toHaveLength(0);
        expect(directoriesReader.directoryPathByScopeMap.size).toBe(0);
      });
    });

    describe('package.json handling for each directory', () => {
      beforeEach(() => {
        vi.mocked(readdirSync).mockReturnValue([createDirent(true, 'my-pkg')]);
        vi.mocked(readFileSync).mockReturnValue(PACKAGE_JSON);
      });

      it('should read and parse package.json from each directory', () => {
        const customPath = '/packages/custom';
        vi.mocked(readdirSync).mockReturnValue([createDirent(true, 'my-pkg', customPath)]);

        const _ = new DirectoriesReader({ directoryPath: customPath });

        expect(readFileSync).toHaveBeenCalledWith(
          join(customPath, 'my-pkg', 'package.json'),
          'utf-8',
        );
      });

      it(
        'should silently skip a directory when the directory does not contain a package.json file',
        () => {
          vi.mocked(readFileSync).mockImplementation(() => {
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
          const onError = vi.fn();
          const someError = new Error('EACCES: permission denied');
          vi.mocked(readFileSync).mockImplementation(() => {
            throw someError;
          });

          expect(() => new DirectoriesReader({ onError })).toThrow(someError);
          expect(onError).toHaveBeenCalledExactlyOnceWith(
            expect.any(String),
            someError,
          );
        },
      );

      it('should throw when package.json contains invalid JSON', () => {
        vi.mocked(readFileSync).mockReturnValue('{not valid json');

        expect(() => new DirectoriesReader()).toThrow();
      });

      it('should throw when the parsed package.json does not have a name field', () => {
        vi.mocked(readFileSync).mockReturnValue('{"key":"value"}');

        expect(() => new DirectoriesReader()).toThrow('Error parsing package.json');
      });
    });
  });

  describe('getters', () => {
    describe('scopes', () => {
      beforeEach(() => {
        vi.mocked(readFileSync).mockReturnValue(PACKAGE_JSON);
      });

      it('should return an iterable of scope names', () => {
        vi.mocked(readdirSync).mockReturnValue([createDirent(true, 'package-one')]);

        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toStrictEqual([PACKAGE_JSON_NAME]);
      });

      it('should return an empty array when readdirSync finds no packages', () => {
        vi.mocked(readdirSync).mockReturnValue([]);

        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toHaveLength(0);
      });

      it('should return multiple scope names', () => {
        vi.mocked(readdirSync).mockReturnValue([
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
        vi.mocked(readdirSync).mockReturnValue([createDirent(true, 'package-one'),
          createDirent(true, 'no-package-json')]);

        const directoriesReader = new DirectoriesReader();

        expect([...directoriesReader.scopes]).toStrictEqual([PACKAGE_JSON_NAME]);
      });
    });

    describe('directoryPathByScopeMap', () => {
      it('should return a readonly array of ScopeInformation', () => {
        const DIRECTORY_PATH = '/path/to/packages';
        const NESTED_DIRECTORY = join('package-one');
        vi.mocked(readdirSync).mockReturnValue([createDirent(
          true,
          NESTED_DIRECTORY,
          DIRECTORY_PATH,
        )]);
        vi.mocked(readFileSync).mockReturnValue(PACKAGE_JSON);

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

        vi.mocked(readdirSync).mockReturnValue([
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
