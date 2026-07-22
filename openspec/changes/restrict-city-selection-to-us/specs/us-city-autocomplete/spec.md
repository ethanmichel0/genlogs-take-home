## ADDED Requirements

### Requirement: United States city recommendations
The frontend SHALL configure Google Place Autocomplete for both the From and To fields to include only United States regions while continuing to include only locality results.

#### Scenario: From field autocomplete configuration
- **WHEN** the frontend initializes Google Place Autocomplete for the From field
- **THEN** the widget restricts included regions to the United States and restricts included primary types to locality

#### Scenario: To field autocomplete configuration
- **WHEN** the frontend initializes Google Place Autocomplete for the To field
- **THEN** the widget restricts included regions to the United States and restricts included primary types to locality

#### Scenario: Non-US city query
- **WHEN** a user enters a query matching a city outside the United States in either autocomplete field
- **THEN** that non-US city does not appear in the normal Google autocomplete suggestions

#### Scenario: US city query
- **WHEN** a user enters a query matching a United States city in either autocomplete field
- **THEN** matching locality suggestions remain available for selection through the existing interaction

### Requirement: Existing portal behavior remains unchanged
The system SHALL preserve the existing route-search, carrier lookup, validation, user interface, deployment, and API behavior except for limiting autocomplete recommendations to United States cities.

#### Scenario: Search using two selected US cities
- **WHEN** a user selects valid United States cities in both fields and starts a search
- **THEN** the existing route calculation, carrier lookup, loading, error, and result behavior proceeds without any new backend behavior

### Requirement: US search scope documentation
The repository SHALL document the United States city-search limitation and SHALL record the reviewer-feedback prompt that caused the change.

#### Scenario: Reader reviews application behavior
- **WHEN** a reader consults the README
- **THEN** the application description states that From and To searches are limited to United States cities

#### Scenario: Reader reviews meaningful AI prompts
- **WHEN** a reader consults `docs/ai-prompts.md`
- **THEN** the reviewer-feedback prompt and its resulting decision are recorded without credentials or private machine paths

### Requirement: Frontend verification
The implementation SHALL include deterministic frontend tests for the United States region restriction on both search fields and SHALL pass the frontend test suite and production build before completion.

#### Scenario: Automated configuration coverage
- **WHEN** the frontend tests run with the Google boundary mocked
- **THEN** they verify that both the From and To autocomplete widgets are configured for United States localities

#### Scenario: Completion verification
- **WHEN** implementation tasks are considered complete
- **THEN** the frontend test suite and production build have both completed successfully
