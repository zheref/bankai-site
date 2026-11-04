import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Gatsby's Link and static queries are not available under jsdom: stub the module for component tests.
vi.mock('gatsby', async () => {
  const React = await import('react');
  return {
    Link: ({ to, children, activeClassName: _a, ...rest }: { to: string; children: React.ReactNode; activeClassName?: string } & Record<string, unknown>) => React.createElement('a', { href: to, ...rest }, children),
    graphql: () => '',
    useStaticQuery: () => { throw new Error('useStaticQuery must be mocked per test'); },
    navigate: vi.fn(),
  };
});
