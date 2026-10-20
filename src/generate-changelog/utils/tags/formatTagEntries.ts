import { getTagDate } from './get-tag-date/getTagDate.js';

export interface TagEntry {
  date: string;
  tagCurrent: string;
  tagPrevious?: string;
}

export function formatTagEntries(directoryPath: string, tags: string[]): TagEntry[] {
  return tags.map((tagCurrent, index) => {
    return {
      tagCurrent,
      tagPrevious: index === 0 ? undefined : tags[index - 1],
      date: getTagDate(tagCurrent, directoryPath),
    };
  });
}
