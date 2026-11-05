# Architecture notes

The site follows the `react-uzf-v1` handbook of `bankai-handbooks` (the one web stack the handbooks govern) where a static Gatsby site has an artifact to follow, and the UX baseline (`UX-{n}`) everywhere.

## What maps, and what does not

- **No feature state tier.** The site has no domain state: no slices, selectors, shifters, producers or services. The RTK quartet the handbook describes (`RC-49`) is not instantiated; nothing here dispatches. The only runtime state is the colour scheme (`src/library/AppTheme.ts`, `useAppTheme.ts`), the active tab, the selected architecture layer and the docs search box, each local to its component because it has no domain meaning (`UZF-4` reading: it does not need to survive for a domain reason).
- **Render layer naming** keeps the handbook's suffixes: pages are `src/pages/*.tsx` and `src/templates/*Page.tsx`; sections are `*Fragment.tsx` under `src/features/<feature>/`; domain-less, reusable components live under `src/design/` and import nothing feature-specific (`RC-14`).
- **Theme tokens** (`UX-5`): `src/brand/tokens.json` is the semantic-token source; the collector writes `src/styles/tokens.generated.css`; Tailwind's `@theme inline` maps utilities onto those variables. No raw colour literal in a component, except the terminal panel, which is the brand's fixed `#0D1117` in both schemes.
- **Tests** (`UZF-18`, `RC-53`): Vitest + React Testing Library under jsdom, three or more scenarios per component; the build lane (`tests/build/`) and the Playwright suite (`e2e/`) cover the acceptance criteria that only a built site can prove. No Storybook: the site has no design-system consumers yet.

## Data flow

```
sources.json ──► scripts/sources/fetch.mjs ──► .sources/<repo>  (or BANKAI_SOURCE_<REPO>)
                                                   │
                      scripts/sources/collect.mjs ◄┘   reads README tables, SKILL.md frontmatter, plugin.json,
                                │                      nen/contract.json, docs/using/*.md, USAGE.md, CHANGELOG.md
                                ▼
                 src/data/generated/*.json  +  src/styles/tokens.generated.css   (gitignored, rebuilt on every build)
                                │
                plugins/gatsby-source-bankai ──► GraphQL nodes (HatsuSkill, HatsuAgent, NenVerb, Snippet, …)
                                │
         src/pages, src/templates, src/content/docs/*.mdx ──► public/
```

`src/data/names.json` is the only hand-authored map; a test fails when the repository has a skill or agent it lacks.

## Flags and config

- `SHOW_PRICING=true` builds `/pricing/` (gatsby-node.ts). Nothing links it; the sitemap excludes it; it carries `noindex`.
- `site.config.ts` holds every URL, label, price and flag. The collector replaces internal codenames in repository prose with the configured Cloud tier label and records each replacement in `src/data/generated/report.json`.

## Accessibility and performance

Keyboard-operable tabs and selectable layers (`UX-2`), 44 px targets (`UX-3`), visible focus (`UX-1`), tokens (`UX-5`), no horizontal scroll (`UX-7`), 16 px base type (`UX-8`), `prefers-reduced-motion` honoured by every animation (`UX-9`). The hero terminal animates with CSS only; FlexSearch loads lazily on the docs pages; fonts are self-hosted latin subsets; code is highlighted at build time by shiki (no runtime highlighter).
