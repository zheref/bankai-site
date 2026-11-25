# Per-release docs and marketing checklist

Use this checklist for every published nen or Hatsu release. It complements the
[release content proposal flow](SOURCES.md#release-content-proposals) introduced in
[PR #10](https://github.com/zheref/bankai-site/pull/10), which plans names and
handwritten pages before proposing a pin. The manual review also covers breaking
changes, renames, landing copy and FAQ answers.

## Rules that never change

- Wait for a **published GitHub release**, discovered through `releases/latest`:
  not a draft, not a prerelease, not a bare tag with no release. Never introduce a
  pin to `main` or an unpublished tag. Pins move only to strictly newer releases,
  never backwards; an existing pin ahead of the latest release stays held. This
  checklist does not change pin policy or the existing handbooks pin.
- Author content **before proposing the pin**, using
  [`scripts/sources/content-plan.mjs`](../scripts/sources/content-plan.mjs) and the
  existing sources-refresh flow. The plan compares the previous pins with the
  candidate `sources.json` and fetched source checkouts; preparing that candidate
  locally is not publishing a pin. A pin-only PR is acceptable only when the plan
  reports `needed: false`: no missing or removed names, no agent roster mismatch,
  and no impacted handwritten pages. Still complete the breaking-change and
  marketing review below; the plan does not cover every editorial decision.
- bankai-site is a product repository: **PRs only**. Do not merge or deploy without
  Sergio's yes. Merging to `main` triggers the Pages deployment, so the approval
  must account for that deployment too.
- Write issues and PRs in plain words. Explain any cited PR number, minimum
  supported version (floor), or approval checkpoint (gate).
- File or update issues for outstanding work instead of silently skipping it.
  Use the existing `documentation` label for docs and `copy` for marketing copy;
  use both when needed. **There is no issue template today.** Include the published
  release URL, affected pages, expected reader-facing change and acceptance
  criteria in the issue body.

## When a nen release is published

1. Read the release body, starting with breaking changes and consumer notes, and
   read the changelog. List developer-facing verbs, flags, exit codes, minimum
   supported versions and refusals.
2. Run the content plan against the candidate pin. Update
   [`src/data/names.json`](../src/data/names.json) only if nen introduces a
   site-facing name; usually it does not.
3. File or update issues for the pin plus verb index and changelog (often
   automatic), handwritten callouts for floors, refusals and migrations that the
   collector will not explain, and marketing or FAQ changes a developer would
   encounter on day one. For work merged after the release tag, wait until its
   later release is published before filing the release-content follow-up.
4. Author callouts in `src/content/docs/nen-reference.mdx`, and in
   `getting-started.mdx` or `concepts.mdx` in the same directory when installation
   or contract behaviour changes. The collector will not invent breaking-change
   explanations.
5. Open the pin PR, or let a healthy sources-refresh propose it. Verify
   `<Versions />`, `<NenVerbs />` and the site changelog against the published tag
   and its commit.
6. Prepare, but do not send, the merge/deploy ask for Sergio.

## When a Hatsu release is published

1. Read the release body. Compare the published skill and agent directories with
   `src/data/names.json` for added, removed and **renamed** entries. A rename with
   no alias is a breaking docs and marketing event; explain the old and new names
   and whether the old invocation still works.
2. Run the content plan. Author a plain-English alias and description for every
   missing name, remove stale entries, and make `characterNames` match the plan's
   agent roster. Review renames explicitly, even when the plan represents them as
   an addition and a removal.
3. File or update issues for the pin, skill/guide/concepts prose, any Nen pin Hatsu
   absorbed, and marketing changes to landing versions and FAQ or rename copy.
   Write handwritten breaking-change callouts before proposing the pin.
4. Confirm `<NenPin />` matches the contract in the published Hatsu release,
   rather than an older floor or the latest standalone nen release. Hatsu may not
   yet have absorbed that standalone release.
5. Open a PR under the same rule: prepare the merge/deploy ask, but leave merge
   and deploy for Sergio's yes.

## Every time, before calling it done

- [ ] Record the published release URL in the issue and PR.
- [ ] Confirm `sources.json` points at that release's tag and the commit the tag
  names, without moving any pin backwards.
- [ ] Confirm `names.json` matches the published roster, including additions,
  removals and renames.
- [ ] Give breaking notes handwritten callouts, not only a changelog bump.
- [ ] Review landing versions and FAQ/upgrade copy against
  [`src/brand/positioning.md`](../src/brand/positioning.md). Record the decision,
  even when it is "no marketing change." File or update issues for remaining
  work; do not assume the page-and-names plan covers marketing.
- [ ] Describe no unpublished `main` work as released.
- [ ] Fetch and collect the candidate sources, run the relevant checks from the
  [repository verification instructions](../README.md#verify), and inspect the
  versions, names, verb index and changelog affected by the release.
- [ ] Add a [changelog fragment](../changelog.d/README.md) and cite the release
  evidence and validation in the PR.
- [ ] Leave merge and deploy for Sergio.

If sources-refresh is held or fails, record the run and outstanding content in an
issue and follow the current [release content proposal guidance](SOURCES.md#release-content-proposals).
Keep this checklist aligned if that failure/retry guidance changes. A failed
automation run is not permission to skip content, change pin policy or deploy.
