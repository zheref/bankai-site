import * as React from 'react';
import { Link } from 'gatsby';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Wordmark } from '@/design/Wordmark';

/** The footer: GitHub links, Sponsors, MIT, and the disclaimer verbatim (full on wide screens, short where space is tight). The hidden pricing page is never linked here. */
export function Footer({ sources }: { sources?: { hatsu?: string; nen?: string; handbooks?: string; readAt?: string } }) {
  return (
    <footer className="border-t border-line py-10" aria-label="Footer">
      <div className="container-x grid gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <Wordmark size="text-xl" />
          <p className="mt-2 text-sm text-muted">{t('footer.builtBy', 'en', { handle: siteConfig.maintainer.handle })} {t('footer.license')}.</p>
          {sources ? (
            <p className="mt-1 font-mono text-xs text-muted">
              {t('footer.sources')} hatsu {sources.hatsu} · nen {sources.nen} · handbooks {sources.handbooks} · {sources.readAt}
            </p>
          ) : null}
        </div>
        <nav aria-label="Footer links" className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <a href={siteConfig.github.hatsu} rel="noopener" className="min-h-11 inline-flex items-center text-text no-underline hover:text-accent">Hatsu on GitHub</a>
          <a href={siteConfig.github.nen} rel="noopener" className="min-h-11 inline-flex items-center text-text no-underline hover:text-accent">Nen on GitHub</a>
          <a href={siteConfig.github.handbooks} rel="noopener" className="min-h-11 inline-flex items-center text-text no-underline hover:text-accent">Handbooks on GitHub</a>
          <a href={siteConfig.github.sponsors} rel="noopener" className="min-h-11 inline-flex items-center text-text no-underline hover:text-accent">{t('footer.sponsors')}</a>
          <Link to="/docs/" className="min-h-11 inline-flex items-center text-text no-underline hover:text-accent">{t('nav.docs')}</Link>
          <Link to="/services/" className="min-h-11 inline-flex items-center text-text no-underline hover:text-accent">{t('nav.services')}</Link>
        </nav>
      </div>
      <div className="container-x mt-8">
        <p data-disclaimer="full" className="hidden text-[12px] leading-5 text-disclaimer sm:block">{t('footer.disclaimerFull')}</p>
        <p data-disclaimer="short" className="text-[12px] leading-5 text-disclaimer sm:hidden">{t('footer.disclaimerShort')}</p>
      </div>
    </footer>
  );
}
