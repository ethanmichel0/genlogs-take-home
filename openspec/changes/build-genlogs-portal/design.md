## Context

The repository currently contains OpenSpec setup but no application implementation. This change creates a deliberately small take-home application with two runtime surfaces: a React JavaScript browser application and a FastAPI service. The browser owns Google Places, Routes, and map rendering; the backend owns deterministic carrier fixture selection. There is no persistence, user identity, or integration with a wider Genlogs platform.

The primary stakeholders are the reviewer performing the demo and the developer implementing and deploying it. The design optimizes for transparent behavior, deterministic tests, minimal operational requirements, and a clean repository handoff.

## Goals / Non-Goals

**Goals:**

- Provide a clear single-page search flow using Google-selected cities.
- Display no more than the three fastest driving routes Google makes available.
- Return exactly specified, deterministic carrier results for two directional pairs and one fallback branch.
- Make loading, validation, partial failure, and configuration problems observable.
- Keep frontend and backend behavior independently testable without live Google calls.
- Deploy both surfaces and document their public URLs, setup, prompts, and development rules.

**Non-Goals:**

- Database storage, authentication, authorization, user profiles, or saved searches.
- Camera processing, image recognition, carrier image pipelines, or other computer vision.
- Redux or another global client-state framework.
- Queues, caches, background workers, service discovery, or production microservice architecture.
- Carrier CRUD, live capacity feeds, pricing, booking, tracking, or other Genlogs platform capabilities.

## Assumptions and Ambiguities

The assessment explicitly defines carrier results for New York City → Washington DC and San Francisco → Los Angeles. It also provides a fallback carrier case, but its wording does not clearly state whether that fallback covers every possible mixed combination involving one named city and one different destination or origin.

For example, the assessment does not explicitly define carrier results for:

- New York City → Los Angeles
- San Francisco → Washington DC
- New York City → Chicago
- Denver → Washington DC

To keep the implementation deterministic and proportionate, this change adopts the following documented assumption:

- Only New York City → Washington DC receives the specified Knight-Swift/J.B. Hunt/YRC fixture.
- Only San Francisco → Los Angeles receives the specified XPO/Schneider/Landstar fixture.
- Matching is directional; reversing either special pair does not preserve its special fixture.
- Every other valid origin/destination combination, including mixed combinations and reversed pairs, receives the UPS/FedEx fallback fixture.

The route-count wording is interpreted independently: the map displays up to the three fastest routes returned by Google. Google may return fewer than three alternatives, so one or two available routes are valid successful results and no route produces the specified no-route state.

## Decisions

### 1. Use a Vite React JavaScript frontend and a small FastAPI service

The frontend will remain a single page with local component state. FastAPI will expose one carrier endpoint and keep its fixtures in application memory. The repository may use separate `frontend/` and `backend/` directories so each surface has conventional tooling and an independent deployment command.

**Alternative considered:** A full-stack React framework or a backend-rendered page. These add conventions and deployment coupling that do not improve the requested demo.

### 2. Keep all Google Maps interaction in the browser

The frontend will initialize Google Maps JavaScript with Places and Routes capabilities, use place autocomplete for both city controls, and retain the selected Google Place objects or place identifiers for route computation. It will extract a human-readable city name from each selection for the carrier request.

The route request will use driving mode and request alternatives. Returned routes will be sorted by Google's duration value ascending and sliced to three before their polylines are drawn. If Google returns fewer routes, all are shown. The map viewport will cover every displayed route.

**Alternative considered:** Proxying Google route calls through FastAPI. That would duplicate an external integration, complicate key management, and make the backend less deterministic while the browser still needs Google Maps for rendering.

### 3. Use a compact string-based carrier API

The API contract is:

```json
POST /api/carriers
{
  "origin_city": "New York City",
  "destination_city": "Washington DC"
}
```

A successful response is:

```json
{
  "carriers": [
    { "name": "Knight-Swift Transport Services", "trucks_per_day": 10 }
  ]
}
```

The complete response contains the full ordered fixture. FastAPI/Pydantic validation returns HTTP 422 for missing, non-string, or blank values. All other valid pairs return HTTP 200, including unrecognized or identical city strings, because they select the fallback fixture.

**Alternative considered:** Sending coordinates, Google place IDs, state, and country to the backend. Those fields are not needed to select the four named cities and would enlarge the contract without changing the requested output.

