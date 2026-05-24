import { getPlaceList } from '@/data/placeList';

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GooglePlaceResult = {
  formatted_address?: string;
  name?: string;
  address_components?: GoogleAddressComponent[];
};

type GoogleMapsAutocompleteListener = {
  remove: () => void;
};

type GoogleMapsAutocomplete = {
  addListener: (eventName: 'place_changed', handler: () => void) => GoogleMapsAutocompleteListener;
  getPlace: () => GooglePlaceResult;
};

type GoogleMapsApi = {
  maps: {
    places: {
      Autocomplete: new (
        inputField: HTMLInputElement,
        options?: {
          fields?: string[];
          types?: string[];
        },
      ) => GoogleMapsAutocomplete;
    };
    Geocoder: new () => {
      geocode: (
        request: { location: { lat: number; lng: number } },
        callback: (results: GooglePlaceResult[] | null, status: string) => void,
      ) => void;
    };
  };
};

type BrowserWindowWithGoogle = Window & {
  google?: GoogleMapsApi;
};

const GOOGLE_MAPS_SCRIPT_ID = 'protibeshi-google-maps-places-script';
let googleMapsScriptPromise: Promise<GoogleMapsApi> | null = null;

const getGoogleMapsApi = (): GoogleMapsApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return ((window as BrowserWindowWithGoogle).google ?? null) as GoogleMapsApi | null;
};

export const loadGoogleMapsPlaces = (apiKey: string): Promise<GoogleMapsApi> => {
  const normalizedApiKey = apiKey.trim();
  if (!normalizedApiKey) {
    return Promise.reject(new Error('Google Maps API key is missing.'));
  }

  const existingGoogleApi = getGoogleMapsApi();
  if (existingGoogleApi?.maps?.places) {
    return Promise.resolve(existingGoogleApi);
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  const scriptPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener(
        'load',
        () => {
          const mapsApi = getGoogleMapsApi();
          if (mapsApi?.maps?.places) {
            resolve(mapsApi);
            return;
          }

          reject(new Error('Google Maps Places library is not available.'));
        },
        { once: true },
      );

      existingScript.addEventListener(
        'error',
        () => {
          reject(new Error('Unable to load Google Maps script.'));
        },
        { once: true },
      );

      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(normalizedApiKey)}&libraries=places`;

    script.onload = () => {
      const mapsApi = getGoogleMapsApi();
      if (mapsApi?.maps?.places) {
        resolve(mapsApi);
        return;
      }

      reject(new Error('Google Maps Places library failed to initialize.'));
    };

    script.onerror = () => {
      reject(new Error('Unable to load Google Maps script.'));
    };

    document.head.appendChild(script);
  }).catch((error) => {
    googleMapsScriptPromise = null;
    throw error;
  });

  googleMapsScriptPromise = scriptPromise;
  return scriptPromise;
};

const getAddressComponent = (
  components: GoogleAddressComponent[] | undefined,
  componentTypes: string[],
): string => {
  if (!components || components.length === 0) {
    return '';
  }

  const match = components.find((component) =>
    componentTypes.some((componentType) => component.types.includes(componentType)),
  );

  return match?.long_name?.trim() || '';
};

const normalizePlaceText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const PLACE_MATCHERS = getPlaceList()
  .map((place) => ({
    name: place,
    normalized: normalizePlaceText(place),
  }))
  .filter((place) => place.normalized.length > 0);

const matchPlaceFromText = (value: string): string => {
  const normalizedValue = normalizePlaceText(value);
  if (!normalizedValue) {
    return '';
  }

  const paddedValue = ` ${normalizedValue} `;
  let bestMatch = '';
  let bestLength = 0;

  for (const place of PLACE_MATCHERS) {
    const paddedPlace = ` ${place.normalized} `;
    if (paddedValue.includes(paddedPlace) && place.normalized.length > bestLength) {
      bestMatch = place.name;
      bestLength = place.normalized.length;
    }
  }

  return bestMatch;
};

export const resolveNeighborhoodFromPlace = (place: GooglePlaceResult | null | undefined): string => {
  if (!place) {
    return '';
  }

  const components = place.address_components;

  const candidates = [
    getAddressComponent(components, ['neighborhood']),
    getAddressComponent(components, ['sublocality_level_1']),
    getAddressComponent(components, ['sublocality']),
    getAddressComponent(components, ['administrative_area_level_3']),
    place.name?.trim() || '',
    place.formatted_address?.trim() || '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const match = matchPlaceFromText(candidate);
    if (match) {
      return match;
    }
  }

  return candidates[0] || '';
};

export const resolveCityFromPlace = (place: GooglePlaceResult | null | undefined): string => {
  if (!place) {
    return '';
  }

  const components = place.address_components;

  return (
    getAddressComponent(components, ['locality'])
    || getAddressComponent(components, ['postal_town'])
    || getAddressComponent(components, ['administrative_area_level_2'])
    || getAddressComponent(components, ['administrative_area_level_1'])
    || ''
  );
};

export const reverseGeocode = (
  mapsApi: GoogleMapsApi,
  coordinates: { lat: number; lng: number },
): Promise<GooglePlaceResult> => {
  return new Promise((resolve, reject) => {
    const geocoder = new mapsApi.maps.Geocoder();

    geocoder.geocode({ location: coordinates }, (results, status) => {
      if (status === 'OK' && Array.isArray(results) && results[0]) {
        resolve(results[0]);
        return;
      }

      reject(new Error('No address found for your location.'));
    });
  });
};

export type { GoogleMapsApi, GoogleMapsAutocompleteListener };