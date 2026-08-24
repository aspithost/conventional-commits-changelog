declare module 'conventional-changelog-conventionalcommits' {
  interface Preset {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    writer: import('conventional-changelog-writer').FinalOptions;
  }

  export default function createPreset(
    config?: Record<string, unknown>,
  ): Promise<Preset>;
}
