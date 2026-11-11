# Sources

Every command, version, count, name and factual claim the site shows, with where it was read. `sources.json` holds the **build pins**: what `scripts/sources/fetch.mjs` checks out and the collector reads. For hatsu, nen and the handbooks, `.github/workflows/sources-refresh.yml` proposes each newer published release as a proved repin pull request, so **build-time** values follow every release the maintainer merges. The commits below are a different claim: the ones the hand-written **copy** was verified against, by hand, on 2026-11-04. They do not move with a release repin, and copy is only as current as its last hand verification. Values marked **build-time** are read by `scripts/sources/collect.mjs` on every build and never typed into a page; values marked **copy** are hand-written from the cited source; values marked **unverified** could not be confirmed in the repositories and are listed for Sergio.

| Repository | Commit | Version read | From |
|---|---|---|---|
| zheref/hatsu | `3c582c18a4a74119b748c76fbf2aa8ca275ef776` (origin/main) | plugin `0.159.0` | `.claude-plugin/plugin.json` |
| zheref/nen | `d7a720ddcd5c482da8ab2f40ce678a51828cb7a8` (origin/main) | `0.29.0`, latest tag `v0.29.0` | `package.json`; `git describe --tags --abbrev=0` in the checkout, refused when it disagrees with `sources.json` |
| zheref/bankai-handbooks | `39b8e06d3c662977794a0bfb5c8ced48a18b91ab` (origin/main) | `v0.13` | `handbooks/VERSION` |

## Build-time reads (collector)

| What the site shows | Read from |
|---|---|
| Hatsu version, name, description | hatsu `.claude-plugin/plugin.json` |
| The 17 agents and their order | hatsu `.claude-plugin/plugin.json` → `agents[]`; each `claude/agents/<name>.md` frontmatter (`description`, `model`) |
| The 61 skills | hatsu `claude/skills/*/SKILL.md` frontmatter (`name`, `description`) |
| Per skill: what it does, steps · calls, called by, group | hatsu `README.md` § *The skills*, the five tables (Session and host · The turn loop · The PR side · Issues, backlog and reports · Release, consumers and canon). `okiro` has no README row and is shown from its frontmatter only |
| Per skill: prerequisites, what runs | hatsu `README.md` § *Workflows*, rows whose *Start it* names the skill |
| Kurapika's six modes, lane, where work stops | hatsu `README.md` § *The roster* → *Kurapika, the lead persona* |
| Independents: discipline, raised by, standing | hatsu `README.md` § *The roster* tables |
| Quick start rows per surface (install, open a session, a request, push, review, update) | hatsu `README.md` § *Quickstart* |
| Install and usage snippets per surface | hatsu `docs/using/claude-code.md`, `codex.md`, `cursor.md`, `antigravity.md` § 2 *Setup* (first code block) and § 3 *Usage* (first code block) |
| The gates table (G1, G1-M, G2, G3, G4, G5, clauses, delegability) | hatsu `README.md` § *The gates* |
| Model tiers per surface | hatsu `README.md` § *Models and surfaces* |
| The phases only a human calls | hatsu `docs/WORKFLOW.md` § 4 table |
| Run profiles (fast, standard, thorough) | hatsu `docs/WORKFLOW.md` § `profile` table |
| Configuration files | hatsu `docs/config/README.md` § *The files* |
| Nen pin: `dependency.minimum` 0.28, `pinned_ref` v0.28.0, bootstrap URL and script digest | hatsu `nen/contract.json` |
| Nen bootstrap command at the pinned ref | nen `README.md` § *Install*, with the ref substituted from hatsu's pin (the README prints the latest tag, `v0.29.0`, shown separately) |
| Nen "Try it" block | nen `README.md` § *Try it* |
| The 177 verbs, families, purpose, reads, `--json` | nen `docs/USAGE.md` § *Verb index* |
| Handbook families and prefixes | bankai-handbooks `README.md` first table |
| UX rules UX-1…UX-13 | bankai-handbooks `handbooks/ux-baseline.md` |
| Changelog sections | each repository's `CHANGELOG.md`, the latest 12 `##` sections with a version in the heading |

Internal codenames inside repository prose are replaced by the configured Cloud tier label; `src/data/generated/report.json` lists every replacement by field and term, so the count is read there, never typed here.

## Copy (hand-written, cited)

