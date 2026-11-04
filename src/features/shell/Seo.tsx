import * as React from 'react';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import tokens from '@/brand/tokens.json';

/** Head content for a page. Never names a show or an anime title in metadata; the description is the positioning subhead unless a page states its own. */
export function Seo({ title, description, pathname = '/', noindex = false }: { title?: string; description?: string; pathname?: string; noindex?: boolean }) {
  const full = title ? t('meta.titleTemplate', 'en', { title }) : t('meta.title');
  const desc = description ?? t('meta.description');
  const url = `${siteConfig.siteUrl}${pathname}`;
  return (
    <>
      <title>{full}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="bankai" />
      <meta name="twitter:card" content="summary" />
      <meta name="theme-color" content={tokens.colors.dark.bg} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
    </>
  );
}
