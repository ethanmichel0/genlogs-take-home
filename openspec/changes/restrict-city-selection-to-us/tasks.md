## 1. Autocomplete Restriction Tests

- [x] 1.1 Update the mocked Google autocomplete test coverage to exercise the From and To field instances.
- [x] 1.2 Assert that both instances receive `includedRegionCodes: ['us']` and retain `includedPrimaryTypes: ['locality']`.

## 2. Frontend Implementation

- [x] 2.1 Configure every `PlaceAutocompleteElement` created by `CityAutocomplete` with the United States region restriction while preserving the locality restriction.
- [x] 2.2 Run the focused city autocomplete tests and confirm existing selection, editing, validation, and error behavior remains covered and passing.

## 3. Documentation

- [x] 3.1 Update the README application description to state that From and To autocomplete searches are limited to United States cities.
- [x] 3.2 Add the reviewer-feedback prompt and resulting US-only autocomplete decision to `docs/ai-prompts.md` without credentials or private machine paths.

## 4. Verification

- [x] 4.1 Manually verify with the live Google autocomplete boundary that representative non-US cities do not appear in normal suggestions and that US locality suggestions remain available in both fields.
- [x] 4.2 Run the complete frontend test suite and record a successful result.
- [x] 4.3 Run the frontend production build and record a successful result.
- [x] 4.4 Review the diff to confirm there are no backend carrier, API, route-search, UI redesign, deployment behavior, or `build-genlogs-portal` change edits, then mark tasks complete only for verified work.
