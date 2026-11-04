import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { frontmatter, section, tables, inlineHtml, codeBlocks, strip, esc, safeHref, redact, deepRedact, bind, latestTagOf, FORBIDDEN_TERMS } from '../../scripts/sources/lib.mjs';

describe('source parsing helpers', () => {
  it('reads top-level scalar frontmatter only', () => {
    expect(frontmatter('---\nname: aka\ndescription: "Push it"\n---\n# body')).toEqual({ name: 'aka', description: 'Push it' });
    expect(frontmatter('no frontmatter')).toEqual({});
    expect(frontmatter('---\nname: x\n  nested: y\n---')).toEqual({ name: 'x' });
  });
  it('slices a section by heading text, ignoring emoji, up to the next heading of the same level', () => {
    const md = '## 🚪 The gates\n\nrow\n\n### sub\n\nmore\n\n## Next\n\nno';
    expect(section(md, 'The gates')).toBe('\nrow\n\n### sub\n\nmore\n');
    expect(section(md, 'Missing')).toBeNull();
    expect(section(md, 'sub', 3)).toBe('\nmore\n');
  });
  it('parses tables with escaped pipes and code cells', () => {
    const [t] = tables('| a | b |\n|---|---|\n| `x\\|y` | one \\| two |\n| `p` | q |\n');
    expect(t?.header).toEqual(['a', 'b']);
    expect(t?.rows[0]).toEqual(['`x|y`', 'one | two']);
    expect(t?.rows).toHaveLength(2);
  });
  it('converts inline markdown to safe html', () => {
    expect(inlineHtml('`code` **b** *i* <tag> [t](https://x.y) [u](local.md)')).toBe('<code>code</code> <strong>b</strong> <em>i</em> &lt;tag&gt; <a href="https://x.y/" rel="noopener">t</a> u');
  });
  it('escapes quotes and refuses an href that would inject an attribute (SEC-7)', () => {
    expect(esc(`a "b" 'c'`)).toBe('a &quot;b&quot; &#39;c&#39;');
    const out = inlineHtml('[x](https://a.example/" onmouseover="alert(1))');
    expect(out).not.toContain('onmouseover="');
    expect(out).not.toContain('<a ');
    expect(safeHref('https://a.example/path?q=1')).toBe('https://a.example/path?q=1');
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('https://a.example/ b')).toBeNull();
    expect(safeHref('not a url')).toBeNull();
  });
  it('extracts fenced code blocks in order and strips markdown from keys', () => {
    expect(codeBlocks('```sh\na\n```\ntext\n```\nb\n```')).toEqual([{ lang: 'sh', code: 'a' }, { lang: 'text', code: 'b' }]);
    expect(strip('**[`aka`](x)**')).toBe('aka');
  });
});

describe('section() and fenced code', () => {
  it('does not mistake a # comment inside a code fence for a heading', () => {
    const md = '## Setup\n\n```sh\nrun.sh\n# = a comment\n```\n\nafter\n\n## Usage\n\nx';
    const s = section(md, 'Setup');
    expect(s).toContain('# = a comment');
    expect(s).toContain('after');
    expect(s).not.toContain('## Usage');
  });
});


describe('redact() and bind()', () => {
  it('maps every forbidden term to its public replacement, case-aware, and records each hit', () => {
    const report = { redactions: [] as Array<{ term: string }>, warnings: [] as string[], repos: {} };
    expect(redact('the Akatsuki roster and akatsuki.yml, Akatsuki-Agent, rlaope/nen, Bankai Cloud', 'x', report)).toBe('the Cloud tier roster and cloud-tier.yml, CI-Agent, another project/nen, Cloud tier');
    expect(report.redactions.map((r) => r.term).sort()).toEqual(['Akatsuki', 'Akatsuki-Agent', 'Bankai Cloud', 'rlaope']);
    expect(FORBIDDEN_TERMS).toContain('Akatsuki');
  });
  it('redacts nested data and leaves non-strings alone', () => {
    const report = { redactions: [] as Array<{ term: string }>, warnings: [] as string[], repos: {} };
    expect(deepRedact({ a: ['Akatsuki', 2, { b: 'rlaope' }], n: null }, 'root', report)).toEqual({ a: ['Cloud tier', 2, { b: 'another project' }], n: null });
    expect(report.redactions).toHaveLength(2);
  });
  it('binds a checkout at its pin, refuses drift by default and records it when allowed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bind-'));
    const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).toString().trim();
    git('init', '-q'); writeFileSync(join(dir, 'a'), 'a'); git('add', 'a'); git('commit', '-q', '-m', 'one', '--no-verify'); git('tag', 'v0.1.0');
    const head = git('rev-parse', 'HEAD');
    const report = { redactions: [] as Array<{ term: string }>, warnings: [] as string[], repos: {} as Record<string, unknown> };
    expect(bind('x', dir, head, report)).toBe(head);
    expect(report.repos.x).toMatchObject({ head, pinned: head });
    expect(() => bind('x', dir, 'f'.repeat(40), report)).toThrow(/is at .* sources.json pins/);
    expect(bind('x', dir, 'f'.repeat(40), report, { allowDrift: true })).toBe(head);
    expect(report.warnings).toHaveLength(1);
    expect(() => bind('y', join(dir, 'missing'), head, report)).toThrow(/no git checkout/);
    expect(latestTagOf(dir)).toBe('v0.1.0');
    expect(latestTagOf(join(dir, 'missing'))).toBeNull();
  });
});
