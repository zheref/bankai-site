### Changed

- Release refresh keeps the `source-released` event trigger and uses one daily fallback. It plans missing public names and handwritten release content, conditionally authors inert prose in a read-only job, and proves the original artifacts in a fresh checkout before proposing separate pin and content commits. The maintainer still merges every proposal.
- Failed, interrupted and partially published attempts at the same base and pins wait for a manual retry while their attempt artifact is retained. Authoring requires an existing Anthropic credential and a finite sender App actor allowlist for bot dispatches.
- The site reads Hatsu 0.166.0, documents the constitution check during warmup, and includes the device PR review skill.
