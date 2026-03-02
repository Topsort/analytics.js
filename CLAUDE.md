# analytics.js

Topsort's analytics.js is a browser-side JavaScript library that auto-detects DOM events (impressions, clicks, and purchases) via `data-ts-*` HTML attributes, deduplicates and queues them with retry logic, and sends them to the Topsort Analytics API using `@topsort/sdk`. It is published to npm as `@topsort/analytics.js`.

## Git Workflow

- **Never commit directly to `main`.** All changes go through PRs from a dedicated branch.
- Branch names should be descriptive (e.g., `feat/add-google-environment`, `fix/merge-pagination-offset`).
- **Large changes must be broken into stacked PRs** — each PR should be independently reviewable and represent a single logical unit of work (e.g., one PR adds the config, the next adds the validation schema, the next adds tests). Avoid monolithic PRs that touch many unrelated things at once.
- Each PR in a stack should be based on the previous branch, not `main`, so they can be reviewed and merged in order.
- **Admin override** (`gh pr merge --admin`) is only appropriate to bypass the review requirement when all CI checks pass. Never use it to force-merge a PR with failing CI — fix the failures first. Before using `--admin`, check whether the repo allows it (e.g. `gh api repos/{owner}/{repo}` or branch protection settings). If admin override is not permitted or you cannot verify it is, do not merge — ask the user instead.
- Keep branches up to date with `main` before merging — rebase or merge `main` into your branch to resolve conflicts locally, not in the merge commit.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Never approve or merge a PR that has unresolved review comments — address or explicitly dismiss each one first. Always check nested/threaded comments (e.g. replies under bot comments) as they may contain substantive issues not visible at the top level.
- Before merging with `--admin`, wait at least **5 minutes** after the last CI check finishes. This gives Bugbot and other async bots time to post their comments. After the wait, check all PR comments (including nested/threaded replies) for unresolved issues before merging.

## Tech Stack

| Layer | Tool |
|---|---|
| Language | TypeScript (strict mode, ES6 target) |
| Runtime | Browser (DOM APIs, `window.TS` global config) |
| Package manager | pnpm (v10.22.0, declared in `packageManager` field) |
| Bundler | Vite (builds UMD, ESM, and IIFE formats) |
| Testing | Vitest with jsdom environment |
| HTTP mocking | MSW (Mock Service Worker) |
| Linting/Formatting | Biome (v2.3.5) |
| Coverage | @vitest/coverage-v8, reported to Codecov |
| SDK dependency | `@topsort/sdk` (the only runtime dependency) |
| Node version | >=20.0.0 |

## Key Commands

| Command | Description |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm run build` | Build UMD + ESM bundles, then IIFE bundle |
| `pnpm run test` | Run unit tests with coverage (Vitest) |
| `pnpm run lint` | Run Biome checks (linting + formatting) |
| `pnpm run lint:fix` | Auto-fix Biome lint issues |
| `pnpm run lint:ci` | Run Biome in CI mode (fails on any issue) |
| `pnpm run format` | Check formatting with Biome |
| `pnpm run format:fix` | Auto-fix formatting with Biome |
| `pnpm run types:check` | Run `tsc --noemit` to type-check without emitting |
| `pnpm run test:e2e` | Build + run E2E test server (Express-based, manual) |

## Architecture

### Directory Structure

```
src/
  detector.ts              # Main entry point: DOM observation, event detection, API dispatch
  queue.ts                 # Persistent event queue with retry + exponential backoff
  store.ts                 # Storage abstraction (LocalStorage with MemoryStore fallback, BidStore for session)
  set.ts                   # Utility to truncate a Set to a max size (keeps newest entries)
  index.d.ts               # Public type re-exports
  *.test.ts                # Co-located unit tests for each module
mocks/
  api-server.ts            # Express server for manual E2E testing
tests/
  browser-test.ts          # Browser-based E2E test runner
  components.tsx           # React test components (used with react-router-dom)
  test.html                # HTML harness for E2E tests
  real_e2e.html            # Manual E2E test page
@types/
  global.d.ts              # Global type declarations (window.TS interface)
