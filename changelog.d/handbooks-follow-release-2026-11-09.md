### Changed

- **The handbooks follow their published releases.** `sources.json` marks `bankai-handbooks` `"follow": "release"`, so `.github/workflows/sources-refresh.yml` proposes a repin pull request for each newer published handbooks release, as it already does for hatsu and nen. The pin stays at `v0.13` from `main` until a release newer than `v0.13` is published (the latest is v0.11.0).
- **A plain-text version file vouches for its tag.** `scripts/sources/release.mjs` reads a `versionFrom` that names a plain-text file (the handbooks' `handbooks/VERSION`) at the release tag's commit and refuses a release whose file disagrees with its tag, as `package.json` and `plugin.json` already do; versions are compared as MAJOR.MINOR[.PATCH], so `v0.11` matches tag `v0.11.0`.
