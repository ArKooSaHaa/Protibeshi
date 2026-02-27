//  src/features/services/pages/ServicesPage.tsx 
import { useRef } from 'react'; 
import { AnimatePresence, motion, useScroll, useTransform } from 
'framer-motion'; 
import { Filter, TriangleAlert } from 'lucide-react'; 
import { MobileFilterDrawer } from '../components/MobileFilterDrawer'; 
import { OfferServiceModal } from '../components/OfferServiceModal'; 
import { ServiceCard } from '../components/ServiceCard'; 
import { ServiceChatDrawer } from '../components/ServiceChatDrawer'; 
import { ServiceDetailsDrawer } from 
'../components/ServiceDetailsDrawer'; 
import { ServicesFilters } from '../components/ServicesFilters'; 
import { ServicesHero } from '../components/ServicesHero'; 
import { ServiceItem } from '../types/service.types'; 
import { useServicesMarketplace } from 
'../hooks/useServicesMarketplace'; 
import styles from './ServicesPage.module.css'; 
 
const cardContainerVariants = { 
 hidden: { opacity: 0 }, 
 visible: { 
   opacity: 1, 
   transition: { 
     staggerChildren: 0.08, 
     delayChildren: 0.15, 
   }, 
 }, 
}; 
 
const cardItemVariants = { 
 hidden: { opacity: 0, y: 20 }, 
 visible: { 
   opacity: 1, 
   y: 0, 
   transition: { 
     duration: 0.35, 
     ease: [0.25, 0.46, 0.45, 0.94] as const, 
   }, 
 }, 
}; 
 
export const ServicesPage = () => { 
 const containerRef = useRef<HTMLDivElement>(null); 
 
 const { 
   filters, 
   filteredServices, 
   bookmarkedIds, 
   isOfferModalOpen, 
   isFilterDrawerOpen, 
   activeDetails, 
   activeChat, 
   chatMessages, 
   locationLabel, 
   setFilters, 
   setIsOfferModalOpen, 
   setIsFilterDrawerOpen, 
   setActiveDetails, 
   setActiveChat, 
   onToggleBookmark, 
   onAddService, 
   onSendMessage, 
   getPriceLabel, 
 } = useServicesMarketplace(); 
 
 const { scrollYProgress } = useScroll({ 
   target: containerRef, 
   offset: ['start start', 'end start'], 
 }); 
 
 const heroY = useTransform(scrollYProgress, [0, 1], [0, 70]); 
 const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 
0.82]); 
 
 const handleReport = (service: ServiceItem) => { 
   window.alert(`Service report submitted for ${service.providerName}. 
Our team will review this.`); 
 }; 
 
 return ( 
   <div className={styles.page} ref={containerRef}> 
     <ServicesHero 
       locationLabel={locationLabel} 
       onOfferClick={() => setIsOfferModalOpen(true)} 
       y={heroY} 
       opacity={heroOpacity} 
     /> 
 
     <div className={styles.mobileTopBar}> 
       <motion.button 
         type="button" 
         className={styles.mobileFilterButton} 
         whileHover={{ y: -1 }} 
         whileTap={{ y: 1 }} 
         onClick={() => setIsFilterDrawerOpen(true)} 
       > 
         <Filter size={14} /> Filters 
       </motion.button> 
       <span className={styles.resultCount}>{filteredServices.length} 
services found</span> 
     </div> 
 
     <div className={styles.contentGrid}> 
       <aside className={styles.filterColumn}> 
         <div className={styles.stickyFilterWrap}> 
           <ServicesFilters filters={filters} 
onFilterChange={setFilters} /> 
         </div> 
       </aside> 
 
       <section className={styles.servicesColumn}> 
         <motion.div 
           className={styles.servicesGrid} 
           variants={cardContainerVariants} 
           initial="hidden" 
           animate="visible" 
         > 
           {filteredServices.map((service) => ( 
             <motion.div key={service.id} variants={cardItemVariants}> 
               <ServiceCard 
                 service={service} 
                 isBookmarked={bookmarkedIds.includes(service.id)} 
                 priceLabel={getPriceLabel(service)} 
                 onToggleBookmark={onToggleBookmark} 
                 onMessage={setActiveChat} 
                 onViewDetails={setActiveDetails} 
                 onReport={handleReport} 
               /> 
             </motion.div> 
           ))} 
         </motion.div> 
 
         <AnimatePresence> 
           {filteredServices.length === 0 && ( 
             <motion.div 
               className={styles.emptyState} 
               initial={{ opacity: 0, y: 16 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: 8 }} 
             > 
               <TriangleAlert size={20} /> 
               <h3>No services match these filters</h3> 
               <p>Try increasing distance or removing one filter.</p> 
             </motion.div> 
           )} 
         </AnimatePresence> 
       </section> 
     </div> 
 
     <motion.button 
       type="button" 
       className={styles.mobileOfferButton} 
       whileHover={{ y: -2 }} 
       whileTap={{ y: 1 }} 
       onClick={() => setIsOfferModalOpen(true)} 
     > 
       Offer Service 
     </motion.button> 
 
     <MobileFilterDrawer 
       isOpen={isFilterDrawerOpen} 
       filters={filters} 
       onFilterChange={setFilters} 
       onClose={() => setIsFilterDrawerOpen(false)} 
     /> 
 
     <OfferServiceModal 
       isOpen={isOfferModalOpen} 
       onClose={() => setIsOfferModalOpen(false)} 
       onSubmit={onAddService} 
     /> 
 
     <ServiceDetailsDrawer 
       service={activeDetails} 
       priceLabel={activeDetails ? getPriceLabel(activeDetails) : ''} 
       onClose={() => setActiveDetails(null)} 
       onContact={(service) => { 
         setActiveDetails(null); 
         setActiveChat(service); 
       }} 
     /> 
 
     <ServiceChatDrawer 
       service={activeChat} 
       messages={activeChat ? chatMessages[activeChat.id] || [] : []} 
       onSend={onSendMessage} 
       onClose={() => setActiveChat(null)} 
     /> 
   </div> 
 ); 
}; 
 