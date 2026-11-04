# bankai-site

The public developer site for **Bankai**, the open-source, AI-driven software delivery system: https://bankai.zheref.dev (working codename in docs and commits: **site**).

Agents do the work. You hold the gates.

## What is here

- A Gatsby 5 (React, TypeScript) site: landing, docs (MDX), services, and a pricing page hidden behind a flag.
- `src/brand/`: the brand as data (tokens, logo files, the positioning copy source). Revisions need no code change.
- `site.config.ts`: every URL, label, flag and price; prices are tagged TBD until decided.
- `src/data/names.json`: the one names map (code name, plain alias, one-line description) for every Hatsu skill and agent; the collector refuses to build when one is missing, and a unit test checks both directions.
- `scripts/sources/`: the build-time readers of the three source repositories (hatsu, nen, bankai-handbooks) at the commits `sources.json` pins; `plugins/gatsby-source-bankai` turns the result into GraphQL. Versions, commands, skills, agents, verbs and changelogs are never typed by hand.
- `nen/`: the Nen declarations that let Hatsu drive this repository (lanes: build, test, lint, coverage, ui-test).

## Develop

```sh
pnpm install
pnpm sources:fetch          # clone the pinned source repositories into .sources/ (or set BANKAI_SOURCE_HATSU / _NEN / _HANDBOOKS to local checkouts)
pnpm develop                # http://localhost:8000 (collects sources first)
SHOW_PRICING=true pnpm develop   # with the hidden pricing page
```

## Verify

```sh
pnpm lint                   # eslint + tsc
pnpm test                   # vitest: names completeness, codename redaction, config, components
pnpm test:build             # two full builds: production hides /pricing; SHOW_PRICING=true renders it TBD-tagged
pnpm build && pnpm serve    # http://localhost:9000
pnpm test:e2e               # Playwright smoke + axe at 390 px and 1440 px (needs `pnpm exec playwright install chromium`)
node scripts/lighthouse.mjs # Lighthouse mobile against the served build
node scripts/screenshots.mjs  # one capture per section at 390 px and 1440 px (SCHEME=light for the light theme)
```

A `gatsby build` prints one ` ERROR  UNKNOWN` block that is Node's `punycode` deprecation warning (DEP0040) surfaced by Gatsby; the build still succeeds. It comes from a Gatsby dependency, not from this repository.

## Rules the site keeps

- The Cloud tier has no name: copy says only the configured label. Internal codenames never appear; a test fails the build if they do.
- Commercial pages (services, pricing) show plain language only: no character name and no skill code name (the build lane checks both). OSS and docs pages show the code name plus the alias.
- The footer renders the disclaimer verbatim, full on wide screens and short where space is tight.
- Customers always bring their own model API key. The maintainer's subscriptions are for building Bankai only.

See `docs/ARCHITECTURE.md` for the layout and `docs/SOURCES.md` for every claim's citation.

## License

MIT. Bankai is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by the creators, publishers, or rights holders of any anime or manga whose terms inspired its names. All trademarks belong to their respective owners.
