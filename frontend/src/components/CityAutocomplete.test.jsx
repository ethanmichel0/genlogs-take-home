import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CityAutocomplete from './CityAutocomplete';


function createAutocompleteGoogle() {
  const instances = [];

  class PlaceAutocompleteElement {
    constructor(options) {
      const input = document.createElement('input');
      input.options = options;
      instances.push(input);
      return input;
    }
  }

  return {
    instances,
    googleMaps: {
      maps: {
        importLibrary: vi.fn().mockResolvedValue({ PlaceAutocompleteElement }),
      },
    },
  };
}


describe('CityAutocomplete', () => {
  it('configures both search fields for United States localities', async () => {
    const { googleMaps, instances } = createAutocompleteGoogle();
    const onSelectionChange = vi.fn();
    const onError = vi.fn();

    render(
      <>
        <CityAutocomplete
          googleMaps={googleMaps}
          label="From city"
          selectedCity=""
          onSelectionChange={onSelectionChange}
          onError={onError}
        />
        <CityAutocomplete
          googleMaps={googleMaps}
          label="To city"
          selectedCity=""
          onSelectionChange={onSelectionChange}
          onError={onError}
        />
      </>,
    );

    await waitFor(() => expect(instances).toHaveLength(2));
    expect(instances.map(({ options }) => options)).toEqual([
      {
        includedPrimaryTypes: ['locality'],
        includedRegionCodes: ['us'],
      },
      {
        includedPrimaryTypes: ['locality'],
        includedRegionCodes: ['us'],
      },
    ]);
    expect(instances[0]).toHaveAttribute('aria-label', 'From city');
    expect(instances[1]).toHaveAttribute('aria-label', 'To city');
  });

  it('selects a Google place and invalidates it when the user edits', async () => {
    const { googleMaps, instances } = createAutocompleteGoogle();
    const onSelectionChange = vi.fn();
    const onError = vi.fn();
    const place = {
      displayName: 'New York',
      formattedAddress: 'New York, NY, USA',
      location: { lat: 40.7, lng: -74 },
      fetchFields: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <CityAutocomplete
        googleMaps={googleMaps}
        label="From city"
        selectedCity=""
        onSelectionChange={onSelectionChange}
        onError={onError}
      />,
    );

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(instances[0].options).toEqual({
      includedPrimaryTypes: ['locality'],
      includedRegionCodes: ['us'],
    });
    expect(instances[0]).toHaveAttribute('aria-label', 'From city');

    const selectionEvent = new Event('gmp-select');
    Object.defineProperty(selectionEvent, 'placePrediction', {
      value: { toPlace: () => place },
    });
    await act(async () => {
      instances[0].dispatchEvent(selectionEvent);
    });

    expect(place.fetchFields).toHaveBeenCalledWith({
      fields: ['displayName', 'formattedAddress', 'location'],
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ city: 'New York', place });

    act(() => {
      instances[0].dispatchEvent(new Event('input'));
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    expect(onError).not.toHaveBeenCalled();
  });

  it('rejects a prediction without a city identity', async () => {
    const { googleMaps, instances } = createAutocompleteGoogle();
    const onSelectionChange = vi.fn();
    const onError = vi.fn();
    const place = {
      displayName: '',
      location: null,
      fetchFields: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <CityAutocomplete
        googleMaps={googleMaps}
        label="To city"
        selectedCity=""
        onSelectionChange={onSelectionChange}
        onError={onError}
      />,
    );
    await waitFor(() => expect(instances).toHaveLength(1));

    const selectionEvent = new Event('gmp-select');
    Object.defineProperty(selectionEvent, 'placePrediction', {
      value: { toPlace: () => place },
    });
    await act(async () => {
      instances[0].dispatchEvent(selectionEvent);
    });

    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    expect(onError).toHaveBeenCalledWith('Choose a prediction that resolves to a city.');
  });
});
