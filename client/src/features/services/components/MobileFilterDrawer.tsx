import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ServiceFilterState } from '../types/service.types';
import { ServicesFilters } from './ServicesFilters';
import styles from './MobileFilterDrawer.module.css';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  filters: ServiceFilterState;
  onClose: () => void;
  onFilterChange: (next: ServiceFilterState) => void;
}

export const MobileFilterDrawer = ({
  isOpen,
  filters,
  onClose,
  onFilterChange,
}: MobileFilterDrawerProps) => {
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
            initial={{ y: 32, opacity: 0 }}
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
            <ServicesFilters filters={filters} onFilterChange={onFilterChange} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
