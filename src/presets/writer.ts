import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error: No declaration file for library
import createPreset from 'conventional-changelog-conventionalcommits';
import type { CommitKnownProps, FinalOptions } from 'conventional-changelog-writer';

import { COMMIT_EMOJIS, COMMIT_TYPES } from '@/presets/constants/writer.js';

interface WriterPresetConfig<T extends string, U extends string> extends Record<string, unknown> {
  types: readonly {
    type: T[number];
    section: U[number];
  }[];
}

export async function createWriterPreset<T extends string, U extends string>({ 
  config = { types: COMMIT_TYPES},
  commitEmojisConfig = COMMIT_EMOJIS,
}: {
  config?: WriterPresetConfig<T, U>;
  commitEmojisConfig?: Record<string, string>;
}): Promise<FinalOptions<CommitKnownProps>> {
  const preset = await createPreset(config ?? { types: COMMIT_TYPES });
  const commitGroupOrder = config.types.flatMap((entry) => entry.section);
  const { writer }: { writer: FinalOptions } = preset;
  writer.commitGroupsSort = (a, b) => {
    const rankA = commitGroupOrder.indexOf(a.title);
    const rankB = commitGroupOrder.indexOf(b.title);

    return rankA - rankB;
  };
  Handlebars.registerHelper('commitEmoji', (type: keyof typeof commitEmojisConfig) => commitEmojisConfig[type] ??  type);
  const commitTemplate = readFileSync(
    join(process.cwd(), 'src', 'presets', 'templates', 'commit.hbs'),
    'utf-8',
  );
  writer.commitPartial = commitTemplate;
  return writer;
}
