// src/features/relief/components/ReliefRequestCard.tsx 
import { motion } from 'framer-motion'; 
import { CheckCircle2, Clock, MapPin, Users } from 'lucide-react'; 
import type { ReliefRequest } from '../types/relief.types'; 
import { 
 formatDistance, 
 formatRelativeTime, 
 statusConfig, 
 urgencyConfig, 
} from '../utils/relief.utils'; 
import styles from './ReliefRequestCard.module.css'; 
 
interface ReliefRequestCardProps { 
 request: ReliefRequest; 
 onViewDetails: (r: ReliefRequest) => void; 
 onVolunteer: (r: ReliefRequest) => void; 
} 
 
export const ReliefRequestCard = ({ 
 request, 
 onViewDetails, 
 onVolunteer, 
}: ReliefRequestCardProps) => { 
 const urg = urgencyConfig[request.urgency]; 
 const stat = statusConfig[request.status]; 
 
 const urgentClass = 
   request.urgency === 'Critical' 
     ? styles.critical 
     : request.urgency === 'Urgent' 
       ? styles.urgent 
       : ''; 
 
 return ( 
   <motion.div 
     className={`${styles.card} ${urgentClass}`} 
     layout 
     initial={{ opacity: 0, y: 8 }} 
     animate={{ opacity: 1, y: 0 }} 
     exit={{ opacity: 0, y: -4 }} 
     transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }} 
   > 
     {/* Header */} 
     <div className={styles.cardHeader}> 
       <div className={styles.titleRow}> 
         <div className={styles.badges}> 
           <span 
className={styles.helpTypeBadge}>{request.helpType}</span> 
           <span className={`${styles.urgBadge} 
${styles[urg.colorClass]}`}> 
             <span className={`${styles.dot} ${styles[urg.dotClass]}`} 
/> 
             {urg.label} 
           </span> 
         </div> 
         <h3 className={styles.title}>{request.title}</h3> 
       </div> 
       <span className={`${styles.statusBadge} 
${styles[stat.colorClass]}`}> 
         {stat.label} 
       </span> 
     </div> 
 
     {/* Meta */} 
     <div className={styles.meta}> 
       <span className={styles.metaItem}> 
         <MapPin size={11} /> 
         {formatDistance(request.distance)} 
       </span> 
       <span className={styles.metaItem}> 
         <Clock size={11} /> 
         {formatRelativeTime(request.createdAt)} 
       </span> 
       {request.verified && ( 
         <span className={styles.verifiedBadge}> 
           <CheckCircle2 size={11} /> 
           Verified 
         </span> 
       )} 
     </div> 
 
     {/* Description preview */} 
     <p className={styles.description}>{request.description}</p> 
 
     {/* Footer */} 
     <div className={styles.footer}> 
       <div className={styles.poster}> 
         <div className={styles.avatar}>{request.avatarInitials}</div> 
         <span>{request.anonymous ? 'Anonymous' : 
request.postedBy}</span> 
       </div> 
 
       <div className={styles.actions}> 
         <span className={styles.volunteerInfo}> 
           <Users size={12} /> 
           {request.volunteerCount} helping 
         </span> 
         {request.status === 'Open' || request.status === 'Volunteers 
Assigned' ? ( 
           <motion.button 
             className={styles.btnVolunteer} 
             onClick={() => onVolunteer(request)} 
             whileHover={{ scale: 1.03 }} 
             whileTap={{ scale: 0.97 }} 
             type="button" 
           > 
             Offer Help 
           </motion.button> 
         ) : null} 
         <motion.button 
           className={styles.btnDetails} 
           onClick={() => onViewDetails(request)} 
           whileHover={{ scale: 1.02 }} 
           whileTap={{ scale: 0.97 }} 
           type="button" 
         > 
           View Details 
         </motion.button> 
       </div> 
     </div> 
   </motion.div> 
 ); 
}; 
 
