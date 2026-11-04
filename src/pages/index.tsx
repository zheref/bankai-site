import * as React from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import { Layout } from '@/features/shell/Layout';
import { Seo } from '@/features/shell/Seo';
import { HeroFragment } from '@/features/landing/HeroFragment';
import { ProblemFragment } from '@/features/landing/ProblemFragment';
import { LayersFragment } from '@/features/landing/LayersFragment';
import { StagesFragment } from '@/features/landing/StagesFragment';
import { ArchitectureFragment } from '@/features/landing/ArchitectureFragment';
import { QuickStartFragment } from '@/features/landing/QuickStartFragment';
import { OssVsCloudFragment } from '@/features/landing/OssVsCloudFragment';
import { SupportFragment } from '@/features/landing/SupportFragment';
import { ServicesFragment } from '@/features/landing/ServicesFragment';
import { FaqFragment } from '@/features/landing/FaqFragment';

const IndexPage: React.FC<PageProps> = () => (
  <Layout>
    <HeroFragment />
    <ProblemFragment />
    <LayersFragment />
    <StagesFragment />
    <ArchitectureFragment />
    <QuickStartFragment />
    <OssVsCloudFragment />
    <SupportFragment />
    <ServicesFragment />
    <FaqFragment />
  </Layout>
);

export default IndexPage;
export const Head: HeadFC = () => <Seo pathname="/" />;
