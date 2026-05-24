import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { ENV } from '@/config/env';
import {
  loadGoogleMapsPlaces,
  reverseGeocode,
  resolveNeighborhoodFromPlace,
  type GoogleMapsAutocompleteListener,
} from '@/lib/googleMaps';
import styles from './CreatePostModal.module.css';

type CreatePostPayload = {
  title: string;
  short_description: string;
  content: string;
  label: string;
  location: string;
  image: File | null;
};

type CreatePostModalProps = {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CreatePostPayload) => Promise<boolean>;
};

const LABEL_OPTIONS = ['Emergency', 'Community', 'Event'];

const INITIAL_STATE: CreatePostPayload = {
  title: '',
  short_description: '',
  content: '',
  label: 'Community',
  location: '',
  image: null,
};

export const CreatePostModal = ({ open, submitting, error, onClose, onSubmit }: CreatePostModalProps) => {
  const [formState, setFormState] = useState<CreatePostPayload>(INITIAL_STATE);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteListenerRef = useRef<GoogleMapsAutocompleteListener | null>(null);
  const mapsApiKey = ENV.GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocationMessage(null);

    if (!mapsApiKey) {
      setLocationMessage('Google Maps is not configured. Set VITE_GOOGLE_MAPS_API_KEY to enable address suggestions.');
      return;
    }

    let cancelled = false;

    const initializeAutocomplete = async () => {
      try {
        const mapsApi = await loadGoogleMapsPlaces(mapsApiKey);

        if (cancelled || !locationInputRef.current) {
          return;
        }

        const autocomplete = new mapsApi.maps.places.Autocomplete(locationInputRef.current, {
          fields: ['formatted_address', 'name', 'address_components'],
          types: ['geocode'],
        });

        autocompleteListenerRef.current = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const nextLocation = resolveNeighborhoodFromPlace(place);
          if (!nextLocation) {
            return;
          }

          setFormState((previous) => ({ ...previous, location: nextLocation }));
          setLocationMessage('Address selected from Google Maps.');
        });
      } catch {
        if (!cancelled) {
          setLocationMessage('Unable to load Google Maps suggestions right now.');
        }
      }
    };

    void initializeAutocomplete();

    return () => {
      cancelled = true;
      autocompleteListenerRef.current?.remove();
      autocompleteListenerRef.current = null;
    };
  }, [mapsApiKey, open]);

  if (!open) {
    return null;
  }

  const handleTextChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormState((previous) => ({ ...previous, image: file }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isSuccess = await onSubmit(formState);

    if (isSuccess) {
      setFormState(INITIAL_STATE);
      setLocationMessage(null);
    }
  };

  const resolveCurrentLocation = async () => {
    if (!mapsApiKey) {
      setLocationMessage('Google Maps is not configured. Set VITE_GOOGLE_MAPS_API_KEY to enable this feature.');
      return;
    }

    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported in this browser.');
      return;
    }

    setLocationLoading(true);
    setLocationMessage(null);

    try {
      const mapsApi = await loadGoogleMapsPlaces(mapsApiKey);

      const coordinates = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => reject(new Error('Unable to access current location.')),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          },
        );
      });

      const place = await reverseGeocode(mapsApi, coordinates);
      const address = resolveNeighborhoodFromPlace(place) || place.formatted_address?.trim();
      if (!address) {
        throw new Error('No address found for your location.');
      }

      setFormState((previous) => ({ ...previous, location: address }));
      setLocationMessage('Current address added from Google Maps.');
    } catch {
      setLocationMessage('Unable to fetch your current address right now.');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Create post</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Title</span>
            <input
              name="title"
              value={formState.title}
              onChange={handleTextChange}
              className={styles.input}
              placeholder="Post title"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Short description</span>
            <textarea
              name="short_description"
              value={formState.short_description}
              onChange={handleTextChange}
              className={styles.textarea}
              rows={2}
              placeholder="Add a short summary"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Content</span>
            <textarea
              name="content"
              value={formState.content}
              onChange={handleTextChange}
              className={styles.textarea}
              rows={4}
              placeholder="Share full details"
              required
            />
          </label>

          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span className={styles.label}>Label</span>
              <select name="label" value={formState.label} onChange={handleTextChange} className={styles.input}>
                {LABEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Location</span>
              <input
                ref={locationInputRef}
                name="location"
                value={formState.location}
                onChange={handleTextChange}
                className={styles.input}
                placeholder="Search your address"
                autoComplete="off"
              />
              <div className={styles.locationHelperRow}>
                <button
                  type="button"
                  className={styles.locationActionButton}
                  onClick={() => void resolveCurrentLocation()}
                  disabled={locationLoading}
                >
                  {locationLoading ? 'Finding address...' : 'Use current location'}
                </button>
                {locationMessage ? <p className={styles.locationHint}>{locationMessage}</p> : null}
              </div>
            </label>
          </div>

          <label className={styles.uploadBox}>
            <input type="file" className={styles.hiddenFile} accept="image/*" onChange={handleImageChange} />
            <ImagePlus size={16} />
            <span>{formState.image ? formState.image.name : 'Upload image'}</span>
          </label>

          {error ? <p className={styles.errorText}>{error}</p> : null}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? <Loader2 size={14} className={styles.spin} /> : null}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type { CreatePostPayload };