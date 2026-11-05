### Added

- **GitHub Pages deploy.** `.github/workflows/pages.yml` builds the static site from `main` and deploys it with `actions/deploy-pages`; the origin and base path come from `actions/configure-pages`, so the same build serves https://zheref.github.io/bankai-site/ today and bankai.zheref.dev once the custom domain is set. `scripts/pages/check-prefix.mjs` fails the deploy on any root-absolute URL, canonical or sitemap entry outside the prefix. `nen/contract.json` declares the `deploy` verb (a `workflow_dispatch` of the Pages workflow) with the `github-pages` target and an `on-push` seat.
- **Release-driven docs refresh.** `.github/workflows/sources-refresh.yml` (hourly, manual, or `repository_dispatch` `source-released`) repins every `sources.json` entry marked `"follow": "release"` (hatsu, nen) to its latest published GitHub release when that release is newer, proves the repin with the collector, the unit tests and the build lane, commits it to `main` and dispatches the deploy and the quality lane. Logic in `scripts/sources/release.mjs`, driver `scripts/sources/refresh.mjs`, tests in `tests/unit/release.test.ts`.

### Changed

- The canonical and Open Graph URLs and the docs search index load through Gatsby's `withPrefix`, and `siteUrl` reads `GATSBY_SITE_URL` (default https://bankai.zheref.dev), so a prefixed build links correctly.
