export async function fetchCarriers(apiBaseUrl, originCity, destinationCity) {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/carriers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin_city: originCity,
      destination_city: destinationCity,
    }),
  });

  if (!response.ok) {
    throw new Error(`Carrier lookup failed with status ${response.status}.`);
  }

  const result = await response.json();
  if (!Array.isArray(result.carriers)) {
    throw new Error('Carrier lookup returned an invalid response.');
  }

  return result.carriers;
}

