# bankai-site

The public developer site for **Bankai**, the open-source, AI-driven software delivery system: https://bankai.zheref.dev (working codename in docs and commits: **site**).

Agents do the work. You hold the gates.

## What is here

- A Gatsby 5 (React, TypeScript) site: landing, docs (MDX), services, and a pricing page hidden behind a flag.
- `src/brand/`: the brand as data (tokens, logo files, the positioning copy source). Revisions need no code change.
- `site.config.ts`: every URL, label, flag and price; prices are tagged TBD until decided.
- `src/data/names.json`: the one names map (code name, plain alias, one-line description) for every Hatsu skill and agent; the collector refuses to build when one is missing, and a unit test checks both directions.
- `scripts/sources/`: the build-time readers of the three source repositories (hatsu, nen, bankai-handbooks) at the commits `sources.json` pins; `plugins/gatsby-source-bankai` turns the result into GraphQL. Versions, commands, skills, agents, verbs and changelogs are never typed by hand.
- `nen/`: the Nen declarations that let Hatsu drive this repository (lanes: build, test, lint, coverage, ui-test, deploy to the `github-pages` target).

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

## Deploy

GitHub Pages, from `main`. `.github/workflows/pages.yml` builds the static site in CI and deploys it on every push to `main`; `nen shu deploy --target github-pages --run` re-runs it on demand. Until the custom domain is set the site is served at https://zheref.github.io/bankai-site/: the build reads the origin and base path from `actions/configure-pages` (`GATSBY_SITE_URL`, `PATH_PREFIX` with `PREFIX_PATHS=true`) and `scripts/pages/check-prefix.mjs` fails the deploy if any link misses the prefix. Moving to bankai.zheref.dev is a DNS `CNAME bankai → zheref.github.io` plus the custom-domain field in the repository's Pages settings; no code changes. Verify `zheref.dev` under the account's GitHub Pages verified domains **before** creating that record, and never leave the record pointing at Pages while the custom-domain field is empty: an unverified domain whose CNAME points at GitHub Pages can be claimed by another account.

## Keeping the docs current

`.github/workflows/sources-refresh.yml` polls hourly (and runs on `workflow_dispatch` or a `repository_dispatch` of type `source-released`) for the latest **published** GitHub release of every repository `sources.json` marks `"follow": "release"` (hatsu, nen and the handbooks). A bare tag, a draft or a prerelease never moves a pin, and a pin is never moved backwards, so the handbooks, pinned at `v0.13` from `main` while their latest published release is v0.11.0, move only once a release newer than `v0.13` is published; a release whose `handbooks/VERSION` (like `package.json` for nen and `plugin.json` for hatsu) disagrees with its tag is refused. When a newer release appears a read-only job rewrites the pin to the release tag's commit and proves it (collector, unit tests, build lane). A second job, which installs and runs nothing from the dependency tree, checks with `scripts/sources/verify-repin.mjs` that nothing but a pin moved, pushes the repin to the `bot/sources-repin` branch and opens (or refreshes) one pull request against `main`, with each repin's upstream compare link, and runs the quality and `nen shu` lanes on it; each, once it finishes, posts its result as the `quality` or `nen shu` commit status on the PR, and a proposal whose head ends up with neither both statuses nor a lane still running is landed again on the next run. GitHub also starts that PR's own `pull_request` runs and holds them for approval (the bot is a first-time contributor); they are not needed and can be left unapproved. **Only you merge it** (`CON-5`), and the merge is the deploy. To decline a release, close the PR and keep the branch: the next run sees those pins already proposed and skips. This needs the repository setting *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*; without it the run fails loudly and proposes nothing. Everything the collector reads (versions, skills, agents, verbs, changelogs) follows; hand-written MDX copy does not, and a release that breaks a reader fails the run instead of deploying.

```sh
node scripts/sources/refresh.mjs          # what a refresh would move, writing nothing
node scripts/sources/refresh.mjs --write  # rewrite sources.json locally
```

See `docs/ARCHITECTURE.md` for the layout and `docs/SOURCES.md` for every claim's citation.

## License

MIT. Bankai is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by the creators, publishers, or rights holders of any anime or manga whose terms inspired its names. All trademarks belong to their respective owners.
