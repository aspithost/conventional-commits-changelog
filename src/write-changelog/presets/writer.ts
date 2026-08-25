import createPreset from 'conventional-changelog-conventionalcommits';
import type { FinalOptions } from 'conventional-changelog-writer';
import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { COMMIT_EMOJIS, COMMIT_TYPES } from '@/write-changelog/presets/constants/writer.js';

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
} = {}): Promise<FinalOptions> {
  const preset = await createPreset(config);
  const commitGroupOrder = config.types.flatMap((entry) => entry.section);
  const { writer }: { writer: FinalOptions } = preset;
  writer.commitGroupsSort = (a, b) => {
    const rankA = commitGroupOrder.indexOf(a.title);
    const rankB = commitGroupOrder.indexOf(b.title);

    return rankA - rankB;
  };
  Handlebars.registerHelper('commitEmoji', (type: keyof typeof commitEmojisConfig) => commitEmojisConfig[type] ?? type);
  Handlebars.registerHelper('commitUrl', (hash: string, options: Handlebars.HelperOptions) => {
    // Note: Handlebars does not expose proper TS types for the `options` parameter, so we have to use `any` here.
    /* eslint-disable @typescript-eslint/no-unsafe-member-access,
      @typescript-eslint/no-unsafe-assignment,
      @typescript-eslint/restrict-template-expressions */
    if (!options.data?.root) {
      return hash;
    }
    const { host, owner, repository } = options.data.root;
    return `${host}/${owner}/${repository}/commit/${hash}`;
  });
  const commitTemplateSource = readFileSync(
    join(process.cwd(), 'src', 'presets', 'templates', 'commit.hbs'),
    'utf-8',
  );
  const compiledCommitTemplate = Handlebars.compile(commitTemplateSource);
  writer.commitPartial = (context, commit) => compiledCommitTemplate({ ...context, ...commit });
  return writer;
}
