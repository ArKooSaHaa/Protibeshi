 
// src/features/complaints/components/ComplaintFilters.tsx 
import { motion } from 'framer-motion'; 
import { Filter } from 'lucide-react'; import { 
 complaintCategories, 
 complaintPriorities, 
 complaintStatuses, 
 complaintTimeRanges, 
 ComplaintFilterState, 
} from '../types/complaint.types'; 
import styles from './ComplaintFilters.module.css'; 
 
interface ComplaintFiltersProps { 
 filters: ComplaintFilterState; 
 onChange: (next: ComplaintFilterState) => void; 
} 
 export const ComplaintFilters = ({ filters, onChange }: 
ComplaintFiltersProps) => { 
 const toggleValue = <T extends string>(key: keyof 
ComplaintFilterState, value: T) => { 
   const list = filters[key] as T[]; 
   const next = list.includes(value) ? list.filter((item) => item !== 
value) : [...list, value]; 
   onChange({ ...filters, [key]: next }); 
 }; 
 
 return ( 
   <motion.section 
     className={styles.filterCard} 
     initial={{ opacity: 0, x: -12 }}      animate={{ opacity: 1, x: 0 }} 
     transition={{ duration: 0.3, ease: 'easeOut' }} 
   > 
     <div className={styles.header}> 
       <Filter size={16} /> 
       <h3>Filters</h3> 
     </div> 
 
     <div className={styles.group}> 
       <div className={styles.label}>Distance</div> 
       <input 

         type="range" 
         min={50} 
         max={2000} 
         step={50} 
         value={filters.distance} 
         className={styles.slider} 
         onChange={(event) => onChange({ ...filters, distance: 
Number(event.target.value) })} 
       /> 
       <span className={styles.helper}>{filters.distance}m</span> 
     </div> 
 
     <div className={styles.group}> 
       <div className={styles.label}>Category</div> 
       <div className={styles.checkboxGrid}> 
         {complaintCategories.map((category) => ( 
           <label key={category} className={styles.checkboxLabel}> 
             <input 
               type="checkbox" 
               checked={filters.categories.includes(category)} 
               onChange={() => toggleValue('categories', category)} 
             /> 
             {category} 
           </label> 
         ))} 
       </div> 
     </div> 
 
     <div className={styles.group}> 
       <div className={styles.label}>Status</div> 
       <div className={styles.checkboxGrid}> 
         {complaintStatuses.map((status) => ( 
           <label key={status} className={styles.checkboxLabel}> 
             <input 
               type="checkbox" 
               checked={filters.statuses.includes(status)} 
               onChange={() => toggleValue('statuses', status)} 
             /> 
             {status} 
           </label> 
         ))} 
       </div> 
     </div> 

 
     <div className={styles.group}> 
       <div className={styles.label}>Priority</div> 
       <div className={styles.checkboxGrid}> 
         {complaintPriorities.map((priority) => ( 
           <label key={priority} className={styles.checkboxLabel}> 
             <input 
               type="checkbox" 
               checked={filters.priorities.includes(priority)} 
               onChange={() => toggleValue('priorities', priority)} 
             /> 
             {priority} 
           </label> 
         ))} 
       </div> 
     </div> 
 
     <div className={styles.group}> 
       <div className={styles.label}>Time range</div> 
       <select 
         className={styles.select} 
         value={filters.timeRange} 
         onChange={(event) => onChange({ ...filters, timeRange: 
event.target.value as ComplaintFilterState['timeRange'] })} 
       > 
         {complaintTimeRanges.map((range) => ( 
           <option key={range} value={range}> 
             {range} 
           </option> 
         ))} 
       </select> 
     </div> 
 
     <label className={styles.toggle}> 
       <input 
         type="checkbox" 
         checked={filters.myComplaints} 
         onChange={() => onChange({ ...filters, myComplaints: 
!filters.myComplaints })} 
       /> 
       My complaints only 
     </label> 
   </motion.section> 

 ); 
}; 
