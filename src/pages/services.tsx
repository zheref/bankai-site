import * as React from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import { Layout } from '@/features/shell/Layout';
import { Seo } from '@/features/shell/Seo';
import { ServicesFragment } from '@/features/landing/ServicesFragment';
import { SupportFragment } from '@/features/landing/SupportFragment';
import { t } from '@/library/i18n';
import { siteConfig } from '@config';

/** The commercial page: aliases first, never a code name or a character name (tests/build/pricing-hidden.test.ts). */
const ServicesPage: React.FC<PageProps> = () => (
  <Layout>
    <ServicesFragment titleAs="h1" />
    <p className="container-x -mt-10 mb-10 text-sm text-muted">{t('services.aliasNote')}</p>
    <SupportFragment />
  </Layout>
);

export default ServicesPage;
export const Head: HeadFC = () => <Seo title={t('services.title')} description={t('services.lead', 'en', { provider: siteConfig.services.provider })} pathname="/services/" />;