| Claim | Source |
|---|---|
| Tagline, subhead, CTAs, problem, "How it works" parts, Coming later lines, proof points, FAQ answers | Craft: *Bankai · Brand Positioning (EN)*, transcribed to `src/brand/positioning.md`; every string in `src/i18n/en.json` cites its section |
| Hero one-line promise "Agentic delivery that stops at your gates" | Positioning doc, tagline option 7, named by the build prompt |
| 60+ skills, 17 agents | Positioning doc (verified by Laxus, 2026-11-04) and the live counts above |
| Tokens, fonts, marks, geometry, legal lines, light-mode disclaimer grey #5F6876 | Craft: *Bankai · Logo Concepts* → *Build spec (source of truth)*, and the brand asset package README (2026-11-04) |
| Hero terminal commands | hatsu `docs/using/claude-code.md` § 3 (`/kurapika <request>` with the doc's example request, shortened to one line; `/hatsu:aka`; `/hatsu:mukai`), `README.md` § *Workflows* (`en on <CODE>#<N>` with the README's `HA#12` example) |
| Hero terminal step lines | hatsu `README.md` § *How a request flows* and the skill tables (`breath → rasengan → kokusen → amaterasu → spiritual-message → jutaisho`; `gyo → squash unpushed → ao → gyo → push`; `murasaki → hanten → kokusen → kotoamatsukami → byakugan → shibari → landing report`; `sharingan → observe CI and the current-head round`). The output lines are summaries of those steps, not captured tool output |
| SDLC stages and the skills under each | the build prompt's stage list (2026-11-04); availability computed from the skill directories present |
| Stage card descriptions, architecture layer details, quick start lead, OSS table rows, support, services, FAQ "How do I update?" | hatsu `README.md` and `docs/using/`, paraphrased; flagged `review: true` in `src/i18n/en.json` |
| Agent aliases; skill aliases marked `D4` | Craft build-prompt document § D4 (skill and agent names: keep or alias) |
| Skill aliases marked `derived` | the site's reading of the README *Meaning* column; open for review |
| Gate per skill (`gate` in names.json) | hatsu `README.md` § *The gates*, § *Workflows*, § *The skills* and the agent and skill files; editorial, open for review |
| Services: ValleIA setup 2,500–7,500 USD, care plan 500–1,500 USD per month, all TBD | the build prompt and Craft § F (Sergio, 2026-11-04) |
| Pricing frame (Solo 19, Team 15 per dev min 5 or 49 per repo, Enterprise custom, public repos free, trial TBD) | the build prompt and Craft § E5/F; all TBD |
| Credentials rule (maintainer's subscriptions for internal use only; customers bring their own key) | the build prompt and Craft § F |
| GitHub Sponsors URL | the build prompt (`https://github.com/sponsors/zheref`) |
| Disclaimer, full and short | the build prompt, the Build spec and the asset README (identical wording) |

## Unverified in the repositories

- **ValleIA's site URL**: not in any repository or document read; `site.config.ts` → `services.providerUrl` is unset and the section renders a TBD badge instead of a link. The contact CTA points at the maintainer's GitHub profile until a route is decided.
- **A waitlist URL** for the Cloud tier teaser: unset; the teaser renders "A waitlist opens later" instead of a form.
- **Trial length** for the Cloud tier: TBD, rendered as `—`.
- **The custom domain** bankai.zheref.dev: GitHub Pages hosts the site (`.github/workflows/pages.yml`, the `github-pages` deploy target); until the domain's DNS record and the Pages custom-domain setting exist, it is served at https://zheref.github.io/bankai-site/.
- **"Hosted, autonomous runs in your org, GitHub App agents, managed or self-hosted runners"** as the Cloud tier's rows: from the build prompt; no public repository describes the tier.
- **The stage list** (which skills belong to which SDLC stage): the build prompt's grouping; the hatsu README groups skills by call site, not by SDLC stage.

## Release content proposals

`source-released` repository dispatches start the release refresh immediately. Sender workflows and their
scoped dispatch credentials live in the source repositories; a daily 03:23 UTC fallback and manual dispatch
also discover published releases. Event payloads never supply shell commands or override source pins.

The refresh plans missing skill/agent names and handwritten pages whose upstream dependencies changed,
with added changelog text as evidence. Generated-only changes use the pin-only path. An authoring job runs
only for a nonempty content plan, with a read-only repository token and either the maintainer-provisioned
`ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`. It cannot publish. The pinned Claude action gets 30 turns;
its notes explain each changed page and cite the release entry, or explain why an inspected page stays correct.

A fresh read-only proof job validates the content bundle using the base's code, then runs source fetch,
unit tests and the build suite. The dependency-free landing job validates again, commits pins and authored
content separately, and updates the existing proposal branch. Only `src/data/names.json` and existing
`src/content/docs/*.mdx` pages are admitted; traversal, symlinks, binaries, executable files, oversized
bundles and missing names/dispositions are refused. Only the maintainer merges; the normal quality and
Nen lanes still run on the proposal branch.

A failed authoring/proof attempt leaves no proposal. Subsequent automatic runs hold the same pins at the
same base using the failed run's `prepared-sources` artifact, retained for 90 days (subject to repository
retention policy). They cite that run rather than repeatedly spend authoring or fail. A manual dispatch
retries after credentials/content are repaired; a new base or new release also permits a new attempt.
After artifact expiry or deletion, an automatic retry can occur. The failed run names the planned content
still owed. No model credential is needed on the pin-only path.
