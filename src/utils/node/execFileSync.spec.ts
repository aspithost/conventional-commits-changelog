import { execFileSync } from 'node:child_process';

import { execFileSyncWrapper } from './execFileSync.js';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(() => ''),
}));

describe('execFileSyncWrapper', () => {
  it('should call execFileSync with the provided arguments', () => {
    const COMMAND = 'some-command';
    const ARGS = ['some-arg', 'some-other-arg'];
    const CWD = process.cwd();

    execFileSyncWrapper(COMMAND, ARGS, CWD);

    expect(vi.mocked(execFileSync)).toHaveBeenCalledExactlyOnceWith(COMMAND, ARGS, {
      cwd: CWD,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });
  });
});
