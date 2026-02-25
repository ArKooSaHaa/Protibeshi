import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, DollarSign, Tag, FileText, Settings } from 'lucide-react';
import styles from './CreateListingModal.module.css';

const CATEGORIES = [
  'Electronics',
  'Vehicles',
  'Fashion',
  'Furniture',
  'Services',
  'Other',
];

const CreateListingModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: '',
    photoUrl: '',
    details: '',
    options: '',
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  /* =========================
     Disable background scroll
  ========================= */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* =========================
     ESC key closes modal
  ========================= */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  /* =========================
     Handlers
  ========================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          photoUrl: reader.result,
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('New listing:', formData);

    setFormData({
      title: '',
      price: '',
      category: '',
      photoUrl: '',
      details: '',
      options: '',
    });

    setPhotoPreview(null);
    onClose();
  };

  const handleReset = () => {
    setFormData({
      title: '',
      price: '',
      category: '',
      photoUrl: '',
      details: '',
      options: '',
    });

    setPhotoPreview(null);
    onClose();
  };

  /* =========================
     Render
  ========================= */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleReset}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()} // Prevent backdrop close
          >
            {/* ================= HEADER ================= */}
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Create New Listing</h2>
                <p className={styles.modalSubtitle}>
                  Add your item to the marketplace
                </p>
              </div>

              <motion.button
                className={styles.closeButton}
                onClick={handleReset}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close modal"
                type="button"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* ================= CONTENT ================= */}
            <form onSubmit={handleSubmit} className={styles.modalContent}>
              {/* Photo Upload */}
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>Add Photo</label>

                <div className={styles.photoUploadArea}>
                  {photoPreview ? (
                    <div className={styles.photoPreview}>
                      <img src={photoPreview} alt="Preview" />

                      <motion.label
                        className={styles.changePhotoButton}
                        htmlFor="photo-input"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Upload size={14} />
                        Change
                      </motion.label>
                    </div>
                  ) : (
                    <motion.label
                      htmlFor="photo-input"
                      className={styles.uploadPrompt}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Upload size={24} />
                      <span>Click to upload photo</span>
                    </motion.label>
                  )}

                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className={styles.photoInput}
                  />
                </div>
              </div>

              {/* Title */}
              <div className={styles.formSection}>
                <label htmlFor="title" className={styles.fieldLabel}>
                  Title <span className={styles.required}>*</span>
                </label>

                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., iPhone 14 Pro Max - Like New"
                  className={styles.textInput}
                  required
                />
              </div>

              {/* Price & Category */}
              <div className={styles.formRow}>
                <div className={styles.formSection}>
                  <label htmlFor="price" className={styles.fieldLabel}>
                    Price <span className={styles.required}>*</span>
                  </label>

                  <div className={styles.inputWithIcon}>
                    <DollarSign size={16} />
                    <input
                      id="price"
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="BDT 2,500"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <label htmlFor="category" className={styles.fieldLabel}>
                    Category <span className={styles.required}>*</span>
                  </label>

                  <div className={styles.inputWithIcon}>
                    <Tag size={16} />
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className={styles.formSection}>
                <label htmlFor="details" className={styles.fieldLabel}>
                  <FileText size={16} />
                  Details
                </label>

                <textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder="Describe your item..."
                  className={styles.textareaInput}
                  rows={4}
                />
              </div>

              {/* Options */}
              <div className={styles.formSection}>
                <label htmlFor="options" className={styles.fieldLabel}>
                  <Settings size={16} />
                  Additional Options
                </label>

                <textarea
                  id="options"
                  name="options"
                  value={formData.options}
                  onChange={handleInputChange}
                  placeholder="e.g., Warranty included"
                  className={styles.textareaInput}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className={styles.modalActions}>
                <motion.button
                  type="button"
                  onClick={handleReset}
                  className={styles.cancelButton}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="submit"
                  className={styles.submitButton}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Listing
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateListingModal;