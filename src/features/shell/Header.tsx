import * as React from 'react';
import { Link } from 'gatsby';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Wordmark } from '@/design/Wordmark';
import { Mark } from '@/design/Mark';
import { ThemeToggle } from '@/design/ThemeToggle';

const links = [
  { to: '/docs/', label: t('nav.docs') },
  { to: '/#stages', label: t('nav.stages') },
  { to: '/#gates', label: t('nav.gates') },
  { to: '/services/', label: t('nav.services') },
];

/** The site header. The hidden pricing page is never linked here. */
export function Header() {
  const [open, setOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-x flex min-h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 no-underline text-text" aria-label="bankai home">
          <Mark tier="bankai" size={28} title="" />
          <Wordmark size="text-2xl" />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="min-h-11 inline-flex items-center px-3 text-sm font-medium text-muted no-underline hover:text-text">{l.label}</Link>
          ))}
          <a href={siteConfig.github.hatsu} rel="noopener" className="min-h-11 inline-flex items-center px-3 text-sm font-medium text-muted no-underline hover:text-text">{t('nav.github')}</a>
          <ThemeToggle className="ml-2" />
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line" aria-label={t('nav.menu')}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">{open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          </button>
        </div>
      </div>
      <nav id="mobile-nav" aria-label="Primary mobile" hidden={!open} className="border-t border-line md:hidden">
        <ul className="container-x flex flex-col py-2">
          {links.map((l) => (
            <li key={l.to}><Link to={l.to} onClick={() => setOpen(false)} className="block min-h-11 py-2 text-base text-text no-underline">{l.label}</Link></li>
          ))}
          <li><a href={siteConfig.github.hatsu} rel="noopener" className="block min-h-11 py-2 text-base text-text no-underline">{t('nav.github')}</a></li>
        </ul>
      </nav>
    </header>
  );
}
