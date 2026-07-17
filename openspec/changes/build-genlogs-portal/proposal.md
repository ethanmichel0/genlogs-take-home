## Why

Genlogs needs a small, reviewable take-home application that demonstrates city-based route discovery and deterministic carrier recommendations without introducing production platform complexity. Defining the observable behavior and contracts first keeps the implementation focused, testable, and straightforward to deploy for evaluation.

## What Changes

- Add a single-page React JavaScript interface with Google Maps place autocomplete for origin and destination cities.
- Display up to the three fastest available driving routes on a Google map after a valid search.
- Add a FastAPI carrier lookup endpoint that accepts structured origin and destination city identities.
- Return the specified carrier fixtures for the two exact directional city pairs and a UPS/FedEx fallback for every other valid pair.
- Define validation, loading, empty, and failure behavior for both Google Maps and backend interactions.
- Define environment-variable handling, deployment documentation, automated testing expectations, and repository documentation requirements.
- Commit the meaningful AI prompts and development rules used to produce the take-home solution.
- Explicitly exclude a database, authentication, camera or image processing, Redux, queues, and unrelated production architecture.

## Capabilities

### New Capabilities

- `route-search-portal`: City selection, search lifecycle, Google route display, carrier rendering, and observable frontend states.
- `carrier-lookup-api`: FastAPI request/response contract, deterministic city normalization, special-pair matching, fallback behavior, and API errors.
- `project-delivery`: Configuration, testing, deployment, URL documentation, and repository-level AI prompt and development-rule records.

### Modified Capabilities

None.

## Impact

- Introduces a React JavaScript frontend and a FastAPI backend as separate small application surfaces.
- Adds Google Maps JavaScript, Places, and Routes integrations in the browser and requires a browser-safe Google Maps API key supplied through frontend environment configuration.
- Adds immutable in-memory carrier fixtures; no persistence or database dependency is introduced.
- Requires deployment targets for both applications, documented public URLs, local setup instructions, tests, and committed development-process documentation.
