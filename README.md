# Genlogs Route Explorer

A deliberately small take-home application for comparing Google driving routes and displaying simulated carrier capacity. The frontend is a single-page React JavaScript application; the backend is a stateless FastAPI service with static in-memory fixtures.

## Deployment status

| Surface | Public URL |
| --- | --- |
| Render web service | Pending deployment |
| Frontend | Same Render service URL after deployment |
| Carrier API | `<Render service URL>/api/carriers` after deployment |

This repository is prepared for a single-service Render Blueprint, but no live deployment has been attempted. Replace the pending entry with the verified HTTPS URL after deployment.

## What the application does

- Requires the user to select From and To cities from Google Place Autocomplete suggestions.
- Requests available alternative driving routes from Google, orders them by returned duration, and displays up to the three fastest routes. Google may return only one or two routes; that is a valid result.
- Sends the selected city names to `POST /api/carriers` and renders the ordered carrier fixture returned by FastAPI.
- Keeps Google routing and map rendering in the browser and carrier matching in the backend.
- Serves the compiled React application from FastAPI in production while preserving separate Vite and FastAPI development servers locally.

Carrier data is intentionally static for this simulation. Only these exact directional normalized pairs receive special results:

- New York City → Washington DC
- San Francisco → Los Angeles

Matching is directional. Reversed pairs, mixed pairs such as New York City → Los Angeles, unlisted cities, and every other valid origin/destination combination receive the UPS/FedEx fallback fixture.

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

## Clean-clone setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --env-file .env
```

The API is then available at `http://127.0.0.1:8000`, with interactive FastAPI documentation at `http://127.0.0.1:8000/docs`.

### Frontend

In a second terminal:

```bash
cd frontend
npm ci
cp .env.example .env
```

Set the Google key in `frontend/.env`. The API override is optional because Vite development defaults to `http://localhost:8000`:

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
| `VITE_API_BASE_URL` | Optional FastAPI base URL override without a trailing slash. Development defaults to `http://localhost:8000`; production defaults to the current origin. |

`VITE_*` values are embedded in the generated frontend bundle at build time. Do not deploy the local `.env` file; configure the Google key in Render and rebuild after changing it. The Google key is visible in the browser by design and must be protected with website and API restrictions. Leave `VITE_API_BASE_URL` unset on the single-service Render deployment so requests use `/api/carriers` on the same origin.

### Backend

| Variable | Purpose |
| --- | --- |
| `ALLOWED_ORIGINS` | Comma-separated exact frontend origins allowed by CORS, without trailing slashes. |

For example:

```dotenv
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://your-frontend.example
```

Wildcard CORS is intentionally not used. `ALLOWED_ORIGINS` supports the separate local development servers; the single-service production build uses same-origin requests and does not require production CORS configuration.

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

## Testing and builds

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

Create the production frontend bundle with:

```bash
npm ci --prefix frontend
VITE_GOOGLE_MAPS_API_KEY=your-browser-restricted-key VITE_API_BASE_URL= npm run build --prefix frontend
```

The static output is written to `frontend/dist/`. `VITE_API_BASE_URL=` overrides any local development value for this build so the compiled application uses same-origin API requests. FastAPI mounts this directory when it exists.

Preview the combined production service from the repository root:

```bash
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Then verify:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/
```

## Manual integration checklist

Use a billing-enabled Google project and a restricted development key, then verify:

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

Automated verification covers alternative-route ordering and the three-route cap because the live Google response is variable and may contain only one route.

## Render Blueprint deployment

The root-level `render.yaml` defines one free Python web service. Its build installs Python dependencies, installs frontend dependencies, and creates `frontend/dist`; its start command runs FastAPI, which serves both the API and compiled frontend. `/health` is the Render health-check endpoint.

The Blueprint uses:

```text
Build: pip install -r backend/requirements.txt && npm ci --prefix frontend && npm run build --prefix frontend
Start: uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT
Health: /health
```

To deploy after pushing the repository to a Git provider:

1. In Render, choose **New → Blueprint**.
2. Connect the repository containing this root-level `render.yaml`.
3. Review the single `genlogs-portal` Python web service.
4. When prompted for `VITE_GOOGLE_MAPS_API_KEY`, paste the browser-restricted Google key in the Render dashboard. The Blueprint declares the variable with `sync: false`; no credential is stored in Git.
5. Apply the Blueprint and wait for the build and `/health` check to pass.
6. Open the assigned `https://<service-name>.onrender.com` URL and complete the deployed verification checklist.

Do not define `VITE_API_BASE_URL` in Render unless intentionally calling a different backend. When it is absent, the production frontend calls `/api/carriers` on its own Render origin.

### Google Maps key for Render

The Google project must have Maps JavaScript API, Places API (New), and Routes API enabled. Restrict the key to those APIs.

After Render assigns the service URL, add its exact HTTPS referrer to the key's **Websites** restrictions:

```text
https://<service-name>.onrender.com/*
```

Google restriction changes may take a few minutes to propagate. Saving a new key value in Render requires a rebuild because Vite embeds it during the build.

### Deployed verification

After the Render URL is available:

1. Confirm the frontend loads over HTTPS with no Google authorization errors.
2. Run New York City → Washington DC and verify the special carrier fixture.
3. Run San Francisco → Los Angeles and verify the second special fixture.
4. Run a mixed pair and verify UPS/FedEx.
5. Confirm Google returns and draws the routes available for each search; fewer than three is valid.
6. Confirm the frontend sends `POST /api/carriers` to the same HTTPS origin without mixed-content or CORS errors.
7. Confirm `<Render service URL>/health` returns `{ "status": "ok" }`.
8. Record the verified Render URL in the deployment-status table above.

## Known limitations

- Carrier availability is fixed simulation data, not a live capacity feed.
- Google controls prediction availability, route alternatives, traffic-aware duration, quotas, pricing, and service uptime.
- Google may return fewer than three routes; real-world route counts and durations are not deterministic.
- Backend special-pair recognition deliberately uses a small documented alias set rather than fuzzy geographic matching.
- The browser key is embedded in the frontend bundle and depends on correct website/API restrictions for protection.
- There is no persistence, authentication, authorization, saved search history, booking, tracking, or carrier administration.
- Live Google behavior is verified manually; deterministic automated tests mock the external boundary.

## Deliberate scope exclusions

The project does not include a database, authentication, camera processing, image recognition, Redux, message queues, background workers, or unrelated Genlogs production architecture.

Meaningful AI prompts are recorded in `docs/ai-prompts.md`; development constraints are recorded in `AGENTS.md`.
