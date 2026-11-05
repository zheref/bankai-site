import * as React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { mockStaticQuery } from '../helpers/staticQuery';
import names from '@/data/names.json';
import { HeroFragment } from '@/features/landing/HeroFragment';
import { ProblemFragment } from '@/features/landing/ProblemFragment';
import { LayersFragment } from '@/features/landing/LayersFragment';
import { StagesFragment } from '@/features/landing/StagesFragment';
import { ArchitectureFragment } from '@/features/landing/ArchitectureFragment';
import { QuickStartFragment } from '@/features/landing/QuickStartFragment';
import { OssVsCloudFragment } from '@/features/landing/OssVsCloudFragment';
import { SupportFragment } from '@/features/landing/SupportFragment';
import { FaqFragment } from '@/features/landing/FaqFragment';
import { Layout } from '@/features/shell/Layout';
import { HERO_FLOW } from '@/features/landing/terminalFlow';
import { STAGES } from '@/features/landing/stages';
import IndexPage from '@/pages/index';
import ServicesPage from '@/pages/services';
import NotFound from '@/pages/404';
import PricingPage from '@/templates/PricingPage';

beforeAll(async () => { await mockStaticQuery(); });

const pageProps = {} as unknown as Parameters<typeof IndexPage>[0];

describe('HeroFragment', () => {
  it('renders the tagline as the h1 and the one-line promise above it', () => {
    render(<HeroFragment />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Agents do the work. You hold the gates.');
    expect(screen.getByText('Agentic delivery that stops at your gates.')).toBeInTheDocument();
  });
  it('links Get started to the docs quick start and Star to the hatsu repository', () => {
    render(<HeroFragment />);
    expect(screen.getByTestId('cta-start')).toHaveAttribute('href', '/docs/getting-started/');
    expect(screen.getByRole('link', { name: /Star on GitHub/ })).toHaveAttribute('href', 'https://github.com/zheref/hatsu');
  });
  it('shows the whole terminal flow, every command from the docs spelling', () => {
    const { container } = render(<HeroFragment />);
    expect(container.querySelectorAll('.term-line')).toHaveLength(HERO_FLOW.length);
    for (const cmd of ['/kurapika', '/hatsu:aka', '/hatsu:mukai', '/hatsu:en on HA#12']) expect(container.textContent).toContain(cmd);
  });
});

describe('ProblemFragment and LayersFragment', () => {
  it('states the problem from the positioning doc', () => {
    render(<ProblemFragment />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Agents are fast; lifecycles are messy.');
  });
  it('lists the three live parts with versions and the two coming-later parts', () => {
    render(<LayersFragment />);
    expect(screen.getByRole('heading', { name: 'Nen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hatsu' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bankai-Handbooks' })).toBeInTheDocument();
    expect(screen.getAllByText('Coming later')).toHaveLength(2);
    expect(screen.getAllByText(/^v\d/).length).toBeGreaterThanOrEqual(3);
  });
  it('quotes the live skill and agent counts in the Hatsu card', () => {
    render(<LayersFragment />);
    expect(screen.getByText(/60\+ skills, 17 agents/)).toBeInTheDocument();
  });
});

describe('StagesFragment', () => {
  it('renders the eight stages in order, each Available because every skill exists', () => {
    const { container } = render(<StagesFragment />);
    const cards = container.querySelectorAll('[data-stage]');
    expect([...cards].map((c) => c.getAttribute('data-stage'))).toEqual(STAGES.map((s) => s.id));
    expect([...cards].every((c) => c.getAttribute('data-status') === 'available')).toBe(true);
  });
  it('names every skill by code name plus alias, linking into the Hatsu guide', () => {
    render(<StagesFragment />);
    const aka = screen.getByRole('link', { name: /^aka · push$/ });
    expect(aka).toHaveAttribute('href', '/docs/hatsu-guide/#skill-aka');
    expect(screen.getByRole('link', { name: /^getsuga · release$/ })).toBeInTheDocument();
  });
  it('covers every skill STAGES names with an alias from the names map', () => {
    for (const s of STAGES) for (const n of s.skills) expect((names.skills as Record<string, { alias: string }>)[n]?.alias, n).toBeTruthy();
  });
});

describe('ArchitectureFragment', () => {
  it('starts with Hatsu selected and shows its detail', () => {
    render(<ArchitectureFragment />);
    expect(screen.getByRole('button', { name: /Hatsu/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/The governance harness/)).toBeInTheDocument();
  });
  it('selects a gate and renders its clause and delegability', () => {
    render(<ArchitectureFragment />);
    fireEvent.click(screen.getByRole('button', { name: /^G3/ }));
    const panel = screen.getByRole('heading', { level: 3, name: /G3/ });
    expect(panel).toHaveTextContent('CON-6');
    expect(screen.getByText('Delegable?')).toBeInTheDocument();
  });
  it('marks the Cloud tier and the Library as not live', () => {
    render(<ArchitectureFragment />);
    expect(screen.getByRole('button', { name: /Cloud tier/ })).toHaveTextContent('Coming later');
    expect(screen.getByRole('button', { name: /Bankai-Library/ })).toHaveTextContent('Roadmap');
    fireEvent.click(screen.getByRole('button', { name: /Bankai-Library/ }));
    expect(screen.getByText(/Not created yet/)).toBeInTheDocument();
  });
});

describe('QuickStartFragment', () => {
  it('renders one tab per surface and the Claude Code install first', () => {
    render(<QuickStartFragment />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('hatsu_surface_link.sh');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('/kurapika <request>');
  });
  it('switches to the Codex surface with its own spelling', () => {
    render(<QuickStartFragment />);
    fireEvent.click(screen.getByRole('tab', { name: 'Codex' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('$hatsu:ten');
  });
  it('shows the Nen bootstrap at the pinned ref from hatsu nen/contract.json', () => {
    render(<QuickStartFragment />);
    expect(screen.getAllByText(/v0\.\d+\.\d+/).length).toBeGreaterThan(0);
    expect(screen.getByText(/pinned_ref v0\.\d+\.\d+/)).toBeInTheDocument();
  });
});

describe('OssVsCloudFragment, SupportFragment, FaqFragment', () => {
  it('compares open source and the Cloud tier with Included / Coming later / Not included cells', () => {
    render(<OssVsCloudFragment />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText(/Included$/).length).toBeGreaterThan(5);
    expect(screen.getAllByText(/Coming later$/).length).toBeGreaterThan(3);
    expect(screen.getAllByText(/Not included$/).length).toBe(3);
    expect(screen.getByText(/never for customers' work/)).toBeInTheDocument();
  });
  it('renders the sponsor button and the empty wall', () => {
    render(<SupportFragment />);
    expect(screen.getByTestId('sponsor-button')).toHaveAttribute('href', 'https://github.com/sponsors/zheref');
    expect(screen.getByTestId('sponsor-wall')).toHaveTextContent('No sponsors yet');
  });
  it('renders the eight FAQ entries with their answers', () => {
    render(<FaqFragment />);
    expect(document.querySelectorAll('details > summary')).toHaveLength(8);
    expect(screen.getByText(/own key or subscription on the surface you run/)).toBeInTheDocument();
  });
});

describe('Layout and pages', () => {
  it('wraps content with a skip link, header, main and footer carrying the source versions', () => {
    render(<Layout><p>body</p></Layout>);
    expect(screen.getByText('Skip to content')).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveTextContent('body');
    expect(document.querySelectorAll('#main')).toHaveLength(1);
    expect(screen.getByText(/hatsu 0\.\d+\.\d+ · nen 0\.\d+\.\d+/)).toBeInTheDocument();
  });
  it('renders the landing page with every section id the nav and the screenshots use', () => {
    const { container } = render(<IndexPage {...pageProps} />);
    for (const id of ['hero', 'problem', 'how', 'stages', 'architecture', 'quickstart', 'open-source', 'support', 'services', 'faq']) expect(container.querySelector(`#${id}`), id).not.toBeNull();
  });
  it('renders the services page with an h1 and no character name, and the 404 page', () => {
    const { container, unmount } = render(<ServicesPage {...pageProps} />);
    expect(within(container).getByRole('heading', { level: 1 })).toHaveTextContent('Governed AI delivery setup');
    const text = container.textContent?.toLowerCase() ?? '';
    for (const n of names.characterNames) expect(text).not.toMatch(new RegExp(`\\b${n}\\b`));
    unmount();
    render(<NotFound {...pageProps} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('No gate here.');
  });
  it('renders the pricing page with every tier TBD-tagged and the Cloud tier label only', () => {
    const { container } = render(<PricingPage {...pageProps} />);
    expect(container.querySelectorAll('[data-tier]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-tbd="true"]').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cloud tier');
  });
});
