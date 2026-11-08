import { release } from './src/release/release/release.js';

await release({
  changelogWriterOptions: {
    remoteRepositoryInformation: {
      host: 'https://github.com',
      owner: 'aspithost',
      repository: 'conventional-commits-changelog',
    },
  },
});
