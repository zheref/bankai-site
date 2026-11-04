import { frontmatter, section, tables, inlineHtml, codeBlocks, strip } from '../../scripts/sources/lib.mjs';

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
    expect(inlineHtml('`code` **b** *i* <tag> [t](https://x.y) [u](local.md)')).toBe('<code>code</code> <strong>b</strong> <em>i</em> &lt;tag&gt; <a href="https://x.y" rel="noopener">t</a> u');
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
