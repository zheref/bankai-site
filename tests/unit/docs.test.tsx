import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockStaticQuery, buildStaticData } from '../helpers/staticQuery';
import { docsComponents, DocsDataContext, type DocsData, SkillCatalogue, AgentRoster, LeadAgent, GatesTable, TiersTable, ProfilesTable, HumanPhases, ConfigFiles, NenVerbs, HandbookFamilies, UxRules, Changelog, Versions, NenPin, SourceStamp, Name } from '@/features/docs/DocsComponents';
import { Snippet } from '@/design/Snippet';
import { DocsSearch } from '@/features/docs/Search';
import { DOCS_NAV, docPath } from '@/features/docs/DocsNav';
import DocPage from '@/templates/DocPage';

const data = buildStaticData();
beforeAll(async () => { await mockStaticQuery(data); });
const Docs = ({ children }: { children: React.ReactNode }) => <DocsDataContext.Provider value={data as unknown as DocsData}>{children}</DocsDataContext.Provider>;

describe('docs data components', () => {
  it('renders every skill with code name, alias and its repository path, grouped', () => {
    const { container } = render(<Docs><SkillCatalogue /></Docs>);
    const items = container.querySelectorAll('[data-skill]');
    expect(items.length).toBeGreaterThanOrEqual(60);
    const aka = container.querySelector('[data-skill="aka"]');
    expect(aka).toHaveTextContent('aka');
    expect(aka).toHaveTextContent('push');
    expect(aka?.querySelector('a')).toHaveAttribute('href', expect.stringContaining('claude/skills/aka/SKILL.md'));
    expect(container.querySelector('[data-skill="shibari"]')).toHaveTextContent('Proposed: musubi');
  });
  it('renders the lead agent with six modes and the sixteen other agents with aliases', () => {
    const { container } = render(<Docs><><LeadAgent /><AgentRoster /></></Docs>);
    expect(container.querySelector('#agent-kurapika')).toHaveTextContent('Lead');
    expect(container.querySelectorAll('#agent-kurapika tbody tr')).toHaveLength(6);
    expect(container.querySelectorAll('[data-agent]')).toHaveLength(16);
    expect(container.querySelector('[data-agent="feitan"]')).toHaveTextContent('Security');
  });
  it('renders the gates, tiers, profiles, human phases and config tables from the repository', () => {
    const { container } = render(<Docs><><GatesTable /><TiersTable /><ProfilesTable /><HumanPhases /><ConfigFiles /></></Docs>);
    expect(screen.getByTestId('gates-table')).toHaveTextContent('G5');
    expect(screen.getByTestId('tiers-table')).toHaveTextContent('frontier');
    expect(container.textContent).toContain('thorough');
    expect(screen.getByTestId('human-phases')).toHaveTextContent('merge');
    expect(screen.getByTestId('config-files')).toHaveTextContent('nen/contract.json');
  });
  it('renders the Nen verb index by family, the handbook families, the UX rules and the changelogs', () => {
    render(<Docs><><NenVerbs /><HandbookFamilies /><UxRules /><Changelog repo="hatsu" /><Changelog repo="nen" /></></Docs>);
    expect(screen.getByTestId('nen-verbs').querySelectorAll('tr[id^="verb-"]').length).toBeGreaterThan(100);
    expect(screen.getByTestId('handbook-families')).toHaveTextContent('UX-{n}');
    expect(screen.getAllByText(/^UX-1$/).length).toBe(1);
    expect(screen.getByTestId('changelog-hatsu').querySelectorAll('section').length).toBeGreaterThan(3);
    expect(screen.getByTestId('changelog-nen')).toHaveTextContent('v0.29.0');
  });
  it('renders the versions, the pin and the source stamp, and a Name with a proposed rename', () => {
    const { container } = render(<Docs><><Versions /><NenPin /><SourceStamp /><Name code="shibari" alias="PR body and open" proposed="musubi" /></></Docs>);
    expect(container.textContent).toMatch(/Hatsu plugin v0\.\d+/);
    expect(container.textContent).toContain('dependency.pinned_ref');
    expect(container.textContent).toMatch(/Read from the repositories at commit/);
    expect(screen.getByText(/Proposed: musubi/)).toBeInTheDocument();
    expect(Object.keys(docsComponents)).toEqual(expect.arrayContaining(['table', 'pre', 'Snippet', 'SkillCatalogue']));
  });
});

