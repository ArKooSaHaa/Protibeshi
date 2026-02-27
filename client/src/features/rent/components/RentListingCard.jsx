// src/features/rent/components/RentListingCard.jsx 
import React, { useState } from 'react'; 
import { motion } from 'framer-motion'; 
import { MapPin, Bed, Bath, Ruler, Heart, MessageCircle, Shield, Eye, 
Clock } from 'lucide-react'; 
import styles from './RentListingCard.module.css'; 
 
const RentListingCard = ({ listing }) => { 
 const [isSaved, setIsSaved] = useState(false); 
 
 const getBadgeLabel = (badge) => { 
   const badgeMap = { 
     verified: { label: 'Verified', color: 'verified' }, 
     owner: { label: 'Owner', color: 'owner' }, 
     agent: { label: 'Agent', color: 'agent' }, 
   }; 
   return badgeMap[badge] || null; 
 }; 
 
 const badgeInfo = getBadgeLabel(listing.badge); 
 
 return ( 
   <motion.div 
     className={styles.card} 
     whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(15, 23, 42, 
0.12)' }} 
     transition={{ duration: 0.2 }} 
   > 
     {/* Image Section */} 
     <div className={styles.imageContainer}> 
       <motion.img 
         src={listing.image} 
         alt={listing.title} 
         className={styles.image} 
         whileHover={{ scale: 1.05 }} 
         transition={{ duration: 0.3 }} 
       /> 
 
       {/* Gradient Overlay */} 
       <div className={styles.overlay} /> 
 
       {/* Badge */} 
       {badgeInfo && ( 
         <div className={`${styles.badgeTop} 
${styles[`badge${badgeInfo.color}`]}`}> 
           {badgeInfo.color === 'verified' && <Shield size={14} />} 
           {badgeInfo.label} 
         </div> 
       )} 
 
       {/* Save Button */} 
       <motion.button 
         className={`${styles.saveButton} ${isSaved ? styles.saved : 
''}`} 
         onClick={() => setIsSaved(!isSaved)} 
         whileHover={{ y: -2, scale: 1.08 }} 
         whileTap={{ y: 1, scale: 0.96 }} 
         type="button" 
       > 
         <Heart size={18} /> 
       </motion.button> 
     </div> 
 
     {/* Content Section */} 
     <div className={styles.content}> 
       {/* Price */} 
       <div className={styles.priceSection}> 
         <h3 
className={styles.price}>₹{listing.price.toLocaleString()}</h3> 
         <p className={styles.deposit}>+ 
₹{listing.deposit.toLocaleString()} deposit</p> 
       </div> 
 
       {/* Title */} 
       <h2 className={styles.title}>{listing.title}</h2> 
 
       {/* Key Info Row */} 
       <div className={styles.keyInfo}> 
         {listing.beds > 0 && ( 
           <div className={styles.infoItem}> 
             <Bed size={16} /> 
             <span>{listing.beds} Bed{listing.beds > 1 ? 's' : 
''}</span> 
           </div> 
         )} 
         {listing.baths > 0 && ( 
           <div className={styles.infoItem}> 
             <Bath size={16} /> 
             <span>{listing.baths} Bath</span> 
           </div> 
         )} 
         {listing.sqft && ( 
           <div className={styles.infoItem}> 
             <Ruler size={16} /> 
             <span>{listing.sqft} sq ft</span> 
           </div> 
         )} 
         <div className={styles.infoItem}> 
           <MapPin size={16} /> 
           <span>{listing.distance}m away</span> 
         </div> 
       </div> 
 
       {/* Availability Tag */} 
       <div className={styles.availabilityTag}> 
         {listing.availability === 'now' && ( 
           <> 
             <span className={styles.tag}>Available now</span> 
           </> 
         )} 
         {listing.availability === 'flexible' && ( 
           <> 
             <span className={styles.tags}>Flexible dates</span> 
           </> 
         )} 
         {listing.availability === 'dated' && ( 
           <> 
             <span className={styles.tag}>Available from 
{listing.availabilityDate}</span> 
           </> 
         )} 
       </div> 
 
       {/* Trust Signals */} 
       <div className={styles.trustSignals}> 
         {listing.verified && ( 
           <motion.div className={styles.trustItem} whileHover={{ 
scale: 1.05 }}> 
             <Shield size={14} /> 
             <span>Verified landlord</span> 
           </motion.div> 
         )} 
         <motion.div className={styles.trustItem} whileHover={{ scale: 
1.05 }}> 
           <Eye size={14} /> 
           <span>{listing.views} views</span> 
         </motion.div> 
         <motion.div className={styles.trustItem} whileHover={{ scale: 
1.05 }}> 
           <Clock size={14} /> 
           <span>{listing.listedDays === 0 ? 'Today' : 
listing.listedDays + ' days ago'}</span> 
         </motion.div> 
       </div> 
 
       {/* Action Buttons */} 
       <div className={styles.actions}> 
         <motion.button 
           className={styles.primaryButton} 
           whileHover={{ y: -2, scale: 1.02 }} 
           whileTap={{ y: 1, scale: 0.98 }} 
           type="button" 
         > 
           View Details 
         </motion.button> 
         <motion.button 
           className={styles.secondaryButton} 
           whileHover={{ y: -2, scale: 1.02 }} 
           whileTap={{ y: 1, scale: 0.98 }} 
           type="button" 
         > 
           <MessageCircle size={16} /> 
           Message 
         </motion.button> 
       </div> 
     </div> 
   </motion.div> 
 ); 
}; 
 
export default RentListingCard; 
