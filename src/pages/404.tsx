import * as React from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import { Layout } from '@/features/shell/Layout';
import { Seo } from '@/features/shell/Seo';
import { Button } from '@/design/Button';

const NotFound: React.FC<PageProps> = () => (
  <Layout>
    <section className="container-x py-24">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold">No gate here.</h1>
      <p className="mt-3 text-muted">The page you asked for does not exist.</p>
      <Button to="/" className="mt-6">Back to the start</Button>
    </section>
  </Layout>
);
export default NotFound;
export const Head: HeadFC = () => <Seo title="Not found" pathname="/404/" noindex />;
