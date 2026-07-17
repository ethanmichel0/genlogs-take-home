let googleMapsPromise;

export function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured.'));
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__initGenlogsGoogleMaps';
    const existingScript = document.querySelector('[data-genlogs-google-maps]');

    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google);
    };

    if (existingScript) {
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google Maps failed to load. Check the API key and enabled services.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
      loading: 'async',
      callback: callbackName,
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.dataset.genlogsGoogleMaps = 'true';
    script.onerror = () => {
      googleMapsPromise = undefined;
      delete window[callbackName];
      reject(new Error('Google Maps failed to load. Check the API key and enabled services.'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

