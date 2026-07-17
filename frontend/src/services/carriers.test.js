import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchCarriers } from './carriers';


afterEach(() => {
  vi.unstubAllGlobals();
});


describe('fetchCarriers', () => {
  it('sends the documented request and returns carrier data', async () => {
    const carriers = [{ name: 'UPS Inc.', trucks_per_day: 11 }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ carriers }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchCarriers(
      'https://api.example/',
      'Denver',
      'Washington DC',
    );

    expect(result).toEqual(carriers);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example/api/carriers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_city: 'Denver',
        destination_city: 'Washington DC',
      }),
    });
  });

  it('uses the same origin when the production base URL is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ carriers: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchCarriers('', 'Denver', 'Chicago');

    expect(fetchMock).toHaveBeenCalledWith('/api/carriers', expect.any(Object));
  });

  it('reports non-success and malformed responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ unexpected: [] }),
      }),
    );

    await expect(fetchCarriers('http://api', 'A', 'B')).rejects.toThrow('status 503');
    await expect(fetchCarriers('http://api', 'A', 'B')).rejects.toThrow('invalid response');
  });
});
