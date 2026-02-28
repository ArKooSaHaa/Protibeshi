// src/features/relief/components/HelpOfferForm.tsx 
import { HeartHandshake } from 'lucide-react';
import {
  reliefAvailabilities,
  reliefContactPreferences,
  reliefHelpTypes,
  type HelpOfferFormState,
  type ReliefFormErrors,
} from '../types/relief.types';
import styles from './ReliefForm.module.css';

interface HelpOfferFormProps {
  form: HelpOfferFormState;
  errors: ReliefFormErrors<HelpOfferFormState>;
  onChange: <K extends keyof HelpOfferFormState>(key: K, value:
    HelpOfferFormState[K]) => void;
  onSubmit: () => void;
}

export const HelpOfferForm = ({
  form,
  errors,
  onChange,
  onSubmit,
}: HelpOfferFormProps) => {
  return (
    <div className={styles.form}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          <HeartHandshake size={18} style={{ color: '#059669' }} />
          Offer Help
        </h2>
        <p className={styles.formSubtitle}>
          Let your neighbors know what support you can provide.
        </p>
      </div>

      {/* Title */}
      <div className={styles.field}>
        <label className={styles.label}>Short summary *</label>
        <input
          className={`${styles.input} ${errors.title ? styles.error :
            ''}`}
          placeholder="e.g. Registered nurse offering free home visits"
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
        />
        {errors.title && <span
          className={styles.errorMsg}>{errors.title}</span>}
      </div>

      {/* Help Type */}
      <div className={styles.field}>
        <label className={styles.label}>Type of help you can offer
          *</label>
        <div className={styles.chipGroup}>
          {reliefHelpTypes.map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.chip} ${form.helpType === t ?
                styles.selected : ''}`}
              onClick={() => onChange('helpType', t)}
            >
              {t}
            </button>
          ))}
        </div>
        {errors.helpType && <span
          className={styles.errorMsg}>{errors.helpType}</span>}
      </div>

      {/* Description */}
      <div className={styles.field}>
        <label className={styles.label}>Description *</label>
        <textarea
          className={`${styles.textarea} ${errors.description ?
            styles.error : ''}`}
          placeholder="Describe what help you can provide, any 
limitations, and how people should contact you."
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
        />
        {errors.description && <span
          className={styles.errorMsg}>{errors.description}</span>}
      </div>

      {/* Availability */}
      <div className={styles.field}>
        <label className={styles.label}>Availability *</label>
        <div className={styles.chipGroup}>
          {reliefAvailabilities.map((a) => (
            <button
              key={a}
              type="button"
              className={`${styles.chip} ${form.availability === a ?
                styles.selected : ''}`}
              onClick={() => onChange('availability', a)}
            >
              {a}
            </button>
          ))}
        </div>
        {errors.availability && <span
          className={styles.errorMsg}>{errors.availability}</span>}
      </div>

      {/* Service Radius */}
      <div className={styles.field}>
        <label className={styles.label}>Service radius</label>
        <div className={styles.sliderRow}>
          <div className={styles.sliderLabel}>
            <span>Local</span>
            <span className={styles.sliderValue}>{form.serviceRadius}
              km</span>
            <span>10 km</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={10}
            step={0.5}
            value={form.serviceRadius}
            onChange={(e) => onChange('serviceRadius',
              Number(e.target.value))}
          />
        </div>
      </div>

      {/* Contact Preference */}
      <div className={styles.field}>
        <label className={styles.label}>Contact preference</label>
        <div className={styles.chipGroup}>
          {reliefContactPreferences.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${form.contactPreference === c
                ? styles.selected : ''}`}
              onClick={() => onChange('contactPreference', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Is Recurring */}
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          className={styles.checkBox}
          checked={form.isRecurring}
          onChange={(e) => onChange('isRecurring', e.target.checked)}
        />
        <span className={styles.checkLabel}>
          This is recurring / ongoing help (not one-time)
        </span>
      </label>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={onSubmit}
      >
        Post Help Offer
      </button>
    </div>
  );
}; 