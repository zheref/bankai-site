import * as React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { Header } from './Header';
import { Footer } from './Footer';
import { t } from '@/library/i18n';

export function useSourceVersions() {
  const data = useStaticQuery<{ allSourceRepo: { nodes: Array<{ name: string; version: string; commit: string; readAt: string; skillCount: number | null; agentCount: number | null; verbCount: number | null }> } }>(graphql`
    query SourceVersions { allSourceRepo { nodes { name version commit readAt skillCount agentCount verbCount } } }
  `);
  const by = Object.fromEntries(data.allSourceRepo.nodes.map((n) => [n.name, n]));
  return by as Record<'hatsu' | 'nen' | 'handbooks', (typeof data.allSourceRepo.nodes)[number]>;
}

export function Layout({ children, main = true }: { children: React.ReactNode; main?: boolean }) {
  const v = useSourceVersions();
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">{t('nav.skip')}</a>
      <Header />
      {main ? <main id="main" className="flex-1">{children}</main> : <div id="main" className="flex-1">{children}</div>}
      <Footer sources={{ hatsu: v.hatsu?.version, nen: v.nen?.version, handbooks: v.handbooks?.version, readAt: v.hatsu?.readAt }} />
    </div>
  );
}
