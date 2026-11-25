### Fixed

- Daily source refresh projects prior workflow runs to the fields needed for retry holds before buffering the response. A full history page no longer overflows Node's default subprocess buffer and blocks newer published releases during detection; pagination and the same-base, same-pins hold remain intact.
