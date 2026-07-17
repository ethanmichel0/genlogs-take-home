## ADDED Requirements

### Requirement: Carrier lookup endpoint contract
The backend SHALL expose `POST /api/carriers` with a JSON request containing non-empty string fields `origin_city` and `destination_city`, and SHALL return JSON containing a `carriers` array.

#### Scenario: Valid request
- **WHEN** a client sends `POST /api/carriers` with non-empty origin and destination city strings
- **THEN** the API returns HTTP 200 with a `carriers` array selected according to the normalized directional pair

#### Scenario: Missing request field
- **WHEN** the request omits `origin_city` or `destination_city`
- **THEN** the API returns HTTP 422 with FastAPI validation detail

#### Scenario: Blank city value
- **WHEN** either city value is empty or contains only whitespace
- **THEN** the API returns HTTP 422 and does not return a carrier fixture

### Requirement: Carrier response schema
Each carrier response item SHALL contain exactly a string `name` and an integer `trucks_per_day`, and the API SHALL preserve the specified carrier ordering within each fixture.

#### Scenario: Response item serialization
- **WHEN** the API returns any carrier fixture
- **THEN** every item has the shape `{ "name": <string>, "trucks_per_day": <integer> }` in the specified order

### Requirement: Deterministic city normalization
Before matching a pair, the backend SHALL Unicode-normalize each city string, trim surrounding whitespace, casefold it, remove periods and commas as separators, collapse repeated whitespace, and map only documented aliases to one of the four canonical cities.

The canonical aliases SHALL include:

- New York City: `New York City`, `New York`, and `NYC`
- Washington DC: `Washington DC`, `Washington D.C.`, and `Washington`
- San Francisco: `San Francisco`
- Los Angeles: `Los Angeles`

#### Scenario: Case and whitespace normalization
- **WHEN** a request uses different letter casing or repeated surrounding/internal whitespace for a documented city name
- **THEN** matching produces the same result as the canonical spelling

#### Scenario: Punctuation normalization
- **WHEN** the destination is `Washington, D.C.` or `Washington D.C.`
- **THEN** matching recognizes the canonical Washington DC city

#### Scenario: Documented New York alias
- **WHEN** the origin is `New York` or `NYC` and the destination normalizes to Washington DC
- **THEN** matching recognizes the New York City to Washington DC pair

#### Scenario: Undocumented city spelling
- **WHEN** a city value does not match a canonical name or documented alias after normalization
- **THEN** the value remains an ordinary city key and the pair uses the fallback fixture

### Requirement: New York City to Washington DC carriers
The backend SHALL return the New York City to Washington DC fixture only when the normalized origin is New York City and the normalized destination is Washington DC.

#### Scenario: New York City to Washington DC
- **WHEN** the normalized origin is New York City and the normalized destination is Washington DC
- **THEN** the API returns Knight-Swift Transport Services with 10 trucks per day, J.B. Hunt Transport Services Inc with 7 trucks per day, and YRC Worldwide with 5 trucks per day, in that order

### Requirement: San Francisco to Los Angeles carriers
The backend SHALL return the San Francisco to Los Angeles fixture only when the normalized origin is San Francisco and the normalized destination is Los Angeles.

#### Scenario: San Francisco to Los Angeles
- **WHEN** the normalized origin is San Francisco and the normalized destination is Los Angeles
- **THEN** the API returns XPO Logistics with 9 trucks per day, Schneider with 6 trucks per day, and Landstar Systems with 2 trucks per day, in that order

#### Scenario: Los Angeles to San Francisco
- **WHEN** the normalized origin is Los Angeles and the normalized destination is San Francisco
- **THEN** the API returns the fallback carrier fixture

### Requirement: Fallback carriers
The assessment's fallback wording does not explicitly enumerate every mixed combination involving the named cities. Under the documented implementation assumption, the backend SHALL return the UPS/FedEx fallback fixture for every valid directional city pair that is not exactly one of the two special normalized pairs. This includes mixed combinations, unlisted cities, identical cities, and reversed special pairs.

#### Scenario: Other city pair
- **WHEN** a valid request does not match either special directional pair
- **THEN** the API returns UPS Inc. with 11 trucks per day followed by FedEx Corp with 9 trucks per day

#### Scenario: New York City to Los Angeles mixed pair
- **WHEN** the normalized origin is New York City and the normalized destination is Los Angeles
- **THEN** the API returns the UPS/FedEx fallback fixture because the pair is not an exact special directional pair

#### Scenario: Denver to Washington DC mixed pair
- **WHEN** the normalized origin is Denver and the normalized destination is Washington DC
- **THEN** the API returns the UPS/FedEx fallback fixture because the pair is not an exact special directional pair

#### Scenario: Reversed New York City and Washington DC pair
- **WHEN** the normalized origin is Washington DC and the normalized destination is New York City
- **THEN** the API returns the UPS/FedEx fallback fixture because special-pair matching is directional

#### Scenario: Identical cities
- **WHEN** a valid request contains the same origin and destination city
- **THEN** the API returns the fallback carrier fixture

### Requirement: Stateless carrier data
The backend SHALL serve carrier fixtures from application-owned immutable data without a database, persistence layer, or external carrier service.

#### Scenario: Repeated lookup
- **WHEN** the same valid request is sent more than once
- **THEN** each response contains the same fixture and no request changes subsequent responses
