import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ScopesReader } from './ScopesReader.js';

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const { safeParse } = vi.hoisted(() => ({
  safeParse: vi.fn(),
}));
vi.mock('@/schemas/package.js', () => ({
  packageSchema: {
    safeParse,
  },
}));

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);

function createDirent(name: string, isDirectory: boolean) {
  return {
    name,
    isDirectory: () => isDirectory,
  } as never;
}

describe('ScopesReader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  beforeEach(() => {
    safeParse.mockReturnValue({
      success: true,
      data: { scopeName: 'package-one' },
    });
  });

  describe('constructor', () => {
    beforeEach(() => {
      mockReaddirSync.mockReturnValue([]);
    });

    it('should use default packages directory when no path provided', () => {
      const _ = new ScopesReader();

      expect(mockReaddirSync).toHaveBeenCalledWith(
        join(process.cwd(), 'packages'),
        { withFileTypes: true },
      );
    });

    it('should accept a custom directory path', () => {
      const customPath = '/custom/path/to/packages';

      const _ = new ScopesReader(customPath);

      expect(mockReaddirSync).toHaveBeenCalledWith(
        customPath,
        { withFileTypes: true },
      );
    });
  });

  describe('scopes getter', () => {
    it('should return an array of scope names', () => {
      mockReaddirSync.mockReturnValue([createDirent('package-one', true)]);
      mockReadFileSync.mockReturnValue('{}');

      const reader = new ScopesReader();

      expect(reader.scopes).toStrictEqual(['package-one']);
    });

    it('should return an empty array when no packages found', () => {
      mockReaddirSync.mockReturnValue([]);

      const reader = new ScopesReader();

      expect(reader.scopes).toHaveLength(0);
    });

    it('should return multiple scope names', () => {
      mockReaddirSync.mockReturnValue([
        createDirent('package-one', true),
        createDirent('package-two', true),
        createDirent('package-three', true),
      ]);
      mockReadFileSync.mockReturnValue('{}');
      safeParse
        .mockReturnValueOnce({ success: true, data: { scopeName: 'package-one' } })
        .mockReturnValueOnce({ success: true, data: { scopeName: 'package-two' } })
        .mockReturnValueOnce({ success: true, data: { scopeName: 'package-three' } });

      const reader = new ScopesReader();

      expect(reader.scopes).toStrictEqual(['package-one', 'package-two', 'package-three']);
    });
  });

  describe('scopeEntries getter', () => {
    it('should return a readonly array of ScopeInformation', () => {
      const customPath = '/path/to/packages';
      mockReaddirSync.mockReturnValue([createDirent('package-one', true)]);
      mockReadFileSync.mockReturnValue('{}');
      const reader = new ScopesReader(customPath);

      expect(reader.scopeEntries).toStrictEqual([
        {
          scopePath: join(customPath, 'package-one'),
          scopeName: 'package-one',
        },
      ]);
    });
  });

  describe('directory reading', () => {
    it('should filter out non-directory entries', () => {
      mockReaddirSync.mockReturnValue([
        createDirent('package-one', true),
        createDirent('README.md', false),
        createDirent('package-two', true),
        createDirent('.gitignore', false),
      ]);
      mockReadFileSync.mockReturnValue('{}');

      const reader = new ScopesReader();

      expect(reader.scopes).toHaveLength(2);
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    });

    it('should throw when a directory read fails', () => {
      mockReaddirSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => new ScopesReader('/nonexistent/path')).toThrow('ENOENT: no such file or directory');
    });

    it('should handle an empty directory', () => {
      mockReaddirSync.mockReturnValue([]);

      const reader = new ScopesReader();

      expect(reader.scopes).toHaveLength(0);
      expect(reader.scopeEntries).toHaveLength(0);
    });
  });

  describe('package.json handling', () => {
    beforeEach(() => {
      mockReaddirSync.mockReturnValue([createDirent('my-pkg', true)]);
    });

    it('should read and parse package.json from each folder', () => {
      const customPath = '/packages';
      mockReadFileSync.mockReturnValue('{}');

      const _ = new ScopesReader(customPath);

      expect(mockReadFileSync).toHaveBeenCalledWith(
        join(customPath, 'my-pkg', 'package.json'),
        'utf-8',
      );
    });

    it('should throw when package.json is missing', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => new ScopesReader('/packages')).toThrow('ENOENT: no such file or directory');
    });

    it('should throw when package.json validation fails', () => {
      mockReadFileSync.mockReturnValue('{}');
      safeParse.mockReturnValueOnce({
        success: false,
        error: new Error('Dummy error'),
      });

      expect(() => new ScopesReader()).toThrow('Error parsing package.json');
    });

    it('should pass parsed JSON to schema validator', () => {
      const packageJson = { name: '@scope/pkg', scopeName: 'pkg', version: '1.0.0' };
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson));

      const _ = new ScopesReader();

      expect(safeParse).toHaveBeenCalledWith(packageJson);
    });
  });
});
