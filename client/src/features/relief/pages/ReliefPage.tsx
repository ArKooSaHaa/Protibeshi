// src/features/relief/pages/ReliefPage.tsx 
import { AnimatePresence, motion } from 'framer-motion'; 
import { HandHeart, X } from 'lucide-react'; 
import { useEffect } from 'react'; 
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
 const { 
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
   offerForm, 
   offerFormErrors, 
   updateOfferField, 
   handleSubmitOffer, 
 } = useReliefBoard(); 
 
 // Lock body scroll when modal is open 
 useEffect(() => { 
   document.body.style.overflow = modalMode ? 'hidden' : ''; 
   return () => { document.body.style.overflow = ''; }; 
 }, [modalMode]); 
 
 const handleViewRequest = (r: ReliefRequest) => setSelectedRequest(r); 
 const handleVolunteer = (_r: ReliefRequest) => void _r; 
 const handleViewOffer = (_o: HelpOffer) => void _o; 
 const handleRequestSupport = (_o: HelpOffer) => void _o; 
 
 const activeCount = filters.tab === 'requests' ? 
filteredRequests.length : filteredOffers.length; 
 
 return ( 
   <div className={styles.page}> 
     {/* Page Header */} 
     <ReliefHeader 
       locationLabel="Motijheel • 350m radius" 
       onRequestHelp={() => setModalMode('request')} 
       onOfferHelp={() => setModalMode('offer')} 
     /> 
 
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
                 onChange={updateRequestField} 
                 onSubmit={handleSubmitRequest} 
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