// src/features/rent/components/RentFilters.jsx 
import React, { useState } from 'react'; 
import { motion } from 'framer-motion'; 
import { ChevronDown } from 'lucide-react'; 
import styles from './RentFilters.module.css'; 
 
const RentFilters = ({ filters, onFilterChange }) => { 
 const [expandedSection, setExpandedSection] = useState('radius'); 
 
 const handleRadiusChange = (value) => { 
   onFilterChange({ ...filters, radius: value }); 
 }; 
 
 const handlePriceChange = (key, value) => { 
   const fallback = key === 'minPrice' ? 0 : 100000; 
   const parsed = value === '' ? fallback : parseInt(value, 10); 
   onFilterChange({ 
     ...filters, 
     [key]: Number.isNaN(parsed) ? fallback : parsed, 
   }); 
 }; 
 
 const handleMultiSelect = (key, value) => { 
   const current = filters[key] || []; 
   const updated = current.includes(value) 
     ? current.filter((item) => item !== value) 
     : [...current, value]; 
   onFilterChange({ ...filters, [key]: updated }); 
 }; 
 
 const handleSort = (value) => { 
   onFilterChange({ ...filters, sort: value }); 
 }; 
 
 const handleVerifiedToggle = () => { 
   onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly }); 
 }; 
 
 const toggleQuickFilter = (key) => { 
   if (key === 'under15k') { 
     const isActive = filters.maxPrice <= 15000; 
     onFilterChange({ 
       ...filters, 
       maxPrice: isActive ? 50000 : 15000, 
     }); 
     return; 
   } 
 
   if (key === 'furnished') { 
     const updated = handleQuickMultiSelect(filters.furnishing, 
'fully-furnished'); 
     onFilterChange({ ...filters, furnishing: updated }); 
     return; 
   } 
 
   if (key === 'near-metro') { 
     const isActive = filters.radius <= 800; 
     onFilterChange({ 
       ...filters, 
       radius: isActive ? 1000 : 800, 
     }); 
     return; 
   } 
 
   if (key === 'family-friendly') { 
     const updated = handleQuickMultiSelect(filters.bedrooms, ['2bhk', 
'3bhk']); 
     onFilterChange({ ...filters, bedrooms: updated }); 
   } 
 }; 
 
 const handleQuickMultiSelect = (currentList, value) => { 
   const values = Array.isArray(value) ? value : [value]; 
   const hasAll = values.every((item) => currentList.includes(item)); 
   if (hasAll) { 
     return currentList.filter((item) => !values.includes(item)); 
   } 
 
   const next = [...currentList]; 
   values.forEach((item) => { 
     if (!next.includes(item)) { 
       next.push(item); 
     } 
   }); 
   return next; 
 }; 
 
 const toggleSection = (section) => { 
   setExpandedSection(expandedSection === section ? null : section); 
 }; 
 
 return ( 
   <motion.div 
     className={styles.filtersCard} 
     initial={{ opacity: 0, y: 10 }} 
     animate={{ opacity: 1, y: 0 }} 
     transition={{ duration: 0.3 }} 
   > 
     <div className={styles.quickFilters}> 
       <div className={styles.quickFiltersLabel}>Quick Filters</div> 
       <div className={styles.quickFiltersGrid}> 
         <motion.button 
           type="button" 
           className={`${styles.quickFilterChip} ${ 
             filters.maxPrice <= 15000 ? styles.quickFilterChipActive : 
'' 
           }`} 
           onClick={() => toggleQuickFilter('under15k')} 
           whileHover={{ y: -2, scale: 1.02 }} 
           whileTap={{ y: 1, scale: 0.98 }} 
         > 
           Under 15k 
         </motion.button> 
         <motion.button 
           type="button" 
           className={`${styles.quickFilterChip} ${ 
             filters.furnishing.includes('fully-furnished') ? 
styles.quickFilterChipActive : '' 
           }`} 
           onClick={() => toggleQuickFilter('furnished')} 
           whileHover={{ y: -2, scale: 1.02 }} 
           whileTap={{ y: 1, scale: 0.98 }} 
         > 
           Furnished 
         </motion.button> 
         <motion.button 
           type="button" 
           className={`${styles.quickFilterChip} ${ 
             filters.radius <= 800 ? styles.quickFilterChipActive : '' 
           }`} 
           onClick={() => toggleQuickFilter('near-metro')} 
           whileHover={{ y: -2, scale: 1.02 }} 
           whileTap={{ y: 1, scale: 0.98 }} 
         > 
           Near metro 
         </motion.button> 
         <motion.button 
           type="button" 
           className={`${styles.quickFilterChip} ${ 
             filters.bedrooms.includes('2bhk') || 
filters.bedrooms.includes('3bhk') 
               ? styles.quickFilterChipActive 
               : '' 
           }`} 
           onClick={() => toggleQuickFilter('family-friendly')} 
           whileHover={{ y: -2, scale: 1.02 }} 
           whileTap={{ y: 1, scale: 0.98 }} 
         > 
           Family-friendly 
         </motion.button> 
       </div> 
     </div> 
 
     <div className={styles.filtersBody}> 
 
     {/* Location Radius */} 
     <div className={styles.filterSection}> 
       <motion.button 
         className={styles.sectionHeader} 
         onClick={() => toggleSection('radius')} 
         type="button" 
         whileHover={{ y: -1 }} 
         whileTap={{ y: 1 }} 
       > 
         <span>Location Radius</span> 
         <motion.div 
           animate={{ rotate: expandedSection === 'radius' ? 180 : 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           <ChevronDown size={18} /> 
         </motion.div> 
       </motion.button> 
       {expandedSection === 'radius' && ( 
         <motion.div 
           className={styles.sectionContent} 
           initial={{ opacity: 0, height: 0 }} 
           animate={{ opacity: 1, height: 'auto' }} 
           exit={{ opacity: 0, height: 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           <input 
             type="range" 
             min="100" 
             max="5000" 
             step="100" 
             value={filters.radius} 
             onChange={(e) => 
handleRadiusChange(parseInt(e.target.value))} 
             className={styles.slider} 
           /> 
           <div className={styles.sliderLabel}> 
             {(filters.radius / 1000).toFixed(1)} km 
           </div> 
         </motion.div> 
       )} 
     </div> 
 
     {/* Price Range */} 
     <div className={styles.filterSection}> 
       <motion.button 
         className={styles.sectionHeader} 
         onClick={() => toggleSection('price')} 
         type="button" 
         whileHover={{ y: -1 }} 
         whileTap={{ y: 1 }} 
       > 
         <span>Price Range</span> 
         <motion.div 
           animate={{ rotate: expandedSection === 'price' ? 180 : 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           <ChevronDown size={18} /> 
         </motion.div> 
       </motion.button> 
       {expandedSection === 'price' && ( 
         <motion.div 
           className={styles.sectionContent} 
           initial={{ opacity: 0, height: 0 }} 
           animate={{ opacity: 1, height: 'auto' }} 
           exit={{ opacity: 0, height: 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           <div className={styles.priceInputs}> 
             <input 
               type="number" 
               min="0" 
               step="500" 
               inputMode="numeric" 
               placeholder="Min" 
               value={filters.minPrice} 
               onChange={(e) => handlePriceChange('minPrice', 
e.target.value)} 
               className={styles.priceInput} 
             /> 
             <span className={styles.priceSeparator}>—</span> 
             <input 
               type="number" 
               min="0" 
               step="500" 
               inputMode="numeric" 
               placeholder="Max" 
               value={filters.maxPrice} 
               onChange={(e) => handlePriceChange('maxPrice', 
e.target.value)} 
               className={styles.priceInput} 
             /> 
           </div> 
           <div className={styles.currencyLabel}>৳ per month</div> 
         </motion.div> 
       )} 
     </div> 
 
     {/* Property Type */} 
     <div className={styles.filterSection}> 
       <motion.button 
         className={styles.sectionHeader} 
         onClick={() => toggleSection('type')} 
         type="button" 
         whileHover={{ y: -1 }} 
         whileTap={{ y: 1 }} 
       > 
         <span>Property Type</span> 
         <motion.div 
           animate={{ rotate: expandedSection === 'type' ? 180 : 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           <ChevronDown size={18} /> 
         </motion.div> 
       </motion.button> 
       {expandedSection === 'type' && ( 
         <motion.div 
           className={styles.sectionContent} 
           initial={{ opacity: 0, height: 0 }} 
           animate={{ opacity: 1, height: 'auto' }} 
           exit={{ opacity: 0, height: 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           {['apartment', 'sublet', 'room', 'studio', 
'shared'].map((type) => ( 
             <label key={type} className={styles.checkbox}> 
               <input 
                 type="checkbox" 
                 checked={filters.propertyTypes.includes(type)} 
                 onChange={() => handleMultiSelect('propertyTypes', 
type)} 
               /> 
               <span>{type.charAt(0).toUpperCase() + 
type.slice(1)}</span> 
             </label> 
           ))} 
         </motion.div> 
       )} 
     </div> 
 
     {/* Bedrooms */} 
     <div className={styles.filterSection}> 
       <motion.button 
         className={styles.sectionHeader} 
         onClick={() => toggleSection('beds')} 
         type="button" 
         whileHover={{ y: -1 }} 
         whileTap={{ y: 1 }} 
       > 
         <span>Bedrooms</span> 
         <motion.div 
           animate={{ rotate: expandedSection === 'beds' ? 180 : 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           <ChevronDown size={18} /> 
         </motion.div> 
       </motion.button> 
       {expandedSection === 'beds' && ( 
         <motion.div 
           className={styles.sectionContent} 
           initial={{ opacity: 0, height: 0 }} 
           animate={{ opacity: 1, height: 'auto' }} 
           exit={{ opacity: 0, height: 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           {[ 
             { value: 'studio', label: 'Studio' }, 
             { value: '1bhk', label: '1 BHK' }, 
             { value: '2bhk', label: '2 BHK' }, 
             { value: '3bhk', label: '3+ BHK' }, 
           ].map(({ value, label }) => ( 
             <label key={value} className={styles.checkbox}> 
               <input 
                 type="checkbox" 
                 checked={filters.bedrooms.includes(value)} 
                 onChange={() => handleMultiSelect('bedrooms', value)} 
               /> 
               <span>{label}</span> 
             </label> 
           ))} 
         </motion.div> 
       )} 
     </div> 
 
     {/* Furnishing */} 
     <div className={styles.filterSection}> 
       <motion.button 
         className={styles.sectionHeader} 
         onClick={() => toggleSection('furnish')} 
         type="button" 
         whileHover={{ y: -1 }} 
         whileTap={{ y: 1 }} 
       > 
         <span>Furnishing</span> 
         <motion.div 
           animate={{ rotate: expandedSection === 'furnish' ? 180 : 0 
}} 
           transition={{ duration: 0.2 }} 
         > 
           <ChevronDown size={18} /> 
         </motion.div> 
       </motion.button> 
       {expandedSection === 'furnish' && ( 
         <motion.div 
           className={styles.sectionContent} 
           initial={{ opacity: 0, height: 0 }} 
           animate={{ opacity: 1, height: 'auto' }} 
           exit={{ opacity: 0, height: 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           {[ 
             { value: 'fully-furnished', label: 'Fully furnished' }, 
             { value: 'semi-furnished', label: 'Semi-furnished' }, 
             { value: 'unfurnished', label: 'Unfurnished' }, 
           ].map(({ value, label }) => ( 
             <label key={value} className={styles.checkbox}> 
               <input 
                 type="checkbox" 
                 checked={filters.furnishing.includes(value)} 
                 onChange={() => handleMultiSelect('furnishing', 
value)} 
               /> 
               <span>{label}</span> 
             </label> 
           ))} 
         </motion.div> 
       )} 
     </div> 
 
     {/* Availability */} 
     <div className={styles.filterSection}> 
       <motion.button 
         className={styles.sectionHeader} 
         onClick={() => toggleSection('avail')} 
         type="button" 
         whileHover={{ y: -1 }} 
         whileTap={{ y: 1 }} 
       > 
         <span>Availability</span> 
         <motion.div 
           animate={{ rotate: expandedSection === 'avail' ? 180 : 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           <ChevronDown size={18} /> 
         </motion.div> 
       </motion.button> 
       {expandedSection === 'avail' && ( 
         <motion.div 
           className={styles.sectionContent} 
           initial={{ opacity: 0, height: 0 }} 
           animate={{ opacity: 1, height: 'auto' }} 
           exit={{ opacity: 0, height: 0 }} 
           transition={{ duration: 0.2 }} 
         > 
           {[ 
             { value: 'now', label: 'Available now' }, 
             { value: 'flexible', label: 'Flexible' }, 
             { value: 'dated', label: 'From specific date' }, 
           ].map(({ value, label }) => ( 
             <label key={value} className={styles.checkbox}> 
               <input 
                 type="checkbox" 
                 checked={filters.availability.includes(value)} 
                 onChange={() => handleMultiSelect('availability', 
value)} 
               /> 
               <span>{label}</span> 
             </label> 
           ))} 
         </motion.div> 
       )} 
     </div> 
 
     {/* Verified Only Toggle */} 
     <div className={styles.filterSection}> 
       <label className={styles.toggleLabel}> 
         <input 
           type="checkbox" 
           checked={filters.verifiedOnly} 
           onChange={handleVerifiedToggle} 
           className={styles.toggleInput} 
         /> 
         <span className={styles.toggleText}>Verified landlords 
only</span> 
       </label> 
     </div> 
 
     {/* Sort Options */} 
     <div className={styles.filterSection}> 
       <label className={styles.label}>Sort by</label> 
       <select 
         value={filters.sort} 
         onChange={(e) => handleSort(e.target.value)} 
         className={styles.select} 
       > 
         <option value="nearest">Nearest</option> 
         <option value="price-low">Price: Low to High</option> 
         <option value="price-high">Price: High to Low</option> 
         <option value="recent">Most Recent</option> 
         <option value="popular">Most Viewed</option> 
       </select> 
     </div> 
     </div> 
   </motion.div> 
 ); 
}; 
 
export default RentFilters; 