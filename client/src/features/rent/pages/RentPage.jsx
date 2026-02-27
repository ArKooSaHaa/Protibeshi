//  src/features/rent/pages/RentPage.jsx 
import React, { useEffect, useRef, useState } from 'react'; 
import { AnimatePresence, motion, useScroll, useTransform } from 
'framer-motion'; 
import RentFilters from '../components/RentFilters'; 
import RentListingCard from '../components/RentListingCard'; 
import AddPropertyModal from '../components/AddPropertyModal'; 
import { rentListings } from '../mock/rentData'; 
import styles from './RentPage.module.css'; 
 
export const RentPage = () => { 
 const containerRef = useRef(null); 
 const [allListings, setAllListings] = useState(rentListings); 
 const [filteredListings, setFilteredListings] = 
useState(rentListings); 
 const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false); 
 const [filters, setFilters] = useState({ 
   radius: 1000, 
   minPrice: 5000, 
   maxPrice: 50000, 
   propertyTypes: [], 
   bedrooms: [], 
   furnishing: [], 
   availability: [], 
   verifiedOnly: false, 
   sort: 'nearest', 
 }); 
 
 const { scrollYProgress } = useScroll({ 
   target: containerRef, 
   offset: ['start start', 'end start'], 
 }); 
 
 const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 
0.8]); 
 const headerY = useTransform(scrollYProgress, [0, 1], [0, 120]); 
 
 const handleFilterChange = (newFilters) => { 
   setFilters(newFilters); 
 }; 
 
 const applyFilters = (currentFilters, sourceListings = allListings) => 
{ 
   let results = [...sourceListings]; 
 
   // Filter by price 
   results = results.filter( 
     (item) => item.price >= currentFilters.minPrice && item.price <= 
currentFilters.maxPrice 
   ); 
 
   // Filter by distance 
   results = results.filter((item) => item.distance <= 
currentFilters.radius); 
 
   // Filter by property type 
   if (currentFilters.propertyTypes.length > 0) { 
     results = results.filter((item) => 
currentFilters.propertyTypes.includes(item.type)); 
   } 
 
   // Filter by bedrooms 
   if (currentFilters.bedrooms.length > 0) { 
     results = results.filter((item) => { 
       const beds = item.beds === 0 ? 'studio' : `${item.beds}bhk`; 
       return currentFilters.bedrooms.includes(beds); 
     }); 
   } 
 
   // Filter by furnishing 
   if (currentFilters.furnishing.length > 0) { 
     results = results.filter((item) => 
currentFilters.furnishing.includes(item.furnishing)); 
   } 
 
   // Filter by availability 
   if (currentFilters.availability.length > 0) { 
     results = results.filter((item) => 
currentFilters.availability.includes(item.availability)); 
   } 
 
   // Filter by verified only 
   if (currentFilters.verifiedOnly) { 
     results = results.filter((item) => item.verified); 
   } 
 
   // Apply sorting 
   results = results.sort((a, b) => { 
     switch (currentFilters.sort) { 
       case 'nearest': 
         return a.distance - b.distance; 
       case 'price-low': 
         return a.price - b.price; 
       case 'price-high': 
         return b.price - a.price; 
       case 'recent': 
         return a.listedDays - b.listedDays; 
       case 'popular': 
         return b.views - a.views; 
       default: 
         return a.distance - b.distance; 
     } 
   }); 
 
   setFilteredListings(results); 
 }; 
 
 useEffect(() => { 
   applyFilters(filters, allListings); 
 }, [filters, allListings]); 
 
 const handleAddProperty = (newProperty) => { 
   const nextId = allListings.length ? 
Math.max(...allListings.map((item) => item.id)) + 1 : 1; 
 
   setAllListings((prev) => [ 
     { 
       ...newProperty, 
       id: nextId, 
       views: 0, 
       listedDays: 0, 
     }, 
     ...prev, 
   ]); 
 
   setIsAddPropertyOpen(false); 
 }; 
 
 const containerVariants = { 
   hidden: { opacity: 0, y: 20 }, 
   visible: { 
     opacity: 1, 
     y: 0, 
     transition: { 
       duration: 0.5, 
       ease: 'easeOut', 
       staggerChildren: 0.1, 
     }, 
   }, 
 }; 
 
 const cardVariants = { 
   hidden: { opacity: 0, y: 20, scale: 0.95 }, 
   visible: { 
     opacity: 1, 
     y: 0, 
     scale: 1, 
     transition: { 
       duration: 0.3, 
       ease: 'easeOut', 
     }, 
   }, 
 }; 
 
 return ( 
   <div className={styles.rentPage} ref={containerRef}> 
     {/* Header */} 
     <motion.div className={styles.header} style={{ opacity: 
headerOpacity, y: headerY }}> 
       <div className={styles.headerMedia} aria-hidden="true"> 
         <video 
           className={styles.headerVideo} 
           src="/homeRent.mp4" 
           autoPlay 
           muted 
           loop 
           playsInline 
         /> 
         <div className={styles.headerOverlay} /> 
       </div> 
       <div className={styles.headerContent}> 
         <h1 className={styles.title}>Rent Home</h1> 
         <p className={styles.subtitle}>Verified rentals within walking 
distance</p> 
       </div> 
     </motion.div> 
 
     {/* Main Content Grid */} 
     <div className={styles.contentGrid}> 
       {/* Left Sidebar - Filters */} 
       <motion.aside 
         className={styles.filterSidebar} 
         initial={{ opacity: 0, x: -20 }} 
         animate={{ opacity: 1, x: 0 }} 
         transition={{ duration: 0.4, delay: 0.2 }} 
       > 
         <RentFilters filters={filters} 
onFilterChange={handleFilterChange} /> 
       </motion.aside> 
 
       {/* Center - Listings Grid */} 
       <motion.section 
         className={styles.listingsGrid} 
         variants={containerVariants} 
         initial="hidden" 
         animate="visible" 
       > 
         {filteredListings.length > 0 ? ( 
           filteredListings.map((listing) => ( 
             <motion.div key={listing.id} variants={cardVariants}> 
               <RentListingCard listing={listing} /> 
             </motion.div> 
           )) 
         ) : ( 
           <div className={styles.emptyState}> 
             <h3>No listings found</h3> 
             <p>Try adjusting your filters or widening your search 
radius</p> 
           </div> 
         )} 
       </motion.section> 
     </div> 
 
     <motion.button 
       type="button" 
       className={styles.addPropertyButton} 
       whileHover={{ y: -3, scale: 1.02 }} 
       whileTap={{ y: 1, scale: 0.98 }} 
       onClick={() => setIsAddPropertyOpen(true)} 
     > 
       + Add Property 
     </motion.button> 
 
     <AnimatePresence> 
       {isAddPropertyOpen && ( 
         <AddPropertyModal 
           onClose={() => setIsAddPropertyOpen(false)} 
           onSubmit={handleAddProperty} 
         /> 
       )} 
     </AnimatePresence> 
   </div> 
 ); 
}; 
 
export default RentPage; 