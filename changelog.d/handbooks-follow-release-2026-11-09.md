### Changed

- **The handbooks follow their published releases.** `sources.json` marks `bankai-handbooks` `"follow": "release"`, so `.github/workflows/sources-refresh.yml` proposes a repin pull request for each newer published handbooks release, as it already does for hatsu and nen. On 2026-11-09 the pin stays at `v0.13` from `main`, because the latest published handbooks release, v0.11.0, is older.
- **A plain-text version file vouches for its tag.** `scripts/sources/release.mjs` reads a `versionFrom` that names a plain-text file (the handbooks' `handbooks/VERSION`) at the release tag's commit and refuses a release whose file disagrees with the components it declares, so `v0.13` vouches for v0.13.0 and a patch release v0.13.1 alike. JSON manifests (`package.json`, `plugin.json`) still must equal the tag's version exactly.

### Security

- **A repin may not switch its manifest check off.** The landing gate (`checkRepin`, run by `scripts/sources/verify-repin.mjs`) now refuses a repin that changes a `versionFrom` beyond its `(latest tag …)` note.
- **The collector reads only inside a source checkout.** `read()` in `scripts/sources/lib.mjs` resolves symlinks and refuses a file that resolves outside the checkout, now that a third repository's releases reach the site through an automatic proposal.
- **A refused manifest is quoted in the error**, so upstream bytes never reach the Actions log as a workflow command.
