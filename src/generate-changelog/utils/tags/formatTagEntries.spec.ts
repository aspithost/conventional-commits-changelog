import { formatTagEntries } from './formatTagEntries.js';
import { getTagDate } from './get-tag-date/getTagDate.js';

vi.mock('./get-tag-date/getTagDate.js', () => ({
  getTagDate: vi.fn(() => ''),
}));

const DIRECTORY_PATH = '/repo';

describe('formatTagEntries', () => {
  it('should format a single tag without a previous tag', () => {
    vi.mocked(getTagDate).mockReturnValueOnce('2024-01-01');

    const result = formatTagEntries(DIRECTORY_PATH, ['v1.0.0']);

    expect(result).toStrictEqual([
      {
        tagCurrent: 'v1.0.0',
        tagPrevious: undefined,
        date: '2024-01-01',
      },
    ]);
  });

  it('should link each tag to its preceding tag', () => {
    const result = formatTagEntries(DIRECTORY_PATH, [
      'v1.0.0',
      'v1.1.0',
      'v2.0.0',
    ]);

    expect(result).toStrictEqual([
      {
        tagCurrent: 'v1.0.0',
        tagPrevious: undefined,
        date: '',
      },
      {
        tagCurrent: 'v1.1.0',
        tagPrevious: 'v1.0.0',
        date: '',
      },
      {
        tagCurrent: 'v2.0.0',
        tagPrevious: 'v1.1.0',
        date: '',
      },
    ]);
  });

  it('should retrieve the date of each tag from the directory', () => {
    formatTagEntries(DIRECTORY_PATH, ['v1.0.0', 'v1.1.0']);

    expect(getTagDate).toHaveBeenNthCalledWith(1, 'v1.0.0', DIRECTORY_PATH);
    expect(getTagDate).toHaveBeenNthCalledWith(2, 'v1.1.0', DIRECTORY_PATH);
  });

  it('should assign each tag its own date', () => {
    const DATE_ONE = '2024-01-01';
    const DATE_TWO = '2024-02-01';
    vi.mocked(getTagDate)
      .mockReturnValueOnce(DATE_ONE)
      .mockReturnValueOnce(DATE_TWO);

    const formattedTags = formatTagEntries(DIRECTORY_PATH, ['v1.0.0', 'v1.1.0']);

    expect(formattedTags).toHaveLength(2);
    expect(formattedTags[0].date).toBe(DATE_ONE);
    expect(formattedTags[1].date).toBe(DATE_TWO);

  });
});
