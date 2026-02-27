// src/features/relief/mock/relief.mock.ts 
import type { HelpOffer, ReliefRequest } from '../types/relief.types'; 
 
export const mockReliefRequests: ReliefRequest[] = [ 
 { 
   id: 'REL-2026-001', 
   type: 'request', 
   helpType: 'Food', 
   title: 'Need baby formula urgently', 
   description: 
     'My 4-month-old baby is running out of formula. We moved recently 
        and our supply from relatives has not arrived. We need at least 2 cans 
        of Nan Pro or similar to last us through the week.', 
   urgency: 'Critical', 
   status: 'Open', 
   visibility: 'Public', 
   contactPreference: 'In-app message', 
   timeSensitivity: 'Immediate', 
   location: 'Motijheel, Dhaka', 
   distance: 120, 
   createdAt: '2026-02-22T06:30:00Z', 
   updatedAt: '2026-02-22T06:30:00Z', 
   postedBy: 'Nasrin B.', 
   avatarInitials: 'NB', 
   verified: true, 
   anonymous: false, 
   volunteerCount: 2, 
   volunteers: [ 
     { id: 'V1', name: 'Karim R.', avatarInitials: 'KR', 
verifiedNeighbor: true, joinedAt: '2026-02-22T07:10:00Z' }, 
     { id: 'V2', name: 'Shirin A.', avatarInitials: 'SA', 
verifiedNeighbor: true, joinedAt: '2026-02-22T07:45:00Z' }, 
   ], 
   timeline: [ 
     { stage: 'Posted', date: '2026-02-22T06:30:00Z' }, 
     { stage: 'Volunteer Responded', date: '2026-02-22T07:10:00Z', 
note: 'Karim R. confirmed availability.' }, 
   ], 
   comments: [ 
     { 
       id: 'C1', 
       author: 'Karim R.', 
       avatarInitials: 'KR', 
       message: 'I have 1 can at home. Will bring it tonight. Please 
message me your address.', 
       createdAt: '2026-02-22T07:12:00Z', 
     }, 
   ], 
   photos: [], 
 }, 
 { 
   id: 'REL-2026-002', 
   type: 'request', 
   helpType: 'Medical', 
   title: 'Insulin needed — elderly neighbor out of supply', 
   description: 
     'My 72-year-old father is diabetic and ran out of insulin. We cannot reach the pharmacy quickly due to flooding in our lane. Any neighbor with spare Lantus or Humulin-N would save his life right now.', 
   urgency: 'Critical', 
   status: 'Volunteers Assigned', 
   visibility: 'Public', 
   contactPreference: 'Phone', 
   timeSensitivity: 'Immediate', 
   location: 'Motijheel, Dhaka', 
   distance: 240, 
   createdAt: '2026-02-22T05:00:00Z', 
   updatedAt: '2026-02-22T06:00:00Z', 
   postedBy: 'Anonymous', 
   avatarInitials: 'AN', 
   verified: false, 
   anonymous: true, 
   volunteerCount: 1, 
   volunteers: [ 
     { id: 'V3', name: 'Dr. Farhana M.', avatarInitials: 'FM', 
verifiedNeighbor: true, joinedAt: '2026-02-22T05:45:00Z' }, 
   ], 
   timeline: [ 
     { stage: 'Posted', date: '2026-02-22T05:00:00Z' }, 
     { stage: 'Volunteer Responded', date: '2026-02-22T05:45:00Z', 
note: 'Dr. Farhana is bringing medication.' }, 
   ], 
   comments: [], 
   photos: [], 
 }, 
 { 
   id: 'REL-2026-003', 
   type: 'request', 
   helpType: 'Shelter', 
   title: 'Family of 4 needs temporary housing after roof collapse', 
   description: 
     'Our roof partially collapsed after last night\'s storm. We are a 
family of 4 including 2 young children. We need shelter for 2-3 nights 
while repairs are arranged. We have sleeping supplies but need a safe 
space.', 
   urgency: 'Urgent', 
   status: 'In Progress', 
   visibility: 'Public', 
   contactPreference: 'In-app message', 
   timeSensitivity: 'Immediate', 
   location: 'Motijheel, Dhaka', 
   distance: 380, 
   createdAt: '2026-02-21T22:15:00Z', 
   updatedAt: '2026-02-22T01:30:00Z', 
   postedBy: 'Rashed K.', 
   avatarInitials: 'RK', 
   verified: true, 
   anonymous: false, 
   volunteerCount: 3, 
   volunteers: [ 
     { id: 'V4', name: 'Tanvir H.', avatarInitials: 'TH', 
verifiedNeighbor: true, joinedAt: '2026-02-21T23:00:00Z' }, 
     { id: 'V5', name: 'Mitu S.', avatarInitials: 'MS', 
verifiedNeighbor: false, joinedAt: '2026-02-22T00:10:00Z' }, 
     { id: 'V6', name: 'Omar F.', avatarInitials: 'OF', 
verifiedNeighbor: true, joinedAt: '2026-02-22T01:20:00Z' }, 
   ], 
   timeline: [ 
     { stage: 'Posted', date: '2026-02-21T22:15:00Z' }, 
     { stage: 'Volunteer Responded', date: '2026-02-21T23:00:00Z', 
note: 'Tanvir offered his guest room.' }, 
     { stage: 'Help In Progress', date: '2026-02-22T01:30:00Z', note: 
'Family moved to Tanvir\'s place.' }, 
   ], 
   comments: [ 
     { 
       id: 'C2', 
       author: 'Tanvir H.', 
       avatarInitials: 'TH', 
       message: 'Family is now safe at my place. Will update when they 
find a permanent solution.', 
       createdAt: '2026-02-22T01:35:00Z', 
     }, 
   ], 
   photos: [], 
   resolutionSummary: undefined, 
 }, 
 { 
   id: 'REL-2026-004', 
   type: 'request', 
   helpType: 'Transportation', 
   title: 'Need ride to BSMMU hospital — urgent appointment', 
   description: 
     'My mother has a critical cancer follow-up at BSMMU this morning 
at 10am. Our usual transport is stuck due to waterlogging near Paltan. 
We are in Sector 6 of Motijheel. Anyone driving that route, please 
help.', 
   urgency: 'Urgent', 
   status: 'Open', 
   visibility: 'Public', 
   contactPreference: 'Phone', 
   timeSensitivity: 'Immediate', 
   location: 'Motijheel Sector 6', 
   distance: 560, 
   createdAt: '2026-02-22T07:45:00Z', 
   updatedAt: '2026-02-22T07:45:00Z', 
   postedBy: 'Abdul M.', 
   avatarInitials: 'AM', 
   verified: true, 
   anonymous: false, 
   volunteerCount: 0, 
   volunteers: [], 
   timeline: [{ stage: 'Posted', date: '2026-02-22T07:45:00Z' }], 
   comments: [], 
   photos: [], 
 }, 
 { 
   id: 'REL-2026-005', 
   type: 'request', 
   helpType: 'Financial', 
   title: 'Emergency rent support needed this week', 
   description: 
     'I lost my job last month and my landlord will evict me in 3 days 
if I cannot pay the partial amount of 4,500 taka. I have a young 
daughter. Any support — loan, direct help, or connecting me to a fund — 
would be lifesaving.', 
   urgency: 'Important', 
   status: 'Open', 
   visibility: 'Only verified neighbors', 
   contactPreference: 'In-app message', 
   timeSensitivity: 'Within 24 hours', 
   location: 'Motijheel, Dhaka', 
   distance: 290, 
   createdAt: '2026-02-21T18:00:00Z', 
   updatedAt: '2026-02-21T18:00:00Z', 
   postedBy: 'Anonymous', 
   avatarInitials: 'AN', 
   verified: false, 
   anonymous: true, 
   volunteerCount: 0, 
   volunteers: [], 
   timeline: [{ stage: 'Posted', date: '2026-02-21T18:00:00Z' }], 
   comments: [], 
   photos: [], 
 }, 
 { 
   id: 'REL-2026-006', 
   type: 'request', 
   helpType: 'Utilities', 
   title: 'Water supply cut — need access to clean water', 
   description: 
     'WASA cut our building\'s water supply due to an unpaid bill from 
the previous owner. We have 8 residents with no running water since 2 
days. We need access to clean water or help contacting WASA for 
emergency restoration.', 
   urgency: 'Important', 
   status: 'Open', 
   visibility: 'Public', 
   contactPreference: 'In-app message', 
   timeSensitivity: 'Within 24 hours', 
   location: 'Motijheel, Dhaka', 
   distance: 410, 
   createdAt: '2026-02-21T14:20:00Z', 
   updatedAt: '2026-02-21T14:20:00Z', 
   postedBy: 'Sabina R.', 
   avatarInitials: 'SR', 
   verified: true, 
   anonymous: false, 
   volunteerCount: 1, 
   volunteers: [ 
     { id: 'V7', name: 'Jahangir A.', avatarInitials: 'JA', 
verifiedNeighbor: true, joinedAt: '2026-02-21T16:00:00Z' }, 
   ], 
   timeline: [ 
     { stage: 'Posted', date: '2026-02-21T14:20:00Z' }, 
     { stage: 'Volunteer Responded', date: '2026-02-21T16:00:00Z', 
note: 'Jahangir has WASA contacts.' }, 
   ], 
   comments: [], 
   photos: [], 
 }, 
 { 
   id: 'REL-2026-007', 
   type: 'request', 
   helpType: 'Food', 
   title: 'Iftar food needed for 6 people', 
   description: 
     'Our family of 6 is fasting and we have no food prepared for Iftar 
tonight. We are in difficult financial circumstances and would 
appreciate any cooked or dry food donations from neighbors.', 
   urgency: 'Normal', 
   status: 'Completed', 
   visibility: 'Public', 
   contactPreference: 'In-app message', 
   timeSensitivity: 'Within 24 hours', 
   location: 'Motijheel, Dhaka', 
   distance: 180, 
   createdAt: '2026-02-20T10:00:00Z', 
   updatedAt: '2026-02-20T17:30:00Z', 
   postedBy: 'Hafizur R.', 
   avatarInitials: 'HR', 
   verified: true, 
   anonymous: false, 
   volunteerCount: 4, 
   volunteers: [], 
   timeline: [ 
     { stage: 'Posted', date: '2026-02-20T10:00:00Z' }, 
     { stage: 'Volunteer Responded', date: '2026-02-20T12:00:00Z' }, 
     { stage: 'Help In Progress', date: '2026-02-20T16:00:00Z' }, 
     { stage: 'Completed', date: '2026-02-20T17:30:00Z', note: 'Family 
received Iftar from 4 neighbors. Alhamdulillah.' }, 
   ], 
   comments: [], 
   photos: [], 
   resolutionSummary: 'Received food from 4 neighbors. The family is 
grateful and situation is resolved.', 
 }, 
]; 
 
export const mockHelpOffers: HelpOffer[] = [ 
 { 
   id: 'OFF-2026-001', 
   type: 'offer', 
   helpType: 'Medical', 
   title: 'Registered nurse — free home visits for elderly', 
   description: 
     'I am a registered nurse at Square Hospital. On my days off I can 
visit elderly or sick neighbors for basic health check-ups, wound 
dressing, and medication guidance. No cost involved.', 
   availability: 'Weekends', 
   serviceRadius: 2, 
   contactPreference: 'In-app message', 
   isRecurring: true, 
   location: 'Motijheel, Dhaka', 
   distance: 310, 
   createdAt: '2026-02-20T09:00:00Z', 
   postedBy: 'Dr. Farhana M.', 
   avatarInitials: 'FM', 
   verified: true, 
 }, 
 { 
   id: 'OFF-2026-002', 
   type: 'offer', 
   helpType: 'Transportation', 
   title: 'Free rides to nearby hospitals — mornings only', 
   description: 
     'I drive a CNG and am willing to offer free rides to BSMMU, Dhaka 
Medical, or Holy Family hospital for neighbors who cannot afford 
transport. Available weekday mornings before 10am.', 
   availability: 'Weekends', 
   serviceRadius: 3, 
   contactPreference: 'Phone', 
   isRecurring: true, 
   location: 'Motijheel, Dhaka', 
   distance: 450, 
   createdAt: '2026-02-19T14:00:00Z', 
   postedBy: 'Rahim D.', 
   avatarInitials: 'RD', 
   verified: true, 
 }, 
 { 
   id: 'OFF-2026-003', 
   type: 'offer', 
   helpType: 'Food', 
   title: 'Cooked meals available for families in need — weekends', 
   description: 
     'My family prepares extra food on weekends and we would like to 
share it with neighbors in need. We can provide 4-6 servings of 
homemade food (Bangladeshi cuisine) on Saturday and Sunday 
afternoons.', 
   availability: 'Weekends', 
   serviceRadius: 1, 
   contactPreference: 'In-app message', 
   isRecurring: true, 
   location: 'Motijheel, Dhaka', 
   distance: 200, 
   createdAt: '2026-02-18T11:00:00Z', 
   postedBy: 'Rokeya B.', 
   avatarInitials: 'RB', 
   verified: true, 
 }, 
 { 
   id: 'OFF-2026-004', 
   type: 'offer', 
   helpType: 'Financial', 
   title: 'Micro-aid fund — up to 2,000 taka one-time', 
   description: 
     'I run a small personal fund for emergency micro-aid in my 
neighborhood. If you are facing an emergency and need up to 2,000 taka 
urgently, contact me with a brief explanation. No interest, repay when 
possible.', 
   availability: 'On-call', 
   serviceRadius: 1, 
   contactPreference: 'In-app message', 
   isRecurring: false, 
   location: 'Motijheel, Dhaka', 
   distance: 350, 
   createdAt: '2026-02-17T09:30:00Z', 
   postedBy: 'Tariq I.', 
   avatarInitials: 'TI', 
   verified: true, 
 }, 
 { 
   id: 'OFF-2026-005', 
   type: 'offer', 
   helpType: 'Shelter', 
   title: 'Spare room available for emergency short-term stays', 
   description: 
     'I have a spare unfurnished room that can accommodate 1–2 adults 
for emergency short-term stays of up to 5 days. Suitable for 
individuals or couples displaced by sudden events like flooding or 
family crisis.', 
   availability: 'On-call', 
   serviceRadius: 0, 
   contactPreference: 'In-app message', 
   isRecurring: false, 
   location: 'Motijheel, Dhaka', 
   distance: 480, 
   createdAt: '2026-02-16T16:00:00Z', 
   postedBy: 'Nasim U.', 
   avatarInitials: 'NU', 
   verified: false, 
 }, 
]; 