## Why

Reviewers requested that both city selectors limit their Google Place Autocomplete suggestions to the United States. This keeps the route-search experience aligned with the intended US-only scope while preserving the completed portal's current behavior.

## What Changes

- Configure Google Place Autocomplete for both the From and To fields to recommend United States locations only.
- Preserve the existing city/locality result restriction and verify that normal suggestions exclude non-US cities.
- Add or update deterministic frontend tests covering the country restriction on both fields.
- Document the US-city limitation in the README and record the reviewer-feedback prompt in `docs/ai-prompts.md`.
- Require frontend tests and a production build to pass before the change is considered complete.
- Preserve all route-search, validation, carrier lookup, UI, API, configuration, and deployment behavior outside this restriction.

## Capabilities

### New Capabilities

- `us-city-autocomplete`: United States-only Google Place Autocomplete recommendations for both city search fields, including regression verification and user-facing documentation.

### Modified Capabilities

None.

## Impact

- Affects the React frontend's Google Place Autocomplete configuration and its associated tests.
- Updates repository documentation in the README and `docs/ai-prompts.md`.
- Does not change the FastAPI carrier endpoint, carrier fixtures, route calculation, UI design, public API contracts, or deployment architecture.
