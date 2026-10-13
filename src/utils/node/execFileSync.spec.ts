import { execFileSync } from 'node:child_process';

import { _execFileSync } from './execFileSync.js';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

describe('_execFileSync', () => {
  it('should call execFileSync with the provided arguments', () => {
    const COMMAND = 'some-command';
    const ARGS = ['some-arg', 'some-other-arg'];
    const CWD = process.cwd();

    _execFileSync(COMMAND, ARGS, CWD);

    expect(vi.mocked(execFileSync)).toHaveBeenCalledExactlyOnceWith(COMMAND, ARGS, {
      cwd: CWD,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });
  });
});
