// src/features/complaints/mock/complaintsData.ts 
import { ComplaintItem } from '../types/complaint.types'; 
 
export const complaintsData: ComplaintItem[] = [ 
 { 
   id: 'CMP-2026-0012', 
   title: 'Overflowing garbage near Gate 2', 
   category: 'Garbage', 
   description: 
     'Garbage bins near Gate 2 have been overflowing for 3 days. The 
waste is spilling onto the road and attracting stray dogs. Requesting 
immediate cleanup and additional bins.', 
   priority: 'High',    status: 'Under Review', 
   createdAt: '2026-02-21T09:20:00.000Z', 
   distance: 120, 
   upvotes: 18, 
   comments: 6, 
   reportedBy: 'Anonymous', 
   verified: true, 

   visibility: 'Public', 
   location: 'Gate 2, Motijheel', 
   updates: [ 
     { stage: 'Reported', date: '2026-02-21' }, 
     { stage: 'Under Review', date: '2026-02-21', note: 'Ward office 
acknowledged.' }, 
   ], 
   attachments: ['garbage-gate2.jpg'], 
   commentThread: [ 
     { 
       id: 'cmt-1', 
       author: 'Community Admin', 
       message: 'Thank you. We have forwarded this to the sanitation 
team.', 
       createdAt: '2026-02-21T11:05:00.000Z', 
     }, 
   ], 
 }, 
 { 
   id: 'CMP-2026-0013', 
   title: 'Streetlight not working on Block C', 
   category: 'Electricity', 
   description: 
     'The streetlight near Block C entrance has been off for a week. 
Area is very dark at night and feels unsafe for residents returning late.', 
   priority: 'Medium', 
   status: 'Pending', 
   createdAt: '2026-02-20T17:45:00.000Z', 
   distance: 310, 
   upvotes: 9, 
   comments: 3, 
   reportedBy: 'Test User', 
   verified: false, 
   visibility: 'Public', 
   location: 'Block C Entrance, Motijheel', 
   updates: [{ stage: 'Reported', date: '2026-02-20' }], 
   attachments: ['streetlight-blockc.png'], 
 }, 
 { 
   id: 'CMP-2026-0014', 
   title: 'Water supply interruption in Lane 7', 
   category: 'Water supply', 

   description: 
     'No water supply since last evening. Multiple households are 
affected. Please share an update on repair timeline.', 
   priority: 'Urgent',    status: 'In Progress', 
   createdAt: '2026-02-19T07:30:00.000Z', 
   distance: 540, 
   upvotes: 26, 
   comments: 11, 
   reportedBy: 'Farhana Akter', 
   verified: true,    visibility: 'Public', 
   location: 'Lane 7, Motijheel', 
   updates: [ 
     { stage: 'Reported', date: '2026-02-19' }, 
     { stage: 'Under Review', date: '2026-02-19', note: 'Utility team 
assigned.' }, 
     { stage: 'In Progress', date: '2026-02-20', note: 'Repair work started.' }, 
   ], 
 }, 
 { 
   id: 'CMP-2026-0015', 
   title: 'Broken sidewalk tile near community park', 
   category: 'Road damage',    description: 
     'Sidewalk tiles near the community park are broken and uneven, 
causing tripping hazards for elderly residents and children.', 
   priority: 'Low', 
   status: 'Resolved', 
   createdAt: '2026-02-15T12:10:00.000Z', 
   distance: 880,    upvotes: 6, 
   comments: 2, 
   reportedBy: 'Anonymous', 
   verified: false, 
   visibility: 'Public', 
   location: 'Community Park, Motijheel', 
   updates: [      { stage: 'Reported', date: '2026-02-15' }, 
     { stage: 'Under Review', date: '2026-02-16' }, 
     { stage: 'In Progress', date: '2026-02-18' }, 

     { stage: 'Resolved', date: '2026-02-19', note: 'Tiles replaced.' 
}, 
   ], 
   resolutionSummary: 'Sidewalk tiles were replaced by the municipal crew on Feb 19.', 
 }, 
 { 
   id: 'CMP-2026-0016', 
   title: 'Late-night construction noise near Block A', 
   category: 'Noise', 
   description:      'Construction work continues past 11 PM creating noise 
disturbances. Please enforce the designated quiet hours.', 
   priority: 'Medium', 
   status: 'Under Review', 
   createdAt: '2026-02-18T21:10:00.000Z', 
   distance: 420, 
   upvotes: 14,    comments: 4, 
   reportedBy: 'Nusrat Jahan', 
   verified: true, 
   visibility: 'Only admins', 
   location: 'Block A, Motijheel', 
   updates: [ 
     { stage: 'Reported', date: '2026-02-18' }, 
     { stage: 'Under Review', date: '2026-02-19', note: 'Compliance 
check scheduled.' }, 
   ], 
 }, 
 { 
   id: 'CMP-2026-0017', 
   title: 'Suspicious activity reported near grocery lane',    category: 'Safety', 
   description: 
     'Several residents noticed suspicious activity late at night near 
the grocery lane. Request additional patrols for the next few days.', 
   priority: 'High', 
   status: 'In Progress', 
   createdAt: '2026-02-17T23:05:00.000Z',    distance: 670, 
   upvotes: 21, 
   comments: 8, 
   reportedBy: 'Anonymous', 
   verified: true, 
   visibility: 'Public', 
   location: 'Grocery Lane, Motijheel', 
   updates: [      { stage: 'Reported', date: '2026-02-17' }, 
     { stage: 'Under Review', date: '2026-02-18' }, 
     { stage: 'In Progress', date: '2026-02-19', note: 'Additional 
patrols deployed.' }, 
   ], 
 }, 
]; 
 
export const complaintFormLimits = { 
 title: 80, 
 description: 700, 
}; 
 
