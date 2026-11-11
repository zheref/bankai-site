#!/usr/bin/env node
/** Dependency-free transport: data files, never git patches, archives, hooks or executable artifacts. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, lstatSync, realpathSync, mkdirSync, readdirSync } from 'node:fs';
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
// A deliberately small prose grammar: authored MDX must never become executable build input.
// Active components, metadata and link-bearing lines are immutable trusted-base content.
export function validateProse(before, after) {
  const split = (text) => {
    const front = text.match(/^---\n[\s\S]*?\n---\n/);
    return { front: front?.[0] ?? '', body: text.slice(front?.[0].length ?? 0) };
  };
  const old = split(before), next = split(after);
  if (old.front !== next.front) throw new Error('authored frontmatter must remain unchanged');
  const inspect = (body) => {
    if (/[\x00-\x09\x0b-\x1f\x7f{}\\]|`{2,}|~{3,}/.test(body) || /^\s*(?:import|export)\b/m.test(body)) throw new Error('active or ambiguous MDX syntax refused');
    const components = [], links = [];
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (/^<(?:SourceStamp|GatesTable|NenPin|LeadAgent|AgentRoster|SkillCatalogue|TiersTable|ProfilesTable|HumanPhases|NenVerbs|HandbookFamilies|UxRules|Versions|ConfigFiles|Snippet)(?: id="[a-z0-9-]+")?(?: showSource)? \/>$/.test(line)) {
        if (lines[i - 1]?.trim() || lines[i + 1]?.trim()) throw new Error('component boundaries must remain blank');
        components.push(line); continue;
      }
      // Existing literal CLI placeholders, never arbitrary code spans or JSX.
      line = line.replace(/`(?:nen schema check --repo <path>|--repo <path>|\/kurapika <request>|hatsu:<name>)`/g, 'literal placeholder');
      if (/[<>]/.test(line)) throw new Error('new JSX or HTML refused');
      if (/[\[\]&]/.test(line)) links.push(lines[i]);
      // Inline code cannot carry a fence or span a component boundary.
      if (line.replace(/`[^`\n]*`/g, '').includes('`')) throw new Error('unbalanced inline code refused');
    }
    return { components, links };
  };
  if (JSON.stringify(inspect(old.body)) !== JSON.stringify(inspect(next.body))) throw new Error('trusted components and link-bearing lines must remain unchanged');
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
    const content = readFileSync(target, 'utf8');
    if (path.endsWith('.mdx')) validateProse(execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, encoding: 'utf8' }), content);
    return { path, content };
  });
  return validateBundle({ version: 1, files, notes }, plan, JSON.parse(readFileSync(resolve(root, 'src/data/names.json'), 'utf8')));
}
export function apply(root, bundle, plan) {
  validateBundle(bundle, plan, JSON.parse(readFileSync(resolve(root, 'src/data/names.json'), 'utf8')));
  // Check every destination BEFORE writing any bytes. Only existing, ordinary content files can be replaced.
  const targets = bundle.files.map((file) => {
    const target = safeFile(root, file.path);
    if (file.path.endsWith('.mdx')) validateProse(readFileSync(target, 'utf8'), file.content);
    return target;
  });
  bundle.files.forEach((file, i) => writeFileSync(targets[i], file.content));
}
// Run only in fresh prove/land checkouts, never in the author's mutable workspace.
export function collectAuthored(root, directory, plan) {
  const paths = ['src/data/names.json', ...readdirSync(resolve(root, 'src/content/docs')).filter((p) => p.endsWith('.mdx')).map((p) => `src/content/docs/${p}`)];
  const files = [];
  for (const path of paths) {
    const content = readFileSync(safeFile(directory, path), 'utf8');
    const before = readFileSync(safeFile(root, path), 'utf8');
    if (content === before) continue;
    if (path.endsWith('.mdx')) validateProse(before, content);
    files.push({ path, content });
  }
  const notes = JSON.parse(readFileSync(safeFile(directory, 'release-content-notes.json'), 'utf8'));
  return validateBundle({ version: 1, files, notes }, plan, JSON.parse(readFileSync(resolve(root, 'src/data/names.json'), 'utf8')));
}
export function main([mode, planPath, bundlePath, notesPath] = []) {
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  if (mode === 'collect') {
    writeFileSync(bundlePath, JSON.stringify(collectAuthored(siteRoot, notesPath, plan), null, 2) + '\n');
  } else if (mode === 'pack') {
    const notes = JSON.parse(readFileSync(notesPath, 'utf8'));
    mkdirSync(dirname(resolve(bundlePath)), { recursive: true });
    writeFileSync(bundlePath, JSON.stringify(pack(siteRoot, plan, notes), null, 2) + '\n');
  } else if (mode === 'apply') apply(siteRoot, JSON.parse(readFileSync(bundlePath, 'utf8')), plan);
  else throw new Error('usage: content-bundle.mjs pack|apply <plan.json> <bundle.json> [notes.json]');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2));
