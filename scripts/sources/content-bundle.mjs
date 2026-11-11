#!/usr/bin/env node
/** Dependency-free transport: data files, never git patches, archives, hooks or executable artifacts. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, lstatSync, realpathSync, mkdirSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { siteRoot } from './lib.mjs';

export function allowedContent(path) {
  return path === 'src/data/names.json' || /^src\/content\/docs\/[a-z0-9][a-z0-9-]*\.mdx$/.test(path);
}
export function validateBundle(bundle, plan, names) {
  if (bundle?.version !== 1 || !Array.isArray(bundle.files) || !Array.isArray(bundle.notes)) throw new Error('invalid content bundle');
  if (Buffer.byteLength(JSON.stringify(bundle)) > 2 * 1024 * 1024) throw new Error('content bundle exceeds 2 MiB including notes');
  const noteKeys = new Set();
  for (const note of bundle.notes) {
    const page = plan.pages.find((p) => p.path === note.path && p.url === note.url);
    const key = `${note.path}:${note.url}`;
    if (!page || noteKeys.has(key) || typeof note.changed !== 'boolean' || typeof note.entry !== 'string' || !note.entry.trim() || !page.changelog.includes(note.entry) || typeof note.reason !== 'string' || !note.reason.trim()) throw new Error('invalid or duplicate page disposition');
    noteKeys.add(key);
  }
  const seen = new Set();
  let size = 0;
  for (const file of bundle.files) {
    if (!allowedContent(file.path) || seen.has(file.path) || typeof file.content !== 'string') throw new Error(`forbidden or duplicate content path: ${JSON.stringify(file.path)}`);
    seen.add(file.path);
    size += Buffer.byteLength(file.content);
    if (size > 1024 * 1024) throw new Error('content bundle exceeds 1 MiB');
    if (file.content.includes('\0')) throw new Error('binary content refused');
  }
  const nameFile = bundle.files.find((f) => f.path === 'src/data/names.json');
  const resultingNames = nameFile ? JSON.parse(nameFile.content) : names;
  for (const { kind, name } of plan.missing) {
    if (!['alias', 'description'].every((key) => typeof resultingNames[kind]?.[name]?.[key] === 'string' && resultingNames[kind][name][key].trim())) throw new Error(`content still missing: ${kind}/${name} alias and description`);
  }
  for (const page of plan.pages) {
    const note = bundle.notes.find((n) => n.path === page.path && n.url === page.url && typeof n.entry === 'string' && n.entry.trim() && page.changelog.includes(n.entry) && typeof n.reason === 'string' && n.reason.trim());
    if (!note) throw new Error(`content review still missing: ${page.path} (${page.repo})`);
    if (note.changed !== seen.has(page.path)) throw new Error(`page disposition disagrees with bundle: ${page.path}`);
  }
  for (const file of bundle.files.filter((f) => f.path !== 'src/data/names.json')) {
    if (!plan.pages.some((p) => p.path === file.path)) throw new Error(`page outside release impact: ${file.path}`);
  }
  return bundle;
}
function safeFile(root, path) {
  const target = resolve(root, path);
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink() || !realpathSync(target).startsWith(realpathSync(root) + sep)) throw new Error(`content is not an ordinary in-tree file: ${path}`);
  return target;
}
export function pack(root, plan, notes) {
  // Include both staged and unstaged changes and untracked files. No agent commit or index can hide an escape.
  const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const paths = [...new Set([...git(['diff', '--name-only', '-z', 'HEAD', '--']), ...git(['ls-files', '--others', '--exclude-standard', '-z'])])];
  const files = paths.map((path) => {
    if (!allowedContent(path)) throw new Error(`author changed a forbidden path: ${JSON.stringify(path)}`);
    const target = safeFile(root, path);
    if (lstatSync(target).mode & 0o111) throw new Error(`executable content refused: ${path}`);
    return { path, content: readFileSync(target, 'utf8') };
  });
  return validateBundle({ version: 1, files, notes }, plan, JSON.parse(readFileSync(resolve(root, 'src/data/names.json'), 'utf8')));
}
export function apply(root, bundle, plan) {
  validateBundle(bundle, plan, JSON.parse(readFileSync(resolve(root, 'src/data/names.json'), 'utf8')));
  // Check every destination BEFORE writing any bytes. Only existing, ordinary content files can be replaced.
  const targets = bundle.files.map((file) => safeFile(root, file.path));
  bundle.files.forEach((file, i) => writeFileSync(targets[i], file.content));
}
export function main([mode, planPath, bundlePath, notesPath] = []) {
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  if (mode === 'pack') {
    const notes = JSON.parse(readFileSync(notesPath, 'utf8'));
    mkdirSync(dirname(resolve(bundlePath)), { recursive: true });
    writeFileSync(bundlePath, JSON.stringify(pack(siteRoot, plan, notes), null, 2) + '\n');
  } else if (mode === 'apply') apply(siteRoot, JSON.parse(readFileSync(bundlePath, 'utf8')), plan);
  else throw new Error('usage: content-bundle.mjs pack|apply <plan.json> <bundle.json> [notes.json]');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2));
