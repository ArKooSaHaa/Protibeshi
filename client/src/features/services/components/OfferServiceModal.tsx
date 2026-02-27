 
// src/features/services/components/OfferServiceModal.tsx 
import { useMemo, useState } from 'react'; 
import { AnimatePresence, motion } from 'framer-motion'; 
import { X } from 'lucide-react'; 
import { availabilityOptions, serviceCategories } from 
'../mock/servicesData'; 
import { OfferServiceFormValues } from '../types/service.types'; 
import styles from './OfferServiceModal.module.css'; 
 
interface OfferServiceModalProps { 
 isOpen: boolean; 
 onClose: () => void; 
 onSubmit: (values: OfferServiceFormValues) => void; 
} 
 
const initialForm: OfferServiceFormValues = { 
 serviceTitle: '', 
 category: 'Other', 
 shortDescription: '', 
 fullDescription: '', 
 price: '', 
 priceUnit: 'hour', 
 availability: 'Flexible', 
 experience: '', 
 serviceRadius: 350, 
 location: 'Motijheel', 
 verified: false, 
 photo: '', 
 portfolioImages: '', 
 certifications: '', 
 workingHours: '', 
}; 
 
export const OfferServiceModal = ({ isOpen, onClose, onSubmit }: 
OfferServiceModalProps) => { 
 const [form, setForm] = useState(initialForm); 
 const [submitted, setSubmitted] = useState(false); 
 
 const isValid = useMemo(() => { 
   if (!form.serviceTitle.trim()) return false; 
   if (!form.shortDescription.trim()) return false; 
   if (!form.fullDescription.trim()) return false; 
   if (!form.price || Number(form.price) <= 0) return false; 
   if (!form.experience || Number(form.experience) < 0) return false; 
   if (!form.location.trim()) return false; 
   return true; 
 }, [form]); 
 
 const updateField = <K extends keyof OfferServiceFormValues>(key: K, 
value: OfferServiceFormValues[K]) => { 
   setForm((prev) => ({ ...prev, [key]: value })); 
 }; 
 
 const handleClose = () => { 
   setSubmitted(false); 
   onClose(); 
 }; 
 
 const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { 
   event.preventDefault(); 
   setSubmitted(true); 
   if (!isValid) { 
     return; 
   } 
 
   onSubmit(form); 
   setForm(initialForm); 
   setSubmitted(false); 
 }; 
 
 return ( 
   <AnimatePresence> 
     {isOpen && ( 
       <motion.div 
         className={styles.overlay} 
         initial={{ opacity: 0 }} 
         animate={{ opacity: 1 }} 
         exit={{ opacity: 0 }} 
         onClick={handleClose} 
       > 
         <motion.div 
           className={styles.modal} 
           initial={{ opacity: 0, scale: 0.96, y: 20 }} 
           animate={{ opacity: 1, scale: 1, y: 0 }} 
           exit={{ opacity: 0, scale: 0.98, y: 12 }} 
           transition={{ duration: 0.24, ease: 'easeOut' }} 
           onClick={(event) => event.stopPropagation()} 
         > 
           <div className={styles.header}> 
             <h3>Offer a Service</h3> 
             <button type="button" onClick={handleClose} 
className={styles.closeButton}> 
               <X size={18} /> 
             </button> 
           </div> 
 
           <form className={styles.form} onSubmit={handleSubmit}> 
             <div className={styles.grid}> 
               <label className={styles.field}> 
                 <span>Service Title*</span> 
                 <input 
                   value={form.serviceTitle} 
                   onChange={(event) => updateField('serviceTitle', 
event.target.value)} 
                   placeholder="e.g., Spoken English Coaching" 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Category*</span> 
                 <select 
                   value={form.category} 
                   onChange={(event) => updateField('category', 
event.target.value as OfferServiceFormValues['category'])} 
                 > 
                   {serviceCategories.map((category) => ( 
                     <option key={category} value={category}> 
                       {category} 
                     </option> 
                   ))} 
                 </select> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Short Description*</span> 
                 <input 
                   value={form.shortDescription} 
                   onChange={(event) => updateField('shortDescription', 
event.target.value)} 
                   placeholder="One line summary" 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Price*</span> 
                 <input 
                   type="number" 
                   min={1} 
                   value={form.price} 
                   onChange={(event) => updateField('price', 
event.target.value)} 
                   placeholder="Amount in ₹" 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Price Type*</span> 
                 <select 
                   value={form.priceUnit} 
                   onChange={(event) => updateField('priceUnit', 
event.target.value as OfferServiceFormValues['priceUnit'])} 
                 > 
                   <option value="hour">Per hour</option> 
                   <option value="session">Per session</option> 
                   <option value="fixed">Fixed</option> 
                 </select> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Availability*</span> 
                 <select 
                   value={form.availability} 
                   onChange={(event) => updateField('availability', 
event.target.value as OfferServiceFormValues['availability'])} 
                 > 
                   {availabilityOptions.map((availability) => ( 
                     <option key={availability} value={availability}> 
                       {availability} 
                     </option> 
                   ))} 
                 </select> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Experience (years)*</span> 
                 <input 
                   type="number" 
                   min={0} 
                   value={form.experience} 
                   onChange={(event) => updateField('experience', 
event.target.value)} 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Upload Photo URL*</span> 
                 <input 
                   value={form.photo} 
                   onChange={(event) => updateField('photo', 
event.target.value)} 
                   placeholder="https://..." 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Service Radius ({form.serviceRadius}m)</span> 
                 <input 
                   type="range" 
                   min={50} 
                   max={2000} 
                   step={50} 
                   value={form.serviceRadius} 
                   onChange={(event) => updateField('serviceRadius', 
Number(event.target.value))} 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Location (auto-filled)</span> 
                 <input 
                   value={form.location} 
                   onChange={(event) => updateField('location', 
event.target.value)} 
                 /> 
               </label> 
 
               <label className={styles.fieldFull}> 
                 <span>Full Description*</span> 
                 <textarea 
                   rows={4} 
                   value={form.fullDescription} 
                   onChange={(event) => updateField('fullDescription', 
event.target.value)} 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Portfolio Images (comma-separated URLs)</span> 
                 <input 
                   value={form.portfolioImages} 
                   onChange={(event) => updateField('portfolioImages', 
event.target.value)} 
                 /> 
               </label> 
 
               <label className={styles.field}> 
                 <span>Certifications (comma-separated)</span> 
                 <input 
                   value={form.certifications} 
                   onChange={(event) => updateField('certifications', 
event.target.value)} 
                 /> 
               </label> 
 
               <label className={styles.fieldFull}> 
                 <span>Working Hours (comma-separated)</span> 
                 <input 
                   value={form.workingHours} 
                   onChange={(event) => updateField('workingHours', 
event.target.value)} 
                   placeholder="Mon-Fri: 5pm-9pm, Sat: 10am-1pm" 
                 /> 
               </label> 
 
               <label className={styles.checkbox}> 
                 <input 
                   type="checkbox" 
                   checked={form.verified} 
                   onChange={(event) => updateField('verified', 
event.target.checked)} 
                 /> 
                 <span>Mark as verified provider (if eligible)</span> 
               </label> 
             </div> 
 
             {submitted && !isValid && <p 
className={styles.errorText}>Please complete required fields.</p>} 
 
             <div className={styles.actions}> 
               <motion.button 
                 type="button" 
                 className={styles.cancelButton} 
                 whileHover={{ y: -1 }} 
                 whileTap={{ y: 1 }} 
                 onClick={handleClose} 
               > 
                 Cancel 
               </motion.button> 
               <motion.button 
                 type="submit" 
                 className={styles.submitButton} 
                 whileHover={{ y: -1 }} 
                 whileTap={{ y: 1 }} 
               > 
                 Submit Service 
               </motion.button> 
             </div> 
           </form> 
         </motion.div> 
       </motion.div> 
     )} 
   </AnimatePresence> 
 ); 
}; 