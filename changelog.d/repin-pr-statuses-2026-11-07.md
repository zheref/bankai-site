### Fixed

- A release repin pull request now shows its quality and `nen shu` results: each lane, when `sources-refresh.yml` dispatches it, posts a `quality` or `nen shu` commit status linked to its run. Before, the PR's own `pull_request` runs, held for approval because the bot is a first-time contributor, left empty check suites that hid the dispatched runs, so the PR read "no checks".
