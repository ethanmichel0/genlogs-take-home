# Genlogs Route Explorer

A deliberately small take-home application for comparing Google driving routes and displaying simulated carrier capacity. The frontend is a single-page React JavaScript application; the backend is a stateless FastAPI service with static in-memory fixtures.

## Deployment status

The verified production deployment uses two separate Render services:

| Surface | Verified public URL |
| --- | --- |
| React frontend (Render Static Site) | [https://genlogs-take-home-2.onrender.com](https://genlogs-take-home-2.onrender.com) |
| FastAPI backend (Render Web Service) | [https://genlogs-take-home-1.onrender.com](https://genlogs-take-home-1.onrender.com) |
| Carrier API | [https://genlogs-take-home-1.onrender.com/api/carriers](https://genlogs-take-home-1.onrender.com/api/carriers) |
| Backend health check | [https://genlogs-take-home-1.onrender.com/health](https://genlogs-take-home-1.onrender.com/health) |

These URLs and the frontend-to-backend CORS path were verified on July 17, 2026. The frontend and backend remain independently deployable; the production frontend is not served by FastAPI.

## What the application does

- Requires the user to select From and To cities from Google Place Autocomplete suggestions limited to cities in the United States.
- Requests available alternative driving routes from Google, orders them by returned duration, and displays up to the three fastest routes. Google may return only one or two routes; that is a valid result.
- Sends the selected city names to `POST /api/carriers` and renders the ordered carrier fixture returned by FastAPI.
- Keeps Google routing and map rendering in the browser and carrier matching in the backend.

Carrier data is intentionally static for this simulation. Only these exact directional normalized pairs receive special results:

- New York City → Washington DC
- San Francisco → Los Angeles

Matching is directional. Reversed pairs, mixed pairs such as New York City → Los Angeles, unlisted cities, and every other valid origin/destination combination receive the UPS/FedEx fallback fixture.

## Proposed Genlogs Platform Design

These diagrams answer the broader system-design portions of the assessment. They describe how a production Genlogs platform could ingest highway-camera images, process observations asynchronously in batches, resolve carriers, infer trips, aggregate lane volumes, and store the associated entities.

- [Proposed platform architecture and information flow](docs/diagrams/genlogs-proposed-architecture.png)
- [Proposed high-level database and entity design](docs/diagrams/high-level-er-diagram.png)

These diagrams are a proposed production design and should not be interpreted as components implemented within this take-home exercise.

## Implemented Take-Home Portal Design

These documents describe the application actually implemented in this repository and deployed to Render.

- [Portal deployment architecture](docs/diagrams/portal-deployment-architecture.md)
- [Portal API data contract](docs/diagrams/portal-data-contract.md)

The implemented portal consists of a React/Vite frontend and a FastAPI backend. Carrier availability is intentionally supplied through the static fixtures required by the exercise, so the take-home implementation does not require a persistent application database. The proposed ER diagram above instead answers the separate question of how the broader Genlogs platform database could be designed.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Python 3.11+
- A Google Cloud project with billing enabled
- A browser API key with these Google services enabled:
  - Maps JavaScript API
  - Places API (New)
  - Routes API

Restrict the browser key to those APIs and to the exact local and deployed website origins that use it. For local development, allow both `http://localhost:5173/*` and `http://127.0.0.1:5173/*` if both hostnames will be used.

## Clean-clone local setup

Local development intentionally runs the frontend and backend separately.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --env-file .env
```

The API is available at `http://127.0.0.1:8000`, with interactive FastAPI documentation at `http://127.0.0.1:8000/docs` and health status at `http://127.0.0.1:8000/health`.

### Frontend

In a second terminal:

```bash
cd frontend
npm ci
cp .env.example .env
```

Set the Google key in `frontend/.env`. The API override is optional in development because Vite development defaults to `http://localhost:8000`:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your-browser-restricted-key
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Then start Vite:

```bash
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Local `.env` files are ignored and must never be committed.

## Environment variables

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser-visible Google Maps key supplied when Vite builds the application. |
| `VITE_API_BASE_URL` | FastAPI base URL without a trailing slash. Development defaults to `http://localhost:8000`; set it to the deployed backend URL for the two-service production build. |

The deployed frontend uses:

```dotenv
VITE_API_BASE_URL=https://genlogs-take-home-1.onrender.com
```

`VITE_*` values are embedded in the generated frontend bundle at build time. Do not upload a local `.env` file to Render. Configure both production values in the frontend service dashboard and redeploy after changing either one. The Google key is visible in the browser by design and must be protected with website and API restrictions.

### Backend

| Variable | Purpose |
| --- | --- |
| `ALLOWED_ORIGINS` | Comma-separated exact frontend origins allowed by CORS, without trailing slashes. |

For local development, use:

```dotenv
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

The deployed backend uses:

```dotenv
ALLOWED_ORIGINS=https://genlogs-take-home-2.onrender.com
```

Wildcard CORS is intentionally not used.

## Carrier API

### Request

```http
POST /api/carriers
Content-Type: application/json
```

```json
{
  "origin_city": "New York City",
  "destination_city": "Washington DC"
}
```

Both fields must be non-blank strings. Missing, non-string, blank, or unexpected fields return HTTP 422 using FastAPI validation details.

### Successful response

```json
{
  "carriers": [
    {
      "name": "Knight-Swift Transport Services",
      "trucks_per_day": 10
    },
    {
      "name": "J.B. Hunt Transport Services Inc",
      "trucks_per_day": 7
    },
    {
      "name": "YRC Worldwide",
      "trucks_per_day": 5
    }
  ]
}
```

Normalization applies Unicode normalization, trimming, case folding, period/comma separator removal, and whitespace collapse. Explicit aliases cover `New York City`, `New York`, `NYC`, `Washington DC`, `Washington D.C.`, and `Washington`. Matching remains directional and does not use fuzzy or substring matching.

## Testing and production builds

Backend tests do not require live credentials:

```bash
cd backend
.venv/bin/python -m pytest
```

Frontend tests mock Google Maps and HTTP boundaries and do not require a live key:

```bash
cd frontend
npm test
```

Create the production frontend bundle from the repository root with the deployed backend URL supplied at build time:

```bash
npm ci --prefix frontend
VITE_GOOGLE_MAPS_API_KEY=your-browser-restricted-key \
VITE_API_BASE_URL=https://genlogs-take-home-1.onrender.com \
npm run build --prefix frontend
```

The static output is written to `frontend/dist/`. To preview that production bundle locally, run the backend on port 8000 and then run:

```bash
npm run preview --prefix frontend -- --host 127.0.0.1
```

The host-compatible backend start command is:

```bash
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port "$PORT"
```

## Manual integration checklist

Use a billing-enabled Google project and a restricted development or deployment key, then verify:

- Both city controls show Google locality suggestions.
- Search stays disabled until a Google suggestion is selected for each city.
- Editing a selected city invalidates that selection.
- A valid search renders between zero and three routes without inventing alternatives.
- One or two routes are treated as successful results when that is all Google returns.
- Route summaries are ordered fastest first and the map viewport covers every displayed route.
- New York City → Washington DC renders the Knight-Swift/J.B. Hunt/YRC fixture.
- San Francisco → Los Angeles renders the XPO/Schneider/Landstar fixture.
- A mixed or unrelated pair renders UPS/FedEx.
- Route and carrier errors are reported independently so one successful result remains visible if the other service fails.
- Starting without `VITE_GOOGLE_MAPS_API_KEY` shows a clear configuration message.

Automated verification covers alternative-route ordering, the three-route cap, fewer-than-three results, and error behavior because live Google responses are variable.

## Render two-service deployment

The root-level `render.yaml` describes two independent Render services. The existing production deployment uses the URLs in the deployment table above.

### Backend Web Service

Use these Render settings:

```text
Runtime: Python
Build: pip install -r backend/requirements.txt
Start: uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT
Health check: /health
ALLOWED_ORIGINS: https://genlogs-take-home-2.onrender.com
```

### Frontend Static Site

Use these Render settings:

```text
Runtime: Static
Build: npm ci --prefix frontend && npm run build --prefix frontend
Publish directory: frontend/dist
VITE_API_BASE_URL: https://genlogs-take-home-1.onrender.com
VITE_GOOGLE_MAPS_API_KEY: set privately in the Render dashboard
```

To reproduce both services with the Blueprint:

1. Push the repository to a Git provider.
2. In Render, choose **New → Blueprint** and select the root-level `render.yaml`.
3. Provide `VITE_GOOGLE_MAPS_API_KEY` when Render prompts for the `sync: false` value.
4. Apply the Blueprint and wait for the backend `/health` check and frontend static build to pass.
5. Confirm the frontend service calls the backend service over HTTPS and complete the deployed checklist below.

The same settings can be entered manually by creating one **Web Service** for FastAPI and one **Static Site** for Vite.

### Google Maps key for Render

The Google project must have Maps JavaScript API, Places API (New), and Routes API enabled. Restrict the key to those APIs.

Add the deployed frontend URL—not the backend URL—to the key's **Websites** restrictions:

```text
https://genlogs-take-home-2.onrender.com/*
```

Google restriction changes may take a few minutes to propagate. Changing a Vite environment value in Render requires a new frontend build because Vite embeds it during the build.

### Deployed verification

1. Confirm [the frontend](https://genlogs-take-home-2.onrender.com) loads over HTTPS with no Google authorization errors.
2. Run New York City → Washington DC and verify the special carrier fixture.
3. Run San Francisco → Los Angeles and verify the second special fixture.
4. Run a mixed pair and verify UPS/FedEx.
5. Confirm Google returns and draws the routes available for each search; fewer than three is valid.
6. Confirm frontend requests go to `https://genlogs-take-home-1.onrender.com/api/carriers` without mixed-content or CORS errors.
7. Confirm [the health endpoint](https://genlogs-take-home-1.onrender.com/health) returns `{ "status": "ok" }`.

## Known limitations

- Carrier availability is fixed simulation data, not a live capacity feed.
- Google controls prediction availability, route alternatives, traffic-aware duration, quotas, pricing, and service uptime.
- Google may return fewer than three routes; real-world route counts and durations are not deterministic.
- Backend special-pair recognition deliberately uses a small documented alias set rather than fuzzy geographic matching.
- The browser key is embedded in the frontend bundle and depends on correct website/API restrictions for protection.
- Render's free services may cold-start after inactivity.
- There is no persistence, authentication, authorization, saved search history, booking, tracking, or carrier administration.
- Live Google behavior is verified manually; deterministic automated tests mock the external boundary.

## Deliberate scope exclusions

The implemented portal does not include a database, authentication, camera processing, image recognition, Redux, message queues, background workers, or the proposed Genlogs production-platform components documented above. Those proposed diagrams are system-design artifacts only.

Meaningful AI prompts are recorded in [`docs/ai-prompts.md`](docs/ai-prompts.md); development constraints are recorded in [`AGENTS.md`](AGENTS.md).
