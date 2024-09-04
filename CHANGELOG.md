# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
We follow the format used by [Open Telemetry](https://github.com/open-telemetry/opentelemetry-python/blob/main/CHANGELOG.md).

## Unreleased

### Fixed
- Fix truncation of `seenEvents`
  ([#282](https://github.com/Topsort/analytics.js/pull/282))

## Version 2.3.1 (2024-04-11)

Patch release to fix tags

## Version 2.3.0 (2024-04-11)

### Added

- feat: add location.search to default event path by @jbergstroem in #243

### Dependencies

security(deps-dev): Bump express from 4.18.2 to 4.19.2 by @dependabot in #237
chore(deps): bump codecov/codecov-action from 4.1.0 to 4.1.1 by @dependabot in #240
security(deps-dev): bump vite from 4.5.2 to 4.5.3 by @dependabot in #241
chore(deps-dev): bump @typescript-eslint/eslint-plugin from 6.5.0 to 7.0.0 by @dependabot in #239

## Version 2.2.1 (2024-03-15)

### Added

- Remove node engine requirement from package.json

## Version 2.2.0 (2023-11-13)

### Added

- support passing `additionalAttribution`

### Refactor

- Stop publishing to codebuild/s3
- Update dependencies

## Version 2.1.0 (2023-08-30)

### Added

- Use vite/esbuild to compile libraries
- Enabled coverage for tests
- Increase test coverage for reporter.ts
- Export ESM version of the library
- Export types

### Changed

- Use React 18 features in end to end tests

### Refactor

- Replaced `npm` with `pnpm`
- Replaced `jest` ecosystem with `vitest`
- Replace `nock`/`isomorphic-fetch` with `msw`

## Version 2.0.0 (2023-07-13)

### Changed

- Remove usages of `data-ts-auction` as that only works when using API v1
- When specifying purchases, the price must now be specified as a float in the marketplace currency (i.e. USD) instead of cents.

### Refactor

- Use [Events API v2](https://docs.topsort.com/reference/reportevents-2)

## Version 1.0.6 (2023-07-13)

### Fixed

- Fix parsing of user cookie
  ([#182](https://github.com/Topsort/analytics.js/pull/182))
