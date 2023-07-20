# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
We follow the format used by [Open Telemetry](https://github.com/open-telemetry/opentelemetry-python/blob/main/CHANGELOG.md).

## Unreleased

### Changed
- Remove usages of `data-ts-auction` as that only works when using API v1

### Refactor
- Use [Events API v2](https://docs.topsort.com/reference/reportevents-2)

## Version 1.0.6 (2023-07-13)

### Fixed
- Fix parsing of user cookie
  ([#182](https://github.com/Topsort/analytics.js/pull/182))
