## 1. Project Foundation

- [x] 1.1 Create minimal `frontend/` Vite React JavaScript and `backend/` FastAPI project structures with only the runtime and test dependencies required by the specs.
- [x] 1.2 Add ignored local environment files and committed credential-free `.env.example` files for the frontend and backend, covering `VITE_GOOGLE_MAPS_API_KEY`, `VITE_API_BASE_URL`, and the backend CORS allowlist.
- [x] 1.3 Add `AGENTS.md` with the applicable development rules and start `docs/ai-prompts.md` with the meaningful planning prompts, excluding secrets and machine-specific values.

## 2. Carrier Lookup API

- [x] 2.1 Define validated FastAPI request/response models and immutable ordered carrier fixtures for the two special pairs and the fallback result.
- [x] 2.2 Implement and unit test the pure city normalization and explicit alias mapping used for directional pair keys.
- [x] 2.3 Implement `POST /api/carriers` and explicit environment-driven CORS configuration without adding persistence or external carrier services.
- [x] 2.4 Add API tests for request validation, response shape/order, normalized special pairs, aliases, identical cities, repeated fixture stability, and fallback behavior including New York City → Los Angeles, Denver → Washington DC, and directional Washington DC → New York City.

## 3. Route Search Frontend

- [x] 3.1 Build the single-page From city, To city, Search, map, carrier-results, validation, loading, empty, and error layout using local React state.
- [x] 3.2 Integrate Google place autocomplete for both city controls, retain valid selections, extract city names, and invalidate a selection when its text is edited.
- [x] 3.3 Integrate Google driving route calculation with alternatives, sort routes by returned duration, cap the displayed set at three, draw distinct polylines, clear obsolete overlays, and fit map bounds.
- [x] 3.4 Integrate `POST /api/carriers` using `VITE_API_BASE_URL` and render every returned carrier name and trucks-per-day value in response order.
- [x] 3.5 Coordinate route and carrier work with independent loading/errors, duplicate-submit prevention, partial-success rendering, and stale-search protection.
- [x] 3.6 Add a clear missing-Google-key state and ensure the page remains usable with keyboard input and at narrow and desktop viewport widths.

## 4. Frontend Verification

- [x] 4.1 Add deterministic frontend tests for Google-selected input validation, edit invalidation, Search enablement, request payloads, carrier rendering, and carrier API failures.
- [x] 4.2 Add mocked route tests for duration ordering, the three-route cap, one/two/zero route results, route errors, partial success, overlay replacement, and stale completions.
- [x] 4.3 Run the frontend and backend automated suites without live credentials and complete the documented manual Google autocomplete, routing, and map viewport checklist with a restricted development key.

## 5. Documentation and Deployment

- [x] 5.1 Complete the final README with prerequisites; clean-clone frontend/backend setup; testing, build, API, deployment, and verification instructions; required Google services and all other external configuration; environment variables; public URLs; the mixed-city fallback assumption; directional matching; the up-to-three-fastest-routes behavior and possibility of fewer Google alternatives; the intentionally static carrier data used for this simulation; known limitations; the manual integration checklist; and scope exclusions.
- [x] 5.2 Finalize `docs/ai-prompts.md` with the meaningful prompts used and `AGENTS.md` with the development rules, then verify those files, all `.env.example` files, logs, and documentation contain no credentials or private machine-specific values.
- [x] 5.3 Configure and verify a production frontend build and a host-compatible FastAPI start command, including deployed API URL and explicit frontend-origin CORS settings.
- [x] 5.4 Deploy the backend and frontend to public HTTPS endpoints, smoke-test all three carrier branches plus route/error behavior, and record the working frontend URL and backend base URL in the README.
- [x] 5.5 Run final automated checks and review runtime dependencies and components to confirm no database, authentication, camera/image processing, Redux, queues, or unrelated production architecture was introduced.
