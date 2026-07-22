import { useEffect, useRef } from 'react';

export default function CityAutocomplete({
  googleMaps,
  label,
  selectedCity,
  onSelectionChange,
  onError,
}) {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!googleMaps || !hostRef.current) return undefined;

    let active = true;
    let autocomplete;

    const handleInput = () => {
      if (active) onSelectionChange(null);
    };

    const handleSelect = async ({ placePrediction }) => {
      try {
        const place = placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        });

        const city = place.displayName?.trim();
        if (!city || !place.location) {
          throw new Error('Choose a prediction that resolves to a city.');
        }

        if (active) onSelectionChange({ city, place });
      } catch (error) {
        if (active) {
          onSelectionChange(null);
          onError(error instanceof Error ? error.message : 'Unable to select that city.');
        }
      }
    };

    async function initialize() {
      const { PlaceAutocompleteElement } = await googleMaps.maps.importLibrary('places');
      if (!active || !hostRef.current) return;

      autocomplete = new PlaceAutocompleteElement({
        includedPrimaryTypes: ['locality'],
        includedRegionCodes: ['us'],
      });
      autocomplete.placeholder = `Search ${label.toLowerCase()}`;
      autocomplete.setAttribute('aria-label', label);
      autocomplete.addEventListener('input', handleInput);
      autocomplete.addEventListener('gmp-select', handleSelect);
      hostRef.current.replaceChildren(autocomplete);
    }

    initialize().catch((error) => {
      if (active) onError(error instanceof Error ? error.message : 'City search failed to load.');
    });

    return () => {
      active = false;
      if (autocomplete) {
        autocomplete.removeEventListener('input', handleInput);
        autocomplete.removeEventListener('gmp-select', handleSelect);
      }
      hostRef.current?.replaceChildren();
    };
  }, [googleMaps, label, onError, onSelectionChange]);

  return (
    <div className="city-field">
      <label className="field-label">{label}</label>
      <div className="autocomplete-host" ref={hostRef} />
      <p className={`selection-state ${selectedCity ? 'is-selected' : ''}`}>
        {selectedCity ? `Selected: ${selectedCity}` : 'Select a city from Google suggestions'}
      </p>
    </div>
  );
}
