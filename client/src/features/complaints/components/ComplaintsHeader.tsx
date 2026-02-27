// src/features/complaints/hooks/useComplaintFilters.ts 
import { 
 ComplaintFilterState, 
 ComplaintItem, 
 ComplaintStatus, 
 ComplaintTimeRange, 
} from '../types/complaint.types'; 
 
const isWithinTimeRange = (createdAt: string, range: 
ComplaintTimeRange) => { 
 if (range === 'All') return true; 
 const created = new Date(createdAt).getTime(); 
 const now = new Date().getTime(); 

 const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24)); 
 
 if (range === 'Today') return diffDays === 0; 
 if (range === 'This week') return diffDays <= 7;  return diffDays <= 30; 
}; 
 
export const filterComplaints = ( 
 complaints: ComplaintItem[], 
 filters: ComplaintFilterState, 
 currentUser: string, ) => { 
 return complaints.filter((item) => { 
   if (filters.categories.length && 
!filters.categories.includes(item.category)) { 
     return false; 
   } 
 
   if (filters.statuses.length && 
!filters.statuses.includes(item.status)) { 
     return false; 
   } 
 
   if (filters.priorities.length && 
!filters.priorities.includes(item.priority)) {      return false; 
   } 
 
   if (item.distance > filters.distance) { 
     return false; 
   } 
 
   if (!isWithinTimeRange(item.createdAt, filters.timeRange)) { 
     return false; 
   } 
 
   if (filters.myComplaints && item.reportedBy !== currentUser) { 
     return false; 
   } 
 
   return true; 
 }); 
}; 
 
export const updateStatusCount = ( 
 complaints: ComplaintItem[], 
 status: ComplaintStatus, ) => complaints.filter((item) => item.status === status).length; 
 
