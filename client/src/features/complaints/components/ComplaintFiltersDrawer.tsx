import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ComplaintFilterState } from '../types/complaint.types';
import { ComplaintFilters } from './ComplaintFilters';
import styles from './ComplaintFiltersDrawer.module.css';

interface ComplaintFiltersDrawerProps {
  isOpen: boolean;
  filters: ComplaintFilterState;
  onClose: () => void;
  onChange: (next: ComplaintFilterState) => void;
}

export const ComplaintFiltersDrawer = ({ isOpen, filters, onClose, onChange }: ComplaintFiltersDrawerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <h4>Filters</h4>
              <button type="button" className={styles.closeButton} onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            <ComplaintFilters filters={filters} onChange={onChange} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
