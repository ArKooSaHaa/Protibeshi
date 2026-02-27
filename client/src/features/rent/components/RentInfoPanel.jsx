// src/features/rent/components/RentInfoPanel.jsx 
import React from 'react'; 
import { motion } from 'framer-motion'; 
import { AlertCircle, TrendingDown, Send } from 'lucide-react'; 
import { safetyTips, priceData } from '../mock/rentData'; 
import styles from './RentInfoPanel.module.css'; 
 
const RentInfoPanel = () => { 
 return ( 
   <div className={styles.panel}> 
     {/* Safety Tips Card */} 
     <motion.div 
       className={styles.card} 
       initial={{ opacity: 0, y: 20 }} 
       animate={{ opacity: 1, y: 0 }} 
       transition={{ duration: 0.3, delay: 0.1 }} 
     > 
       <div className={styles.cardHeader}> 
         <AlertCircle size={18} className={styles.headerIcon} /> 
         <h3 className={styles.cardTitle}>Rental Safety</h3> 
       </div> 
 
       <ul className={styles.tipsList}> 
         {safetyTips.slice(0, 4).map((tip, index) => ( 
           <motion.li 
             key={index} 
             className={styles.tipItem} 
             initial={{ opacity: 0, x: -10 }} 
             animate={{ opacity: 1, x: 0 }} 
             transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }} 
           > 
             <span className={styles.bullet} /> 
             {tip} 
           </motion.li> 
         ))} 
       </ul> 
     </motion.div> 
 
     {/* Price Trend Card */} 
     <motion.div 
       className={styles.card} 
       initial={{ opacity: 0, y: 20 }} 
       animate={{ opacity: 1, y: 0 }} 
       transition={{ duration: 0.3, delay: 0.15 }} 
     > 
       <div className={styles.cardHeader}> 
         <TrendingDown size={18} className={styles.headerIcon} /> 
         <h3 className={styles.cardTitle}>Price Trend</h3> 
         <span className={styles.period}>Last 7 days</span> 
       </div> 
 
       <div className={styles.chart}> 
         <div className={styles.barContainer}> 
           {priceData.map((item, index) => { 
             const maxPrice = Math.max(...priceData.map((d) => 
d.price)); 
             const minPrice = Math.min(...priceData.map((d) => 
d.price)); 
             const range = maxPrice - minPrice; 
             const height = ((item.price - minPrice) / range) * 100; 
 
             return ( 
               <motion.div key={index} className={styles.barWrapper}> 
                 <motion.div 
                   className={styles.bar} 
                   style={{ height: `${height}%` }} 
                   initial={{ height: 0 }} 
                   animate={{ height: `${height}%` }} 
                   transition={{ duration: 0.5, delay: index * 0.05 }} 
                 /> 
                 <span className={styles.barLabel}>{item.day}</span> 
               </motion.div> 
             ); 
           })} 
         </div> 
       </div> 
 
       <p className={styles.trendInfo}>Average: ₹18,200/month</p> 
     </motion.div> 
 
     {/* AI Assistant Card */} 
     <motion.div 
       className={styles.card} 
       initial={{ opacity: 0, y: 20 }} 
       animate={{ opacity: 1, y: 0 }} 
       transition={{ duration: 0.3, delay: 0.2 }} 
     > 
       <div className={styles.aiHeader}> 
         <div className={styles.aiAvatar}>
🤖
</div> 
         <div> 
           <h3 className={styles.cardTitle}>Rent AI</h3> 
           <p className={styles.aiSubtitle}>Ask anything about 
rentals</p> 
         </div> 
       </div> 
 
       <div className={styles.aiContent}> 
         <p className={styles.exampleQuestion}> 
           
�
�
 "Is 18k reasonable for this area?" 
         </p> 
         <p className={styles.exampleQuestion}> 
           
�
�
 "Are there family-friendly options?" 
         </p> 
       </div> 
 
       <div className={styles.inputGroup}> 
         <input 
           type="text" 
           placeholder="Ask a question..." 
           className={styles.aiInput} 
         /> 
         <motion.button 
           className={styles.sendButton} 
           whileHover={{ scale: 1.05 }} 
           whileTap={{ scale: 0.95 }} 
           type="button" 
         > 
           <Send size={16} /> 
         </motion.button> 
       </div> 
     </motion.div> 
   </div> 
 ); 
}; 
 
export default RentInfoPanel; 