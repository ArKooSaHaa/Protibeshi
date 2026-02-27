// src/features/relief/components/ReliefRequestForm.tsx 
import { HandHeart } from 'lucide-react'; 
import { 
 reliefContactPreferences, 
 reliefHelpTypes, 
 reliefTimeSensitivities, 
 reliefUrgencyLevels, 
 reliefVisibilityOptions, 
 type ReliefFormErrors, 
 type ReliefRequestFormState, 
 type ReliefUrgency, 
} from '../types/relief.types'; 
import styles from './ReliefForm.module.css'; 
 
interface ReliefRequestFormProps { 
 form: ReliefRequestFormState; 
 errors: ReliefFormErrors<ReliefRequestFormState>; 
 onChange: <K extends keyof ReliefRequestFormState>(key: K, value: 
ReliefRequestFormState[K]) => void; 
 onSubmit: () => void; 
} 
 
const urgencyColors: Record<ReliefUrgency, string> = { 
 Normal: '', 
 Important: styles.selectedAmber, 
 Urgent: styles.selectedOrange, 
 Critical: styles.selectedRed, 
}; 
 
export const ReliefRequestForm = ({ 
 form, 
 errors, 
 onChange, 
 onSubmit, 
}: ReliefRequestFormProps) => { 
 return ( 
   <div className={styles.form}> 
     <div className={styles.formHeader}> 
       <h2 className={styles.formTitle}> 
         <HandHeart size={18} style={{ color: '#dc2626' }} /> 
         Request Help 
       </h2> 
       <p className={styles.formSubtitle}> 
         Describe your situation clearly so neighbors can help 
effectively. 
       </p> 
     </div> 
 
     {/* Title */} 
     <div className={styles.field}> 
       <label className={styles.label}>Short summary *</label> 
       <input 
         className={`${styles.input} ${errors.title ? styles.error : 
''}`} 
         placeholder="e.g. Need baby formula urgently" 
         value={form.title} 
         onChange={(e) => onChange('title', e.target.value)} 
       /> 
       {errors.title && <span 
className={styles.errorMsg}>{errors.title}</span>} 
     </div> 
 
     {/* Help Type */} 
     <div className={styles.field}> 
       <label className={styles.label}>Type of help needed *</label> 
       <div className={styles.chipGroup}> 
         {reliefHelpTypes.map((t) => ( 
           <button 
             key={t} 
             type="button" 
             className={`${styles.chip} ${form.helpType === t ? 
styles.selected : ''}`} 
             onClick={() => onChange('helpType', t)} 
           > 
             {t} 
           </button> 
         ))} 
       </div> 
       {errors.helpType && <span 
className={styles.errorMsg}>{errors.helpType}</span>} 
     </div> 
 
     {/* Description */} 
     <div className={styles.field}> 
       <label className={styles.label}>Description *</label> 
       <textarea 
         className={`${styles.textarea} ${errors.description ? 
styles.error : ''}`} 
         placeholder="Describe your situation in detail. Be specific 
about what you need and why." 
         value={form.description} 
         onChange={(e) => onChange('description', e.target.value)} 
         rows={4} 
       /> 
       {errors.description && <span 
className={styles.errorMsg}>{errors.description}</span>} 
     </div> 
 
     {/* Urgency */} 
     <div className={styles.field}> 
       <label className={styles.label}>Urgency level *</label> 
       <div className={styles.chipGroup}> 
         {reliefUrgencyLevels.map((u) => { 
           const isSelected = form.urgency === u; 
           const colorClass = isSelected ? (urgencyColors[u] || 
styles.selected) : ''; 
           return ( 
             <button 
               key={u} 
               type="button" 
               className={`${styles.chip} ${colorClass}`} 
               onClick={() => onChange('urgency', u)} 
             > 
               {u} 
             </button> 
           ); 
         })} 
       </div> 
       {errors.urgency && <span 
className={styles.errorMsg}>{errors.urgency}</span>} 
     </div> 
 
     {/* Row: Time Sensitivity + Visibility */} 
     <div className={styles.row}> 
       <div className={styles.field}> 
         <label className={styles.label}>Time sensitivity</label> 
         <select 
           className={styles.select} 
           value={form.timeSensitivity} 
           onChange={(e) => onChange('timeSensitivity', e.target.value 
as ReliefRequestFormState['timeSensitivity'])} 
         > 
           {reliefTimeSensitivities.map((t) => ( 
             <option key={t} value={t}>{t}</option> 
           ))} 
         </select> 
       </div> 
       <div className={styles.field}> 
         <label className={styles.label}>Visibility</label> 
         <select 
           className={styles.select} 
           value={form.visibility} 
           onChange={(e) => onChange('visibility', e.target.value as 
ReliefRequestFormState['visibility'])} 
         > 
           {reliefVisibilityOptions.map((v) => ( 
             <option key={v} value={v}>{v}</option> 
           ))} 
         </select> 
       </div> 
     </div> 
 
     {/* Contact Preference */} 
     <div className={styles.field}> 
       <label className={styles.label}>Contact preference</label> 
       <div className={styles.chipGroup}> 
         {reliefContactPreferences.map((c) => ( 
           <button 
             key={c} 
             type="button" 
             className={`${styles.chip} ${form.contactPreference === c 
? styles.selected : ''}`} 
             onClick={() => onChange('contactPreference', c)} 
           > 
             {c} 
           </button> 
         ))} 
       </div> 
     </div> 
 
     {/* Location */} 
     <div className={styles.field}> 
       <label className={styles.label}>Location (auto-detected)</label> 
       <input 
         className={styles.input} 
         value={form.location} 
         onChange={(e) => onChange('location', e.target.value)} 
         placeholder="Your location" 
       /> 
     </div> 
 
     <button 
       type="button" 
       className={`${styles.submitBtn} ${styles.submitBtnRed}`} 
       onClick={onSubmit} 
     > 
       Post Relief Request 
     </button> 
   </div> 
 ); 
};