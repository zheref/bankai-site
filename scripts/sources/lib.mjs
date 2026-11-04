import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const sourcesRoot = resolve(siteRoot, '.sources');
export const generatedDir = resolve(siteRoot, 'src', 'data', 'generated');

export function readSources() {
  return JSON.parse(readFileSync(resolve(siteRoot, 'sources.json'), 'utf8'));
}

/** Where a source repository's checkout is: BANKAI_SOURCE_<NAME> overrides .sources/<name>. */
export function repoDir(name) {
  const override = process.env[`BANKAI_SOURCE_${name.toUpperCase()}`];
  return override ? resolve(override) : resolve(sourcesRoot, name);
}

export function headOf(dir) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

export function read(dir, rel) {
  const p = resolve(dir, rel);
  if (!existsSync(p)) throw new Error(`missing ${rel} under ${dir}`);
  return readFileSync(p, 'utf8');
}

/** YAML-ish frontmatter: only top-level `key: value` scalars, which is all SKILL.md and agent files carry. */
export function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line || line.startsWith(' ')) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

/** The lines of the section under `heading` (a `## ` or `### ` line matched by its text, emoji ignored) up to the next heading of the same or higher level. */
export function section(text, heading, level = 2) {
  const lines = text.split(/\r?\n/);
  const hashes = '#'.repeat(level);
  const norm = (s) => s.replace(/[^\p{L}\p{N} ]/gu, '').trim().toLowerCase();
  const start = lines.findIndex((l) => l.startsWith(hashes + ' ') && norm(l.slice(level)).includes(norm(heading)));
  if (start < 0) return null;
  const out = [];
  let fenced = false; // a `# comment` inside a fenced code block is not a heading
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) fenced = !fenced;
    if (!fenced && /^#{1,6} /.test(l) && l.indexOf(' ') <= level) break;
    out.push(l);
  }
  return out.join('\n');
}

/** Every markdown table in `text`: header cells and rows (cells as raw inline markdown). */
export function tables(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const header = cells(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(cells(lines[i]));
        i++;
      }
      out.push({ header, rows });
    } else i++;
  }
  return out;
}

function cells(line) {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const out = [];
  let cur = '';
  let inCode = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '`') inCode = !inCode;
    if (ch === '\\' && t[i + 1] === '|') { cur += '|'; i++; continue; }
    if (ch === '|' && !inCode) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Rows of a table keyed by its first column, backticks stripped from the key. */
export function keyed(table) {
  const out = {};
  for (const r of table.rows) out[strip(r[0])] = r;
  return out;
}

export const strip = (s) => s.replace(/[`*]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();

/** Fenced code blocks in order: { lang, code }. */
export function codeBlocks(text) {
  const out = [];
  const re = /```([\w-]*)\r?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) out.push({ lang: m[1] || 'text', code: m[2].replace(/\s+$/, '') });
  return out;
}

/** A tiny inline-markdown → HTML converter for table cells and one-line descriptions: code, bold, italic, links (kept as text with href). */
export function inlineHtml(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let s = esc(md);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => (/^https?:/.test(href) ? `<a href="${href}" rel="noopener">${t}</a>` : t));
  s = s.replace(/&lt;br\/?&gt;/g, '<br/>');
  return s;
}
