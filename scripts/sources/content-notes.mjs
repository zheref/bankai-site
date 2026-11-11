#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const bundle = JSON.parse(readFileSync(process.argv[2], 'utf8'));
console.log('\n### Release content\n');
for (const note of bundle.notes) {
  console.log(`- **${note.path}** (${note.changed ? 'updated' : 'reviewed, unchanged'}): ${note.reason}\n  [Changelog](${note.url}): ${note.entry.replace(/\n/g, ' ')}`);
}
if (!bundle.files.length) console.log('No content edits; the proposal contains only the pin commit.');
