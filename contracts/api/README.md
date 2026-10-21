# API Contracts

Versioned HTTP API contracts.

- `pipwerk-studio/v1/openapi.json`: the public web API of pipwerk Studio under `/api/v1/`. The file is generated from the application and limited to the paths below `/api/v1/`. How it is generated and what the web API does is described in `docs/technical/pipwerk-studio.md`, section 5.
- `pipwerk-replay/v1/openapi.json`: the web API of pipwerk replay under `/api/v1/` (test accounts and settings so far; later orders add the data stock and the test runs). The file is generated from the application and limited to the paths below `/api/v1/`; the technical endpoint `/api/health` is not part of it. A test compares the file with the application and fails on a deviation. How it is generated and what the web API does is described in `docs/technical/pipwerk-replay.md`, section 5.