### 4. Normalize narrowly and match directionally

The backend will isolate normalization in a pure function: Unicode normalization, trim, casefold, period/comma separator removal, whitespace collapse, then an explicit alias lookup. It will not use substring or fuzzy matching. The two special keys are ordered tuples, so reversed pairs deliberately fall through to the UPS/FedEx fixture.

The alias list is limited to predictable Google/user variants documented in the API spec. Any other valid value remains an ordinary normalized key and receives fallback data.

**Alternative considered:** Comparing raw display strings. That is brittle across capitalization, punctuation, and the common `New York`/`New York City` variation. Broad fuzzy matching is harder to explain and can create false special-pair matches.

### 5. Run route and carrier work concurrently but render them independently

After validation, one search starts both operations. The frontend tracks route and carrier loading/errors separately, clears obsolete data, and associates completions with the active search. A successful branch remains visible if the other branch fails. Search submission is disabled while the current search is pending.

**Alternative considered:** Treating both calls as an all-or-nothing request. This makes a Google configuration issue hide a valid backend demonstration and makes a backend error unnecessarily erase valid route results.

### 6. Use build-time browser configuration and an explicit backend origin allowlist

The frontend reads `VITE_GOOGLE_MAPS_API_KEY` and `VITE_API_BASE_URL`. The Google key is necessarily visible to the browser, so security comes from Google HTTP-referrer restrictions and enabling only the required services, not from pretending it is a server secret. Real values stay out of Git; `.env.example` documents names only.

The backend receives its allowed frontend origins from deployment configuration and does not use wildcard CORS. Local and deployed values are documented in the README.

**Alternative considered:** Hard-coded URLs or permissive CORS. Both make local/deployed behavior less explicit and are avoidable with minimal configuration.

### 7. Test application logic at owned boundaries

Backend tests will use pytest and FastAPI's test client. Frontend tests will use the selected Vite-compatible unit/component test runner and DOM testing utilities, with Google Maps and HTTP boundaries mocked. Live Google behavior is covered by a short manual integration checklist rather than network-dependent automated tests.

**Alternative considered:** A large browser end-to-end suite. It would increase setup and flakiness disproportionately for a one-page exercise.

### 8. Treat deployment and AI-development records as deliverables

The frontend will deploy to a static hosting target and FastAPI to a Python-capable HTTPS service. Provider choice remains flexible, but the final README must contain the working frontend URL, backend base URL, environment configuration, and deployment commands.

Meaningful planning and implementation prompts will be curated into `docs/ai-prompts.md`; active development and agent constraints will live in `AGENTS.md`. These records capture decisions and reproducibility without committing entire chat transcripts, credentials, or private machine paths.

## Risks / Trade-offs

- **Google services, billing, or key restrictions are misconfigured** → Document required services and allowed referrers, provide an explicit missing-key state, and include a manual deployed smoke test.
- **Google returns fewer than three routes or changes route duration with traffic** → Specify “up to three,” rank the response received for that search, and avoid assertions about stable real-world route counts or times.
- **Autocomplete returns a place without a usable city identity** → Keep Search invalid and ask the user to select a city prediction rather than sending ambiguous text.
- **A broad alias accidentally matches another place named Washington or New York** → Keep aliases explicit and rely on the city-only autocomplete flow; do not add fuzzy matching.
- **Separate frontend/backend hosting causes CORS or URL drift** → Configure both values through environments and verify the deployed pair together before recording URLs.
- **Independent asynchronous branches produce stale UI** → Tag or cancel prior searches and accept results only for the current search identifier.
- **Build-time Google keys are mistaken for secrets** → Explain that browser keys are public identifiers protected with referrer and API restrictions, while still keeping real values out of the repository.

## Migration Plan

There is no existing application or user data to migrate. Implementation can proceed in small vertical slices: establish repository structure and fixtures, complete and test the API, build and test the frontend with mocked boundaries, perform live Google integration, then deploy both surfaces and document URLs. Rollback consists of redeploying the previously known-good frontend build and backend revision; no data rollback is required.

## Open Questions

- Which static and Python hosting providers will be used? This is intentionally deferred to implementation as long as both produce public HTTPS URLs and support the documented environment settings.
- Does the implementer have a Google Cloud project with billing and the necessary Maps JavaScript, Places, and Routes services enabled? This is an external deployment prerequisite, not an architecture change.
