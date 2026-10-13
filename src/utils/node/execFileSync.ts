import { execFileSync } from 'node:child_process';

export interface ExecFileSyncOptions {
  encoding?: BufferEncoding;
  maxBuffer?: number;
}

export function _execFileSync(
  command: string,
  args: readonly string[],
  cwd: string,
  {
    encoding = 'utf-8',
    maxBuffer = 1024 * 1024 * 10, // 10MB
  }: ExecFileSyncOptions = {},
): string {
  return execFileSync(command, args, {
    cwd,
    encoding,
    maxBuffer,
  });
}
