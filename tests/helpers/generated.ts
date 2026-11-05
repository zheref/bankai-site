import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const root = resolve(__dirname, '..', '..');
export const generatedDir = resolve(root, 'src', 'data', 'generated');
export function generated<T = unknown>(file: string): T {
  const p = resolve(generatedDir, file);
  if (!existsSync(p)) throw new Error(`${file} is missing: run \`pnpm sources:collect\` first (the build and develop scripts do).`);
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}
