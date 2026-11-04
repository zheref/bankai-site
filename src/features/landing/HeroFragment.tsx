import * as React from 'react';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Wordmark } from '@/design/Wordmark';
import { Button } from '@/design/Button';
import { Terminal } from '@/design/Terminal';
import { Mark } from '@/design/Mark';
import { HERO_FLOW } from './terminalFlow';

export function HeroFragment() {
  return (
    <section id="hero" aria-labelledby="hero-title" className="relative overflow-hidden py-16 sm:py-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="font-mono text-sm uppercase tracking-widest text-accent">{t('hero.promise')}</p>
          <div className="mt-4"><Wordmark size="text-6xl sm:text-7xl" /></div>
          <h1 id="hero-title" className="mt-4 text-4xl font-semibold sm:text-5xl">{t('hero.headline')}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t('hero.subhead')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/docs/getting-started/" data-testid="cta-start">{t('hero.ctaStart')}</Button>
            <Button variant="secondary" href={siteConfig.github.hatsu}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" /></svg>
              {t('hero.ctaStar')}
            </Button>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-muted">
            <Mark tier="cloud" size={18} title="" />
            <span>{t('hero.comingLater')}</span>
          </p>
        </div>
        <div className="min-w-0">
          <Terminal lines={HERO_FLOW} title="claude code · a request to Ready" />
          <p className="mt-3 text-sm text-muted">{t('hero.terminalCaption')}</p>
        </div>
      </div>
    </section>
  );
}
