# Meaningful AI Prompts

This file records prompts that materially shaped the solution. Credentials, private machine paths, and incidental conversation are intentionally omitted.

## Requirements analysis

> Analyze a small React JavaScript and FastAPI take-home portal before generating code. Identify ambiguities and risks, recommend the smallest complete solution, separate required behavior from optional polish, propose an API contract and tests, and avoid production-scale infrastructure.

Resulting decisions: keep Google Maps integration in the browser, keep carrier fixtures in FastAPI without persistence, and test owned boundaries with mocks.

## OpenSpec proposal

> Create an OpenSpec change for a single-page city search that uses Google place autocomplete, displays up to three fastest driving routes, and renders static carrier results from FastAPI. Define observable behavior, contracts, normalization, errors, acceptance scenarios, tasks, configuration, deployment, and committed AI-development records.

Resulting decisions: use a compact `POST /api/carriers` contract, local React state, explicit environment variables, and three focused capabilities.

## Ambiguity clarification

> Document that only the two exact directional city pairs receive special fixtures and every other valid combination receives the fallback. Add mixed-city and reversed-pair acceptance scenarios, preserve up-to-three route behavior, and expand README and repository deliverables.

Resulting decisions: narrow alias normalization, directional tuple matching, explicit mixed-pair fallback tests, and documentation of static simulation data and limitations.

## Implementation

> Apply the `build-genlogs-portal` OpenSpec change, implementing tasks in order while keeping the solution minimal and marking tasks complete only after verification.

Resulting decisions: implement and test the deterministic backend first, mock external frontend boundaries, then use a restricted development key only for the final live Google integration check.

## Configuration and delivery

> Explain how to configure and deploy the browser-visible Google Maps key without committing a local `.env` file, verify the required Google APIs, and document local and production environment settings, cost controls, build commands, service startup, manual verification, and public URLs.

Resulting decisions: document that Vite embeds `VITE_*` values at build time, require website and API restrictions for the Google key, use an explicit backend CORS allowlist, and keep deployment instructions provider-neutral until public targets are selected.

## Final two-service Render deployment

> Treat the working Render frontend and backend as the source of truth. Document the actual two-service deployment, replace pending URLs and obsolete combined-service instructions, add architecture and conceptual ER diagrams, rerun all checks, audit tracked files for credentials and private paths, and complete the OpenSpec tasks only after verification.

Resulting decisions: deploy React as a Render Static Site and FastAPI as a separate Render Web Service, compile the backend URL into the frontend through `VITE_API_BASE_URL`, allow only the deployed frontend origin through CORS, record both verified HTTPS URLs, and keep the Google browser key in Render with `sync: false`.
