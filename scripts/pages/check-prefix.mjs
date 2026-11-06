#!/usr/bin/env node
/**
 * The path-prefix guard for a GitHub Pages project site: after a prefixed build, every root-absolute href and src
 * in public/**.html must sit under the prefix exactly once, and the canonical URLs and the sitemap must carry it.
 * A link that misses the prefix 404s on github.io, and one that carries it twice 404s too; both fail the deploy
 * here instead of on the live site. No prefix (a custom domain) → nothing to check.
 *
 * It never passes on an absence: no HTML, no root-absolute URL, a canonical <link> it cannot parse, no canonical at
 * all, or (with an origin) no sitemap, each fails, because a guard that read nothing proves nothing.
 *
 *   PATH_PREFIX=/bankai-site GATSBY_SITE_URL=https://zheref.github.io node scripts/pages/check-prefix.mjs
 *   PAGES_PUBLIC_DIR=<dir> overrides public/ (the unit tests use it).
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = process.env.PAGES_PUBLIC_DIR ? resolve(process.env.PAGES_PUBLIC_DIR) : resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const prefix = (process.env.PATH_PREFIX ?? '').replace(/\/+$/, '');
const origin = (process.env.GATSBY_SITE_URL ?? '').replace(/\/+$/, '');
if (!prefix) {
  console.log('check-prefix: no PATH_PREFIX (custom domain); nothing to check');
  process.exit(0);
}
if (!existsSync(pub)) {
  console.error(`check-prefix: ${pub} is missing; run the build first`);
  process.exit(1);
}

const htmlFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
const files = htmlFiles(pub);
const problems = [];
let checked = 0;
let canonicals = 0;
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(pub, file);
  for (const [, attr, url] of html.matchAll(/\b(href|src)="(\/(?!\/)[^"]*)"/g)) {
    checked++;
    if (!url.startsWith(`${prefix}/`) && url !== prefix) problems.push(`${rel}: ${attr}="${url}" misses ${prefix}`);
    else if (url.startsWith(`${prefix}${prefix}/`)) problems.push(`${rel}: ${attr}="${url}" carries ${prefix} twice`);
  }
  const tags = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/g) ?? [];
  for (const tag of tags) {
    const canonical = tag.match(/\bhref="([^"]*)"/)?.[1];
    if (canonical === undefined) {
      problems.push(`${rel}: canonical <link> has no href`);
      continue;
    }
    canonicals++;
    if (origin && !canonical.startsWith(`${origin}${prefix}/`)) problems.push(`${rel}: canonical ${canonical} is not under ${origin}${prefix}/`);
    else if (origin && canonical.startsWith(`${origin}${prefix}${prefix}/`)) problems.push(`${rel}: canonical ${canonical} carries ${prefix} twice`);
  }
}
if (!files.length) problems.push(`no HTML under ${pub}`);
else if (!checked) problems.push('no root-absolute URL in any page: nothing was checked');
if (files.length && !canonicals) problems.push('no page carries a canonical <link>');
const sitemap = join(pub, 'sitemap-0.xml');
if (origin) {
  if (!existsSync(sitemap)) problems.push('sitemap-0.xml is missing');
  else {
    for (const [, loc] of readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)) {
      if (!loc.startsWith(`${origin}${prefix}/`)) problems.push(`sitemap-0.xml: ${loc} is not under ${origin}${prefix}/`);
      else if (loc.startsWith(`${origin}${prefix}${prefix}/`)) problems.push(`sitemap-0.xml: ${loc} carries ${prefix} twice`);
    }
  }
}
if (problems.length) {
  console.error(problems.slice(0, 50).join('\n'));
  console.error(`check-prefix: ${problems.length} problem(s) over ${checked} root-absolute URLs`);
  process.exit(1);
}
console.log(`check-prefix: ${checked} root-absolute URLs all under ${prefix}; ${canonicals} canonical(s)${origin ? ' and the sitemap' : ''} under ${origin}${prefix}/`);
