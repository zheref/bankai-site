import * as React from 'react';
import { Link } from 'gatsby';
import { t } from '@/library/i18n';
import { useLandingData } from './useLandingData';

/** The same SourceRepo versions as the docs, collected from this build's pins. */
export function VersionsFragment() {
  const { repos } = useLandingData();
  const versions = (['hatsu', 'nen', 'handbooks'] as const).map((name) => {
    const version = repos[name]?.version;
    if (!version) throw new Error(`Missing build-time source version: ${name}`);
    return { name, version: `v${version.replace(/^v/, '')}` };
  });
  return (
    <section id="versions" aria-labelledby="versions-title" className="container-x">
      <div className="surface flex flex-wrap items-center justify-between gap-6 p-6">
        <div>
          <h2 id="versions-title" className="text-xl font-semibold">{t('versions.title')}</h2>
          <p className="mt-2 text-sm text-muted">{t('versions.lead')}</p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-4">
          {versions.map(({ name, version }) => (
            <div key={name}>
              <dt className="text-sm text-muted">{t(`layers.${name}.name`)}</dt>
              <dd className="mt-1 font-mono text-accent">{version}</dd>
            </div>
          ))}
        </dl>
        <Link to="/docs/changelog/" className="inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline">Changelog</Link>
      </div>
    </section>
  );
}
