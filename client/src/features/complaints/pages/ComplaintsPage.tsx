// src/features/complaints/pages/ComplaintsPage.tsx 
import { AnimatePresence, motion } from 'framer-motion';
import { FilePlus2, X } from 'lucide-react';
import { useEffect, useMemo } from 'react'; import { ComplaintDetailsDrawer } from
  '../components/ComplaintDetailsDrawer';
import { ComplaintForm } from '../components/ComplaintForm';
import { ComplaintList } from '../components/ComplaintList';
import { ComplaintsHeader } from '../components/ComplaintsHeader';
import { useComplaintsBoard } from '../hooks/useComplaintsBoard';
import { ComplaintItem } from '../types/complaint.types'; import styles from './ComplaintsPage.module.css';

export const ComplaintsPage = () => {
  const {
    filteredComplaints,
    selectedComplaint,
    setSelectedComplaint, isFormOpen,
    setIsFormOpen,
    formState,
    formErrors,
    updateFormValue,
    handleSubmit,
  } = useComplaintsBoard();

  const locationLabel = 'Motijheel • 350m radius';

  useEffect(() => {
    document.body.style.overflow = isFormOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen]);


  const handleViewDetails = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
  };

  const handleWhy = (complaint: ComplaintItem) => {
    console.log('Why am I seeing this?', complaint);
  };

  const handleReport = (complaint: ComplaintItem) => {
    console.log('Report complaint', complaint);
  };

  const complaintsMemo = useMemo(() => filteredComplaints,
    [filteredComplaints]);

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.rightColumn}>
          <ComplaintsHeader locationLabel={locationLabel}
            onSubmitClick={() => setIsFormOpen(true)} />

          <p className={styles.recordsCount}>
            {complaintsMemo.length} {complaintsMemo.length === 1 ?
              'record' : 'records'}
          </p>

          <ComplaintList
            complaints={complaintsMemo}
            onViewDetails={handleViewDetails}
            onWhy={handleWhy} onReport={handleReport}
          />
        </div>
      </div>

      <motion.button
        type="button"
        className={styles.mobileSubmit}
        onClick={() => setIsFormOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}

      >
        <FilePlus2 size={16} /> Submit Complaint
      </motion.button>

      <ComplaintDetailsDrawer
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => setIsFormOpen(false)}          >
            <motion.div
              className={styles.modalContainer}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }} onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsFormOpen(false)}
                aria-label="Close submit complaint dialog"              >
                <X size={18} />
              </button>
              <ComplaintForm
                formState={formState}
                formErrors={formErrors}
                onChange={updateFormValue} onSubmit={handleSubmit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 
