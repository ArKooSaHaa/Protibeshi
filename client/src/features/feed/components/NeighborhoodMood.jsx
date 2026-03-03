// src/features/feed/components/NeighborhoodMood.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { MapPin, Maximize2, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import styles from './NeighborhoodMood.module.css';

const DEFAULT_CENTER = [23.7316, 90.4171];
const LOCATION_RADIUS_METERS = 500;
const MAP_PATH_OPTIONS = {
  color: '#10b981',
  fillColor: '#10b981',
  fillOpacity: 0.08,
  weight: 2,
};
const MARKER_PATH_OPTIONS = {
  color: '#10b981',
  fillColor: '#10b981',
  fillOpacity: 1,
  weight: 2,
};

/* Smooth flyTo animation */
function FlyToLocation({ center }) {
  const map = useMap();

  React.useEffect(() => {
    map.flyTo(center, 15, {
      duration: 1.5,
    });
  }, [center, map]);

  return null;
}

function NeighborhoodMapLayers({ center, locationText }) {
  return (
    <>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToLocation center={center} />

      <Circle center={center} radius={LOCATION_RADIUS_METERS} pathOptions={MAP_PATH_OPTIONS} />

      <CircleMarker
        center={center}
        radius={8}
        pathOptions={MARKER_PATH_OPTIONS}
      >
        <Tooltip
          direction="top"
          offset={[0, -12]}
          permanent
          className={styles.locationTooltip}
        >
          {locationText}
        </Tooltip>
      </CircleMarker>
    </>
  );
}

export const NeighborhoodMood = () => {
  const [center, setCenter] = React.useState(DEFAULT_CENTER);
  const [isLocating, setIsLocating] = React.useState(true);
  const [locationText, setLocationText] = React.useState('Detecting your location...');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationText('Current location unavailable');
      setIsLocating(false);
      return;
    }

    let isMounted = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setCenter([latitude, longitude]);
        setLocationText('You are here');
        setIsLocating(false);
      },
      () => {
        if (!isMounted) return;

        setLocationText('Current location unavailable');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 120000,
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const openModal = React.useCallback(() => setIsModalOpen(true), []);
  const closeModal = React.useCallback(() => setIsModalOpen(false), []);

  return (
    <>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.mapWrapper}>
          {isLocating && (
            <div className={styles.overlay}>
              Detecting your location...
            </div>
          )}

          <button
            type="button"
            className={styles.expandBtn}
            onClick={openModal}
            aria-label="Expand neighborhood map"
          >
            <Maximize2 size={16} />
          </button>

          <MapContainer
            center={center}
            zoom={15}
            scrollWheelZoom={false}
            className={styles.map}
          >
            <NeighborhoodMapLayers center={center} locationText={locationText} />
          </MapContainer>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.title}>Neighborhood Mood</h3>
            <span className={styles.status}>Live map</span>
          </div>

          <p className={styles.description}>
            <MapPin size={14} />
            Showing nearby {LOCATION_RADIUS_METERS}m radius
          </p>
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded neighborhood map"
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeModal}
                aria-label="Close expanded map"
              >
                <X size={18} />
              </button>

              <MapContainer
                center={center}
                zoom={16}
                scrollWheelZoom
                className={styles.fullMap}
              >
                <NeighborhoodMapLayers center={center} locationText={locationText} />
              </MapContainer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};