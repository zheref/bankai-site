import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Gatsby's Link and static queries are not available under jsdom: stub the module for component tests.
vi.mock('gatsby', async () => {
  const React = await import('react');
  return {
    Link: ({ to, children, activeClassName: _a, ...rest }: { to: string; children: React.ReactNode; activeClassName?: string } & Record<string, unknown>) => React.createElement('a', { href: to, ...rest }, children),
    // Identity by default (no path prefix); a test may stand in a prefix with vi.mocked(withPrefix).
    withPrefix: vi.fn((path: string) => path),
    graphql: () => '',
    useStaticQuery: vi.fn(() => { throw new Error('useStaticQuery must be mocked per test'); }),
    navigate: vi.fn(),
  };
});
