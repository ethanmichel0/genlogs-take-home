## ADDED Requirements

### Requirement: Google Maps environment configuration
The frontend SHALL read the Google Maps browser key from `VITE_GOOGLE_MAPS_API_KEY`, SHALL fail with a clear configuration message when it is absent, and SHALL not commit a real key to source control.

#### Scenario: Local environment setup
- **WHEN** a developer follows the repository setup instructions
- **THEN** an example environment file identifies `VITE_GOOGLE_MAPS_API_KEY` without containing a real credential

#### Scenario: Missing Google key
- **WHEN** the frontend starts without `VITE_GOOGLE_MAPS_API_KEY`
- **THEN** the page shows a configuration error instead of attempting to initialize Google Maps with an undefined key

#### Scenario: Deployed Google key
- **WHEN** the frontend is built for deployment
- **THEN** the hosting environment supplies the browser key at build time and the key is restricted by HTTP referrer to approved local and deployed origins

### Requirement: Frontend-to-backend configuration
The frontend SHALL read the backend base URL from `VITE_API_BASE_URL`, and the backend SHALL permit cross-origin requests only from explicitly configured local and deployed frontend origins.

#### Scenario: Local API configuration
- **WHEN** the frontend runs in local development
- **THEN** `VITE_API_BASE_URL` targets the local FastAPI service and the backend allows the documented local frontend origin

#### Scenario: Production API configuration
- **WHEN** the frontend is deployed
- **THEN** `VITE_API_BASE_URL` targets the deployed FastAPI URL and that frontend origin is included in the backend CORS allowlist

### Requirement: Reproducible project documentation
The repository SHALL provide credential-free `.env.example` files for each application surface that requires configuration. The final README SHALL document prerequisites, dependency installation, local frontend and backend setup, testing, the carrier API contract, deployment, verification steps, required Google services and other external configuration, environment variables, build commands, and public URLs. It SHALL also document the mixed-city fallback assumption, directional matching, the up-to-three-fastest-routes behavior including the possibility that Google returns fewer routes, the intentionally static carrier data used for this simulation, and known limitations.

#### Scenario: Clean local setup
- **WHEN** a reviewer follows the README from a clean clone and supplies valid environment values
- **THEN** the reviewer can run both services and perform a search without undocumented setup steps

#### Scenario: Example environment review
- **WHEN** a reviewer inspects the committed `.env.example` files
- **THEN** every required variable is named and documented without including a real credential

#### Scenario: Behavior and limitation review
- **WHEN** a reviewer reads the final README
- **THEN** the mixed-city fallback assumption, directional carrier matching, up-to-three-routes behavior, static simulation data, known limitations, and external configuration requirements are explicitly described

### Requirement: Focused automated tests
The project SHALL include backend API tests for validation, normalization, both special directional pairs, reverse directions, fallback behavior, response shape, and fixture stability. It SHALL include frontend tests for selection validation, loading and error states, request payloads, route sorting and capping, carrier rendering, and stale result protection while mocking Google and network boundaries.

#### Scenario: Automated verification
- **WHEN** the documented test commands run without live Google credentials or network access
- **THEN** all owned frontend and backend behavior is verified using deterministic mocks and fixtures

#### Scenario: Manual Google integration check
- **WHEN** a developer has a valid Google key and runs the documented manual checklist
- **THEN** place autocomplete, map loading, alternative route rendering, and viewport fitting are verified against Google services

### Requirement: Deployable applications and documented URLs
The frontend SHALL be deployable as a static web application and the FastAPI service SHALL be deployable as a public HTTPS web service. The repository SHALL document the final frontend URL and backend base URL after deployment.

#### Scenario: Deployment build
- **WHEN** the documented production build and backend startup commands are executed
- **THEN** the frontend build succeeds and FastAPI listens on the host-provided interface and port

#### Scenario: Public deployment review
- **WHEN** deployment is complete
- **THEN** the README contains working HTTPS URLs for the frontend and backend and the deployed frontend can call the deployed backend

### Requirement: AI prompt and development rule records
The repository SHALL commit the meaningful AI prompts used to plan and build the solution in `docs/ai-prompts.md` and SHALL commit the applicable development and AI-agent rules in `AGENTS.md`. These records SHALL omit secrets, tokens, irrelevant transcripts, and private machine-specific data.

#### Scenario: Repository process review
- **WHEN** a reviewer inspects the committed repository
- **THEN** the reviewer can find the prompts that materially influenced the solution and the rules used to constrain development

#### Scenario: Prompt contains a secret
- **WHEN** a meaningful prompt includes a credential or private machine-specific value
- **THEN** the committed record redacts that value while preserving the prompt's relevant intent

### Requirement: Deliberate scope limits
The implementation SHALL NOT introduce a database, authentication, camera processing, image recognition, Redux, message queues, carrier-management workflows, or unrelated production platform architecture.

#### Scenario: Architecture review
- **WHEN** the completed change is reviewed
- **THEN** every runtime dependency and application component directly supports the route-search portal, carrier lookup, testing, configuration, or deployment requirements