describe('Snippet', () => {
  it('renders the highlighted html of a collected snippet with its source line', () => {
    const { container } = render(<Snippet id="nen-bootstrap" showSource caption="nen" />);
    expect(container.querySelector('pre.shiki')).not.toBeNull();
    expect(container.textContent).toContain('bootstrap/nen.sh');
    expect(container.textContent).toContain('source:');
  });
  it('copies the code to the clipboard and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Snippet id="nen-bootstrap" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('nen-bootstrap.sh'));
  });
  it('says so when the clipboard refuses, never a silent Copy', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<Snippet id="nen-bootstrap" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Copy failed/ })).toBeInTheDocument());
  });
  it('throws on an unknown snippet id rather than rendering nothing', () => {
    expect(() => render(<Snippet id="nope" />)).toThrow(/unknown snippet/);
  });
});

describe('DocsSearch and DocsNav', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ entries: [{ id: 'skill:aka', title: 'aka · push', text: 'push the branch', url: '/docs/hatsu-guide/#skill-aka', kind: 'skill' }, { id: 'doc:concepts', title: 'Concepts', text: 'the loop and the gates', url: '/docs/concepts/', kind: 'page' }] }) }));
  });
  it('loads the index on focus and lists matching entries', async () => {
    render(<DocsSearch />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'aka' } });
    await waitFor(() => expect(screen.getByRole('link', { name: /aka · push/ })).toHaveAttribute('href', '/docs/hatsu-guide/#skill-aka'));
    expect(screen.getByRole('list', { name: 'Search results' })).toBeInTheDocument();
  });
  it('says No results for a query nothing matches', async () => {
    render(<DocsSearch />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzzzzz' } });
    await waitFor(() => expect(screen.getAllByText('No results').length).toBeGreaterThan(0));
  });
  it('reports a failed index load instead of waiting forever, and Escape clears the query', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));
    render(<DocsSearch />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'aka' } });
    await waitFor(() => expect(screen.getAllByText(/HTTP 404/).length).toBeGreaterThan(0));
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
  });
  it('maps the nine docs pages to their paths', () => {
    expect(DOCS_NAV).toHaveLength(9);
    expect(docPath('index')).toBe('/docs/');
    expect(docPath('concepts')).toBe('/docs/concepts/');
  });
});

describe('DocPage template', () => {
  const pageData = { ...data, mdx: { frontmatter: { slug: 'concepts', title: 'Concepts', description: 'The loop' }, tableOfContents: { items: [{ url: '#the-loop', title: 'The loop' }] } } };
  const props = (d: unknown, children: React.ReactNode) => ({ data: d, children } as unknown as Parameters<typeof DocPage>[0]);
  it('renders the title, description, nav, search and table of contents around the MDX children', () => {
    render(<DocPage {...props(pageData, <p>mdx body</p>)} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Concepts');
    expect(screen.getByText('mdx body')).toBeInTheDocument();
    expect(screen.getByTestId('docs-nav').querySelectorAll('a')).toHaveLength(9);
    expect(screen.getByRole('link', { name: 'The loop' })).toHaveAttribute('href', '#the-loop');
  });
  it('omits the table of contents when the page has no headings', () => {
    const noToc = { ...pageData, mdx: { ...pageData.mdx, tableOfContents: {} } };
    render(<DocPage {...props(noToc, <p>x</p>)} />);
    expect(screen.queryByRole('navigation', { name: 'On this page' })).toBeNull();
  });
  it('renders the table and pre wrappers as focusable scroll regions', () => {
    const Table = docsComponents.table;
    const Pre = docsComponents.pre;
    const { container } = render(<><Table><tbody><tr><td>cell</td></tr></tbody></Table><Pre>code</Pre></>);
    expect(container.querySelector('.table-scroll')).toHaveAttribute('tabindex', '0');
    expect(container.querySelector('pre')).toHaveAttribute('tabindex', '0');
  });
});
