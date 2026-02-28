// src/features/rent/components/AddPropertyModal.jsx
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import styles from './AddPropertyModal.module.css';

const initialForm = {
  title: '',
  price: '',
  deposit: '',
  location: '',
  distance: '',
  beds: '1',
  baths: '1',
  sqft: '',
  type: 'apartment',
  furnishing: 'semi-furnished',
  availability: 'now',
  availabilityDate: '',
  verified: true,
  badge: 'verified',
};

const AddPropertyModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState('');
  const [imageName, setImageName] = useState('');

  const isDatedAvailability = formData.availability === 'dated';

  const formValid = useMemo(() => {
    if (!imagePreview) return false;
    if (!formData.title.trim()) return false;
    if (!formData.location.trim()) return false;
    if (!formData.price || Number(formData.price) <= 0) return false;
    if (!formData.deposit || Number(formData.deposit) < 0) return false;
    if (!formData.distance || Number(formData.distance) <= 0) return false;
    if (!formData.sqft || Number(formData.sqft) <= 0) return false;
    if (isDatedAvailability && !formData.availabilityDate) return false;
    return true;
  }, [formData, imagePreview, isDatedAvailability]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'verified') {
      setFormData((prev) => ({
        ...prev,
        verified: checked,
        badge: checked ? prev.badge || 'verified' : 'owner',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setImageName(file.name);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formValid) return;

    onSubmit({
      title: formData.title.trim(),
      price: Number(formData.price),
      deposit: Number(formData.deposit),
      location: formData.location.trim(),
      distance: Number(formData.distance),
      beds: Number(formData.beds),
      baths: Number(formData.baths),
      sqft: Number(formData.sqft),
      image: imagePreview,
      badge: formData.badge,
      availability: formData.availability,
      availabilityDate: isDatedAvailability ? formData.availabilityDate : null,
      verified: formData.verified,
      furnishing: formData.furnishing,
      type: formData.type,
    });
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>Add Property</h2>
          <motion.button
            type="button"
            className={styles.iconButton}
            whileHover={{ y: -2, scale: 1.04 }}
            whileTap={{ y: 1, scale: 0.97 }}
            onClick={onClose}
          >
            <X size={18} />
          </motion.button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.imageUploadWrap}>
            <label className={styles.uploadLabel} htmlFor="room-image">
              <Upload size={16} />
              {imageName || 'Upload room picture'}
            </label>
            <input
              id="room-image"
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleImageChange}
              required
            />
            {imagePreview && <img src={imagePreview} alt="Room preview" className={styles.previewImage} />}
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Title</span>
              <input name="title" value={formData.title} onChange={handleInputChange} required />
            </label>
            <label className={styles.field}>
              <span>Location</span>
              <input name="location" value={formData.location} onChange={handleInputChange} required />
            </label>
            <label className={styles.field}>
              <span>Price (৳)</span>
              <input
                type="number"
                name="price"
                min="1"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Deposit (৳)</span>
              <input
                type="number"
                name="deposit"
                min="0"
                value={formData.deposit}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Distance (m)</span>
              <input
                type="number"
                name="distance"
                min="1"
                value={formData.distance}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Size (sq ft)</span>
              <input
                type="number"
                name="sqft"
                min="1"
                value={formData.sqft}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Beds</span>
              <select name="beds" value={formData.beds} onChange={handleInputChange}>
                <option value="0">Studio</option>
                <option value="1">1 Bed</option>
                <option value="2">2 Bed</option>
                <option value="3">3 Bed</option>
                <option value="4">4+ Bed</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Baths</span>
              <select name="baths" value={formData.baths} onChange={handleInputChange}>
                <option value="1">1 Bath</option>
                <option value="2">2 Bath</option>
                <option value="3">3 Bath</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Type</span>
              <select name="type" value={formData.type} onChange={handleInputChange}>
                <option value="apartment">Apartment</option>
                <option value="sublet">Sublet</option>
                <option value="room">Room</option>
                <option value="studio">Studio</option>
                <option value="shared">Shared</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Furnishing</span>
              <select name="furnishing" value={formData.furnishing} onChange={handleInputChange}>
                <option value="fully-furnished">Fully furnished</option>
                <option value="semi-furnished">Semi-furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Availability</span>
              <select name="availability" value={formData.availability} onChange={handleInputChange}>
                <option value="now">Available now</option>
                <option value="flexible">Flexible</option>
                <option value="dated">Specific date</option>
              </select>
            </label>
            {isDatedAvailability && (
              <label className={styles.field}>
                <span>Available From</span>
                <input
                  type="text"
                  name="availabilityDate"
                  placeholder="e.g., 25 Mar 2026"
                  value={formData.availabilityDate}
                  onChange={handleInputChange}
                  required
                />
              </label>
            )}
            <label className={styles.field}>
              <span>Badge</span>
              <select name="badge" value={formData.badge} onChange={handleInputChange}>
                <option value="verified">Verified</option>
                <option value="owner">Owner</option>
                <option value="agent">Agent</option>
              </select>
            </label>
          </div>

          <label className={styles.checkWrap}>
            <input
              type="checkbox"
              name="verified"
              checked={formData.verified}
              onChange={handleInputChange}
            />
            <span>Mark as verified landlord</span>
          </label>

          <div className={styles.actions}>
            <motion.button
              type="button"
              className={styles.secondaryButton}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 1, scale: 0.98 }}
              onClick={onClose}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className={styles.primaryButton}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 1, scale: 0.98 }}
              disabled={!formValid}
            >
              Add to Rent Feed
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddPropertyModal;
