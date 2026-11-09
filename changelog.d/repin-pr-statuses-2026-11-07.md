### Fixed

- A release repin pull request now shows its quality and `nen shu` results: each lane, when `sources-refresh.yml` dispatches it, posts a `quality` or `nen shu` commit status linked to its run once it finishes. Before, the PR's own `pull_request` runs, held for approval because the bot is a first-time contributor, left empty check suites that hid the dispatched runs, so the PR read "no checks".
- `sources-refresh.yml` counts an open proposal as finished only when its head carries both lane statuses or a lane is still running there, so a proposal left without its results (a dispatch that never ran, a status that failed to post) is landed again instead of skipped.
