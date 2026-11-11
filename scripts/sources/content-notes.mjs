#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export function contentNotes(bundle) {
  const lines = ['\n### Release content\n'];
  for (const note of bundle.notes) {
    lines.push(`- **${note.path}** (${note.changed ? 'updated' : 'reviewed, unchanged'}): ${note.reason}\n  [Changelog](${note.url}): ${note.entry.replace(/\n/g, ' ')}`);
  }
  if (!bundle.files.length) lines.push('No content edits; the proposal contains only the pin commit.');
  return lines.join('\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(contentNotes(JSON.parse(readFileSync(process.argv[2], 'utf8'))));
