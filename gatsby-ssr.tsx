import * as React from 'react';
import type { GatsbySSR } from 'gatsby';
import { themeBootScript } from './src/library/AppTheme';
import faviconSvg from './src/brand/logo/favicon/favicon.svg';
import faviconIco from './src/brand/logo/favicon/favicon.ico';
import appleTouch from './src/brand/logo/favicon/apple-touch-icon.png';

export const onRenderBody: GatsbySSR['onRenderBody'] = ({ setHtmlAttributes, setHeadComponents, setPreBodyComponents }) => {
  setHtmlAttributes({ lang: 'en' });
  // No font preload on purpose: measured with Lighthouse's simulated mobile throttling, preloading the display font moved the landing LCP from ~1.4-1.8 s to ~2.3-2.6 s (the swap repaint becomes the LCP candidate); font-display: swap with the latin subsets stays fastest.
  setHeadComponents([
    // The theme-aware SVG favicon first, the .ico as the fallback (brand asset README).
    <link key="icon-svg" rel="icon" type="image/svg+xml" href={faviconSvg} />,
    <link key="icon-ico" rel="icon" href={faviconIco} sizes="16x16 32x32 48x48" />,
    <link key="apple" rel="apple-touch-icon" href={appleTouch} />,
  ]);
  setPreBodyComponents([<script key="theme" dangerouslySetInnerHTML={{ __html: themeBootScript }} />]);
};
