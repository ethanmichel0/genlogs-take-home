# Development Rules

## Scope

- Implement only the React route-search portal, the FastAPI carrier endpoint, their tests, configuration, documentation, and deployment support.
- Keep carrier data static and in memory for this simulation.
- Do not add a database, authentication, camera or image processing, Redux, queues, background workers, or unrelated Genlogs platform components.

## Behavior

- Treat carrier matching as directional.
- Only New York City → Washington DC and San Francisco → Los Angeles receive special carrier fixtures; every other valid pair receives the UPS/FedEx fallback.
- Display up to the three fastest routes returned by Google and handle fewer than three as a valid result.
- Keep Google Maps calls in the browser and carrier selection in FastAPI.

## Quality and Security

- Add deterministic tests for owned behavior and mock Google/network boundaries.
- Never commit API keys, tokens, credentials, private machine paths, or generated environment files.
- Keep `.env.example` files credential-free and update documentation when configuration changes.
- Mark OpenSpec tasks complete only after the corresponding work is verified.

