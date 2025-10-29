import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';

// @ts-expect-error: No declaration file for library
import createPreset from 'conventional-changelog-conventionalcommits';

import type { CommitKnownProps, Options } from 'conventional-changelog-writer';

import { COMMIT_EMOJIS, COMMIT_TYPES } from '@/presets/constants/writer.js';

const commitGroupOrder = COMMIT_TYPES.flatMap((entry) => entry.section);

export async function createWriterPreset(
  config?: Record<string, unknown>,
): Promise<Options<CommitKnownProps>> {
  const preset = await createPreset(config ?? { types: COMMIT_TYPES });
  const { writer }: { writer: Options } = preset;
  writer.commitGroupsSort = (a, b) => {
    const rankA = commitGroupOrder.indexOf(a.title);
    const rankB = commitGroupOrder.indexOf(b.title);

    return rankA - rankB;
  };
  Handlebars.registerHelper('commitEmoji', (type: keyof typeof COMMIT_EMOJIS) => COMMIT_EMOJIS[type] ??  type);
  const commitTemplate = readFileSync(
    join('src', 'presets', 'templates', 'commit.hbs'),
    'utf-8',
  );
  writer.commitPartial = commitTemplate;
  return writer;
}

export const writerPreset: Options = {
  commitGroupsSort: (a, b) => {
    const rankA = commitGroupOrder.indexOf(a.title);
    const rankB = commitGroupOrder.indexOf(b.title);

    return rankA - rankB;
  },
  commitsSort: 'subject' as unknown as Options['commitsSort'],
  groupBy: 'type',
  noteGroupsSort: 'title',
};