```

### Data Flow

1. **Initialization** (`detector.ts`): On `DOMContentLoaded` (or immediately if the document is already loaded), the library reads `window.TS` config (token, url, optional getUserId). It scans the existing DOM for elements matching `[data-ts-product]`, `[data-ts-action]`, `[data-ts-items]`, or `[data-ts-resolved-bid]`.

2. **Detection**: Two mechanisms detect events:
   - **IntersectionObserver** (threshold 0.5): Fires `Impression` events when a product element becomes 50% visible. Each element is unobserved after its first impression.
   - **MutationObserver**: Watches for new child elements and attribute changes (`data-ts-product`, `data-ts-action`, `data-ts-items`, `data-ts-resolved-bid`) to detect dynamically added or modified products.
   - **Click listeners**: Attached to product elements (or their `[data-ts-clickable]` children for granular control). Clicks on banners store the `resolvedBidId` in session storage (`BidStore`) for cross-page attribution via `data-ts-resolved-bid="inherit"`.
   - **Purchase events**: Triggered when elements with `data-ts-action="purchase"` are detected; item data is parsed from `data-ts-items` JSON attribute.

3. **Deduplication**: A `Set<string>` of seen event keys (page + type + product + bid + items) prevents duplicate events. The set is capped at 2,500 entries, dropping oldest first (`truncateSet`).

4. **Queuing** (`queue.ts`): Events are appended to a `Queue` backed by `LocalStorageStore` (falls back to `MemoryStore` if localStorage is unavailable). The queue:
   - Caps at 250 entries (drops oldest on overflow).
   - Processes up to 25 events per batch.
   - Uses exponential backoff for retries (max 3 retries).
   - High-priority events (purchases) are processed immediately; low-priority events are batched with a 250ms delay.

5. **Dispatch**: The `processor` function creates a `TopsortClient` from `@topsort/sdk` and calls `reportEvent()` for each queued event. On success, the event is removed from the queue. On retryable failure, it is kept for retry. On permanent failure or after max retries, it is dropped.

6. **User ID**: Managed via a cookie (`tsuid` by default, configurable via `window.TS.cookieName`). Can be overridden by providing `window.TS.getUserId`. The library also exposes `setUserId` and `resetUserId` on `window.TS`.

### Build Outputs

- `dist/ts.js` — UMD bundle (default for `require()`)
- `dist/ts.mjs` — ESM bundle (default for `import`)
- `dist/ts.iife.js` — IIFE bundle for direct `<script>` inclusion in legacy environments

## Code Conventions

- **Formatting**: Biome with 2-space indent, 100-char line width, space indent style.
- **Imports**: Auto-organized by Biome (`organizeImports: "on"`).
- **Linting**: Biome linter enabled; `noExplicitAny` and `noDocumentCookie` rules are disabled.
- **TypeScript**: Strict mode (`alwaysStrict`, `strictNullChecks`, `noImplicitAny`, `noImplicitReturns`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`).
- **Naming**: Files use kebab-case. Test files are co-located with source and named `<module>.<scenario>.test.ts`.
- **No external runtime dependencies** other than `@topsort/sdk` — the library must remain lightweight for browser embedding.

## Testing

- **Framework**: Vitest with `jsdom` environment (configured in `vite.config.ts`).
- **Pattern**: Each test file sets up `window.TS = { token: "token" }`, injects HTML into `document.body`, dynamically imports `./detector`, and asserts on custom `topsort` events dispatched on DOM nodes.
- **Deduplication**: Each test file runs in isolation (separate Vitest workers), so the `seenEvents` set and module state are fresh per file.
- **Queue tests** (`queue.test.ts`): Use `vi.useFakeTimers()` to control timing for exponential backoff and delayed processing.
- **Coverage**: Generated by `@vitest/coverage-v8` and uploaded to Codecov.
- **Adding a test**: Create a new `src/<module>.<scenario>.test.ts` file. Set up `window.TS`, inject DOM, import `./detector`, simulate user interactions, and assert on the `topsort` CustomEvent details.
- **E2E tests**: Manual process — run `pnpm run test:e2e`, open the served HTML page, and verify results visually.

## CI/CD

### On Pull Requests and Push to `main` (`checkpr.yml`)

Three parallel jobs:
1. **lint** — `pnpm install` + `pnpm run lint:ci` + `pnpm run types:check`
2. **test** — `pnpm install` + `pnpm run test` + Codecov upload
3. **format** (Biome Lint) — Uses `biomejs/setup-biome@v2` action + `biome ci --reporter=github`

Concurrency: grouped by workflow + ref, cancels in-progress runs on new pushes.

### On Release Published (`publish-to-npm.yml`)

1. Install + lint + test + type-check + build
2. Publish to npm via `npm publish --no-git-checks` (uses `NPM_PUBLISH_TOKEN` secret)

### Dependabot

- Monthly updates for npm dev dependencies and GitHub Actions.

## Gotchas

- **Module side effects**: Importing `detector.ts` immediately starts DOM observation. Tests must set up `window.TS` and inject DOM HTML *before* the dynamic `import("./detector")` call.
- **IntersectionObserver in jsdom**: jsdom does not implement `IntersectionObserver`, so in the test environment, impressions fire synchronously on DOM insertion instead of on visibility. This means test behavior differs from real browser behavior for impression timing.
- **Cookie parsing**: The user ID cookie parser uses a regex that expects the cookie name at the start or after a semicolon. Custom `cookieName` values with special regex characters could cause issues.
- **Queue persistence**: The queue persists to `localStorage` under key `ts-q`. If localStorage is unavailable (e.g., private browsing in some browsers), it falls back to an in-memory store, meaning events are lost on page refresh.
- **`window.TS.loaded` guard**: The `start()` function sets `window.TS.loaded = true` to prevent double initialization. If you need to re-initialize in tests, you must reset this flag.
- **IIFE build bundles all dependencies**: The IIFE format (`dist/ts.iife.js`) inlines `@topsort/sdk`, while the ESM/UMD formats treat it as an external dependency.
