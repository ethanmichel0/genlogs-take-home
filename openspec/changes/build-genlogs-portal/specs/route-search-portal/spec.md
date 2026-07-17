## ADDED Requirements

### Requirement: Single-page city search
The frontend SHALL present a single page containing a `From city` control, a `To city` control, a `Search` action, a Google map area, and a carrier results area.

#### Scenario: Initial page
- **WHEN** the application first loads
- **THEN** the city controls and Search action are visible, and the page does not show stale routes or carrier results

### Requirement: Google-backed city selection
The frontend SHALL use Google Maps place autocomplete for both city controls and SHALL treat a city as selected only after the user chooses a Google prediction that resolves to a city identity.

#### Scenario: Two valid city selections
- **WHEN** the user selects a Google city prediction for both controls
- **THEN** the frontend stores the selected places and enables Search

#### Scenario: Unselected free text
- **WHEN** either control contains typed text that was not selected from Google place autocomplete
- **THEN** Search remains disabled and the page indicates that both cities must be selected from the suggestions

#### Scenario: Edit after selection
- **WHEN** the user edits the text of a previously selected city
- **THEN** the frontend invalidates that selection until another Google prediction is selected

### Requirement: Search lifecycle
The frontend SHALL start route calculation and carrier lookup from the same validated Search action, SHALL expose their loading state, and SHALL prevent an earlier search result from replacing a later search result.

#### Scenario: Valid search begins
- **WHEN** the user activates Search with two valid selected cities
- **THEN** the frontend clears prior errors and obsolete results, shows loading feedback, requests driving routes from Google, and sends the selected city names to the carrier API

#### Scenario: Search is already pending
- **WHEN** a search is pending
- **THEN** the frontend prevents duplicate submission for the same pending search

#### Scenario: A newer search supersedes an older search
- **WHEN** an older route or carrier request finishes after a newer search has begun
- **THEN** the frontend ignores the stale completion and retains the newer search state

### Requirement: Fastest driving route display
The frontend SHALL request available alternative driving routes from Google, order the returned routes by Google's route duration from fastest to slowest, display no more than the first three, and fit the map viewport to the routes being displayed.

#### Scenario: More than three routes are available
- **WHEN** Google returns more than three driving routes with durations
- **THEN** the map displays only the three routes with the shortest durations

#### Scenario: Fewer than three routes are available
- **WHEN** Google returns one or two driving routes
- **THEN** the map displays every returned route without treating the lower count as an error

#### Scenario: No driving route is available
- **WHEN** Google returns no driving route for the selected cities
- **THEN** the map does not display a route and the page shows a clear no-route message

#### Scenario: Route calculation fails
- **WHEN** Google route calculation fails
- **THEN** the page stops the route loading state and shows a route-specific error without fabricating route data

### Requirement: Carrier result display
The frontend SHALL render each carrier returned by the backend using the carrier name and trucks-per-day value supplied by the API.

#### Scenario: Carrier lookup succeeds
- **WHEN** the carrier API returns a successful carrier list
- **THEN** the page displays every carrier in response order and labels each numeric value as trucks per day

#### Scenario: Carrier lookup fails
- **WHEN** the carrier API request fails or returns a non-success response
- **THEN** the page stops the carrier loading state and shows a carrier-specific error without displaying invented carrier data

#### Scenario: One search branch fails
- **WHEN** route calculation succeeds but carrier lookup fails, or carrier lookup succeeds but route calculation fails
- **THEN** the page retains and displays the successful result while showing an error only for the failed branch

### Requirement: Search validation feedback
The frontend SHALL provide visible, human-readable validation feedback without sending backend or route requests when a search lacks two valid Google-selected cities.

#### Scenario: Invalid Search attempt
- **WHEN** the user attempts to search without two valid Google-selected cities
- **THEN** no route or carrier request is sent and the invalid control or controls are identified

