import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { withPrefix } from 'gatsby';
import { Footer } from '@/features/shell/Footer';
import { Seo } from '@/features/shell/Seo';
import { Header } from '@/features/shell/Header';
import { ServicesFragment, fmt } from '@/features/landing/ServicesFragment';
import names from '@/data/names.json';

describe('Footer', () => {
  it('renders the full disclaimer verbatim and the short one for tight spaces', () => {
    render(<Footer />);
    expect(screen.getByText(/^Bankai is an independent open-source project\./)).toHaveAttribute('data-disclaimer', 'full');
    expect(screen.getByText('Independent open-source project. Not affiliated with or endorsed by any anime or manga rights holder.')).toHaveAttribute('data-disclaimer', 'short');
  });
  it('links GitHub, Sponsors and MIT and never the pricing page', () => {
    render(<Footer />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://github.com/sponsors/zheref');
    expect(hrefs).toContain('https://github.com/zheref/hatsu');
    expect(hrefs.some((h) => h?.includes('/pricing'))).toBe(false);
    expect(screen.getByText(/MIT license/)).toBeInTheDocument();
  });
  it('prints the source versions when given', () => {
    render(<Footer sources={{ hatsu: '0.159.0', nen: '0.29.0', handbooks: 'v0.13', readAt: '2026-11-04' }} />);
    expect(screen.getByText(/hatsu 0\.159\.0 · nen 0\.29\.0 · handbooks v0\.13/)).toBeInTheDocument();
  });
});

describe('Header', () => {
  it('never links the pricing page', () => {
    render(<Header />);
    expect(screen.getAllByRole('link').some((a) => a.getAttribute('href')?.includes('/pricing'))).toBe(false);
  });
  it('exposes the mobile menu button with its expanded state', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });
  it('links Docs, Stages, Gates, Services and GitHub', () => {
    render(<Header />);
    for (const name of ['Docs', 'Stages', 'Gates', 'Services', 'GitHub']) expect(screen.getAllByRole('link', { name }).length).toBeGreaterThan(0);
  });
});

describe('Seo', () => {
  it('uses the positioning subhead as the default description', () => {
    const { container } = render(<Seo />);
    expect(container.querySelector('meta[name="description"]')).toHaveAttribute('content', expect.stringContaining('open-source, AI-driven development lifecycle'));
  });
  it('adds noindex only when asked', () => {
    const a = render(<Seo noindex />);
    expect(a.container.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    a.unmount();
    const b = render(<Seo />);
    expect(b.container.querySelector('meta[name="robots"]')).toBeNull();
  });
  it('builds the canonical url from the site config', () => {
    const { container } = render(<Seo pathname="/docs/" title="Docs" />);
    expect(container.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://bankai.zheref.dev/docs/');
    expect(container.querySelector('title')).toHaveTextContent('Docs · bankai');
  });
  it('carries the Pages path prefix once in the canonical and og:url', () => {
    vi.mocked(withPrefix).mockImplementation((path: string) => `/bankai-site${path}`);
    try {
      const { container } = render(<Seo pathname="/docs/" title="Docs" />);
      expect(container.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://bankai.zheref.dev/bankai-site/docs/');
      expect(container.querySelector('meta[property="og:url"]')).toHaveAttribute('content', 'https://bankai.zheref.dev/bankai-site/docs/');
    } finally {
      vi.mocked(withPrefix).mockImplementation((path: string) => path);
    }
  });
});

describe('Services (commercial copy)', () => {
  it('shows From and the TBD tag while prices are unset', () => {
    render(<ServicesFragment />);
    expect(screen.getAllByText('From').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TBD').length).toBeGreaterThan(0);
    expect(screen.getByText('$2,500')).toBeInTheDocument();
  });
  it('contains no character name and no code name', () => {
    const { container } = render(<ServicesFragment />);
    const text = container.textContent?.toLowerCase() ?? '';
    for (const n of names.characterNames) expect(text).not.toMatch(new RegExp(`\\b${n}\\b`));
    for (const n of ['mukai', 'getsuga', 'rasengan', 'sharingan']) expect(text).not.toContain(n);
  });
  it('formats money and returns null for an unset amount', () => {
    expect(fmt({ amount: 2500, currency: 'USD', tbd: true })).toBe('$2,500');
    expect(fmt({ amount: null, currency: 'USD', tbd: true })).toBeNull();
  });
});
