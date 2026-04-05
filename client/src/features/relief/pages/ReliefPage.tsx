// src/features/relief/pages/ReliefPage.tsx 
import { AnimatePresence, motion } from 'framer-motion';
import { HandHeart, X } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { HelpOfferForm } from '../components/HelpOfferForm';
import { ReliefDetailsDrawer } from
  '../components/ReliefDetailsDrawer';
import { ReliefFiltersDrawer } from
  '../components/ReliefFiltersDrawer';
import { ReliefHeader } from '../components/ReliefHeader';
import { ReliefList } from '../components/ReliefList';
import { ReliefRequestForm } from '../components/ReliefRequestForm';
import { ReliefTabs } from '../components/ReliefTabs';
import { useReliefBoard } from '../hooks/useReliefBoard';
import type { HelpOffer, ReliefRequest } from '../types/relief.types';
import styles from './ReliefPage.module.css';

export const ReliefPage = () => {
  const navigate = useNavigate();

  const {
    isLoading,
    isSubmitting,
    offeringRequestId,
    commentingRequestId,
    reportingRequestId,
    errorMessage,
    successMessage,
    currentUserId,
    filteredRequests,
    filteredOffers,
    filters,
    isFilterOpen,
    setIsFilterOpen,
    activeFilterCount,
    toggleTab,
    toggleHelpType,
    toggleUrgency,
    toggleStatus,
    setTimeRange,
    setDistance,
    setVerifiedOnly,
    resetFilters,
    modalMode,
    setModalMode,
    selectedRequest,
    setSelectedRequest,
    requestForm,
    requestFormErrors,
    updateRequestField,
    handleSubmitRequest,
    onOfferHelp,
    onSubmitRequestComment,
    onReportRequest,
    clearFeedback,
    offerForm,
    offerFormErrors,
    updateOfferField,
    handleSubmitOffer,
  } = useReliefBoard({
    onUnauthorized: () => {
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });

  // Lock body scroll when modal is open 
  useEffect(() => {
    document.body.style.overflow = modalMode ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalMode]);

  useEffect(() => {
    if (!errorMessage && !successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearFeedback();
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [errorMessage, successMessage, clearFeedback]);

  const handleViewRequest = (r: ReliefRequest) => setSelectedRequest(r);
  const handleVolunteer = (request: ReliefRequest) => {
    void onOfferHelp(request);
  };
  const handleViewOffer = (_o: HelpOffer) => void _o;
  const handleRequestSupport = (_o: HelpOffer) => void _o;

  const activeCount = filters.tab === 'requests' ?
    filteredRequests.length : filteredOffers.length;

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <ReliefHeader
        locationLabel="Neighborhood Relief"
        onRequestHelp={() => setModalMode('request')}
        onOfferHelp={() => setModalMode('offer')}
      />

      {isLoading && (
        <div className={styles.stateInfo}>Loading relief requests...</div>
      )}

      {errorMessage && (
        <div className={styles.errorBanner}>{errorMessage}</div>
      )}

      {successMessage && (
        <div className={styles.successBanner}>{successMessage}</div>
      )}

      {/* Tabs + Filter toggle */}
      <div className={styles.controls}>
        <ReliefTabs
          activeTab={filters.tab}
          requestCount={filteredRequests.length}
          offerCount={filteredOffers.length}
          activeFilterCount={activeFilterCount}
          onTabChange={toggleTab}
          onFilterOpen={() => setIsFilterOpen(true)}
        />
        <p className={styles.recordsBar}>
          {activeCount} {activeCount === 1 ? 'record' : 'records'}
        </p>
      </div>

      {/* Main List */}
      <ReliefList
        tab={filters.tab}
        requests={filteredRequests}
        offers={filteredOffers}
        onViewRequest={handleViewRequest}
        onVolunteer={handleVolunteer}
        offeringRequestId={offeringRequestId}
        onViewOffer={handleViewOffer}
        onRequestSupport={handleRequestSupport}
      />

      {/* Mobile sticky CTA */}
      <motion.button
        className={styles.mobileCta}
        onClick={() => setModalMode('request')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        type="button"
      >
        <HandHeart size={16} />
        Request Help
      </motion.button>

      {/* Details Drawer */}
      <ReliefDetailsDrawer
        request={selectedRequest}
        currentUserId={currentUserId}
        isSubmittingComment={commentingRequestId === selectedRequest?.id}
        isSubmittingReport={reportingRequestId === selectedRequest?.id}
        onSubmitComment={onSubmitRequestComment}
        onReport={onReportRequest}
        onClose={() => setSelectedRequest(null)}
      />

      {/* Filters Drawer */}
      <ReliefFiltersDrawer
        isOpen={isFilterOpen}
        filters={filters}
        onClose={() => setIsFilterOpen(false)}
        onToggleHelpType={toggleHelpType}
        onToggleUrgency={toggleUrgency}
        onToggleStatus={toggleStatus}
        onSetTimeRange={setTimeRange}
        onSetDistance={setDistance}
        onSetVerifiedOnly={setVerifiedOnly}
        onReset={resetFilters}
      />

      {/* Request / Offer Form Modal */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setModalMode(null)}
          >
            <motion.div
              className={styles.modalContainer}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.modalClose}
                onClick={() => setModalMode(null)}
                type="button"
              >
                <X size={16} />
              </button>

              {modalMode === 'request' ? (
                <ReliefRequestForm
                  form={requestForm}
                  errors={requestFormErrors}
                  isSubmitting={isSubmitting}
                  onChange={updateRequestField}
                  onSubmit={() => {
                    void handleSubmitRequest();
                  }}
                />
              ) : (
                <HelpOfferForm
                  form={offerForm}
                  errors={offerFormErrors}
                  onChange={updateOfferField}
                  onSubmit={handleSubmitOffer}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 