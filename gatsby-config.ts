// This file is also this tree's stack MARKER -- `nen shu detect` reads it.
import type { GatsbyConfig } from 'gatsby';
import { siteConfig } from './site.config';

const showPricing = process.env.SHOW_PRICING === 'true';

const config: GatsbyConfig = {
  siteMetadata: {
    title: siteConfig.siteTitle,
    siteUrl: siteConfig.siteUrl,
    description: 'Bankai is an open-source, AI-driven development lifecycle for Claude Code, Codex, Cursor and Antigravity. Deterministic CLI ops, governed agents, per-stack handbooks.',
    showPricing,
  },
  graphqlTypegen: false,
  trailingSlash: 'always',
  plugins: [
    'gatsby-plugin-postcss',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    'gatsby-source-bankai',
    { resolve: 'gatsby-source-filesystem', options: { name: 'docs', path: `${__dirname}/src/content/docs` } },
    {
      resolve: 'gatsby-plugin-mdx',
      options: {
        extensions: ['.mdx'],
        mdxOptions: { remarkPlugins: [require('remark-gfm')] },
      },
    },
    {
      resolve: 'gatsby-plugin-sitemap',
      options: {
        // The hidden pricing page is never in the sitemap, flag or no flag.
        excludes: [siteConfig.pricing.path, '/404/', '/404.html', '/dev-404-page/'],
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'bankai',
        short_name: 'bankai',
        start_url: '/',
        background_color: '#0A0C10',
        theme_color: '#0A0C10',
        display: 'minimal-ui',
        icons: [
          { src: 'src/brand/logo/favicon/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'src/brand/logo/favicon/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'src/brand/logo/favicon/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        include_favicon: false,
      },
    },
  ],
};

export default config;
