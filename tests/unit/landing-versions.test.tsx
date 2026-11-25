import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import { buildStaticData, mockStaticQuery } from '../helpers/staticQuery';
import { VersionsFragment } from '@/features/landing/VersionsFragment';

beforeEach(async () => { await mockStaticQuery(); });

describe('VersionsFragment', () => {
  it('shows all three products with the collected SourceRepo versions', () => {
    render(<VersionsFragment />);
    const region = screen.getByRole('region', { name: 'Current versions' });
    const labels = { hatsu: 'Hatsu', nen: 'Nen', handbooks: 'Bankai-Handbooks' };
    for (const repo of buildStaticData().allSourceRepo.nodes) {
      const label = within(region).getByText(labels[repo.name as keyof typeof labels]);
      expect(label.nextElementSibling).toHaveTextContent(`v${repo.version.replace(/^v/, '')}`);
    }
    expect(within(region).getAllByRole('definition')).toHaveLength(3);
  });

  it('explains the build-time data and links to the changelog', () => {
    render(<VersionsFragment />);
    expect(screen.getByText('Read from the repositories at build time.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/docs/changelog/');
  });

  it.each([
    ['0.168.0', '0.31.0', 'v0.13'],
    ['v1.2.3', '2.3.4', 'v3.4.5'],
  ])('follows rebuilt source versions %s / %s / %s without copy edits', async (hatsu, nen, handbooks) => {
    const data = buildStaticData();
    const versions: Record<string, string> = { hatsu, nen, handbooks };
    data.allSourceRepo.nodes = data.allSourceRepo.nodes.map((repo) => ({ ...repo, version: versions[repo.name] ?? repo.version })).reverse();
    // The site's Nen source version is independent of the version Hatsu bootstraps.
    data.nenDependency.pinnedRef = 'v0.0.1';
    await mockStaticQuery(data);
    render(<VersionsFragment />);
    expect(screen.getAllByRole('definition').map((node) => node.textContent)).toEqual(
      [hatsu, nen, handbooks].map((version) => `v${version.replace(/^v/, '')}`),
    );
    expect(screen.queryByText('v0.0.1')).not.toBeInTheDocument();
  });
});
