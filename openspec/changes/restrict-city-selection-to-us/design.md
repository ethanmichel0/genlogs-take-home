## Context

The completed portal creates a Google Maps `PlaceAutocompleteElement` inside the shared `CityAutocomplete` component for each From and To field. Each instance already passes `includedPrimaryTypes: ['locality']`, but it does not set a country restriction, so Google can normally suggest cities outside the United States.

This is a narrow frontend configuration and documentation change. Google Maps remains an external browser boundary, carrier selection remains in FastAPI, and the completed `build-genlogs-portal` change remains unchanged.

## Goals / Non-Goals

**Goals:**

- Restrict the normal predictions from both autocomplete instances to United States localities.
- Preserve the existing locality-only restriction and all selection, validation, search, routing, and carrier behavior.
- Cover both search fields with deterministic tests at the mocked Google boundary.
- Document the user-visible US-city scope and the reviewer prompt.
- Verify the frontend test suite and production build before marking implementation complete.

**Non-Goals:**

- Redesigning the city fields or any other UI.
- Adding post-selection country parsing or a second validation service.
- Changing route requests, carrier matching, backend fixtures, API contracts, configuration, or deployment topology.
- Editing or reopening the completed `build-genlogs-portal` change.

## Decisions

### Configure the Google widget with `includedRegionCodes`

Each `PlaceAutocompleteElement` will be constructed with both `includedPrimaryTypes: ['locality']` and `includedRegionCodes: ['us']`. Google's country restriction is the boundary designed to limit predictions, while retaining the existing primary-type filter keeps results city-focused.

Alternative considered: set `requestedRegion: 'us'`. That affects regional preference and formatting rather than strictly limiting predictions, so it does not meet the reviewer request.

Alternative considered: inspect the selected place address and reject non-US results after selection. That would allow non-US cities to remain visible in the normal suggestions and would add redundant validation outside the requested behavior.

### Verify configuration at the mocked Google boundary

Frontend tests will capture the options supplied when each autocomplete widget is constructed and assert that both the From and To instances receive `includedRegionCodes: ['us']` together with `includedPrimaryTypes: ['locality']`. This is deterministic and avoids depending on live Google responses in automated tests.

A manual autocomplete check will confirm the externally owned outcome: representative non-US city queries do not appear in normal suggestions, while US cities remain available. Automated tests will continue to mock Google/network boundaries as required by the repository rules.

### Keep documentation edits narrowly scoped

The README will state that From and To searches are limited to US cities. `docs/ai-prompts.md` will record the reviewer-feedback prompt and resulting decision without including credentials or private machine paths.

## Risks / Trade-offs

- [Google owns prediction behavior beyond the configured contract] → Assert the exact supported restriction in tests and perform a live manual suggestion check during verification.
- [A future refactor could configure only one field] → Exercise both From and To widget instances in frontend tests rather than asserting only a single component construction.
- [Country restriction could accidentally replace locality filtering] → Assert both constructor options together for both fields.
- [Google API naming can be confused with regional biasing] → Use `includedRegionCodes`, not `requestedRegion`, so the implementation expresses a restriction rather than a preference.
