#!/usr/bin/env node
/**
 * The path-prefix guard for a GitHub Pages project site: after a prefixed build, every root-absolute href and src
 * in public/**.html must sit under the prefix exactly once, and the canonical URLs and the sitemap must carry it.
 * A link that misses the prefix 404s on github.io, and one that carries it twice 404s too; both fail the deploy
 * here instead of on the live site. No prefix (a custom domain) → nothing to check.
 *
 *   PATH_PREFIX=/bankai-site GATSBY_SITE_URL=https://zheref.github.io node scripts/pages/check-prefix.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const prefix = (process.env.PATH_PREFIX ?? '').replace(/\/+$/, '');
const origin = (process.env.GATSBY_SITE_URL ?? '').replace(/\/+$/, '');
if (!prefix) {
  console.log('check-prefix: no PATH_PREFIX (custom domain); nothing to check');
  process.exit(0);
}
if (!existsSync(pub)) throw new Error('check-prefix: public/ is missing; run the build first');

const htmlFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
const problems = [];
let checked = 0;
for (const file of htmlFiles(pub)) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(pub, file);
  for (const [, attr, url] of html.matchAll(/\b(href|src)="(\/(?!\/)[^"]*)"/g)) {
    checked++;
    if (!url.startsWith(`${prefix}/`) && url !== prefix) problems.push(`${rel}: ${attr}="${url}" misses ${prefix}`);
    else if (url.startsWith(`${prefix}${prefix}/`)) problems.push(`${rel}: ${attr}="${url}" carries ${prefix} twice`);
  }
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (canonical && origin && !canonical.startsWith(`${origin}${prefix}/`)) problems.push(`${rel}: canonical ${canonical} is not under ${origin}${prefix}/`);
}
const sitemap = join(pub, 'sitemap-0.xml');
if (existsSync(sitemap) && origin) {
  for (const [, loc] of readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)) if (!loc.startsWith(`${origin}${prefix}/`)) problems.push(`sitemap-0.xml: ${loc} is not under ${origin}${prefix}/`);
}
if (problems.length) {
  console.error(problems.slice(0, 50).join('\n'));
  console.error(`check-prefix: ${problems.length} problem(s) over ${checked} root-absolute URLs`);
  process.exit(1);
}
console.log(`check-prefix: ${checked} root-absolute URLs all under ${prefix}; canonical and sitemap under ${origin}${prefix}/`);
