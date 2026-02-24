# Triage Call Response System Implementation

## Summary
This document outlines the implementation of a triage call response system where referrers can respond to urgent triage decisions.

## Changes Completed

### 1. Dashboard Layout Reordering ✅
- **Recent Referrals** section moved above stats cards
- **Reports** section moved to bottom of quick actions
- This provides better visibility of active referrals

### 2. Triage Call Response System ✅

#### Backend (Already Implemented)
The backend already has the necessary fields in the Referral model:
- `transit_decision` - stores 'now' or 'scheduled'
- `transit_scheduled_date` - date for scheduled transport
- `transit_scheduled_time` - time for scheduled transport  
- `transit_decision_at` - timestamp of decision

#### Frontend Features Added
1. **Triage Call Notification Banner**
   - Appears when referrer has urgent referrals awaiting response
   - Shows count of pending triage calls
   - "Respond Now" button to open decision modal

2. **Triage Call Buttons**
   - Animated "Triage Call" button on each urgent referral
   - Only shows when:
     - Status is 'urgent'
     - Triage decision is 'urgent' (set by EDMAR)
     - No transit decision made yet

3. **Transit Decision Modal**
   - Two options:
     - "Transport Now" - Immediate transport
     - "Schedule Transport" - Select date and time
   - Submits decision to backend
   - Updates referral status in real-time

## Workflow

### Step 1: EDCC Staff
- Receives referral from referrer
- Forwards to EDMAR/EDHO (Call Triage)

### Step 2: EDMAR Staff  
- Reviews referral
- Makes triage decision:
  - **Emergent** - Immediate care needed
  - **Urgent** - Requires urgent attention (triggers triage call)
  - **Schedule OPD** - Outpatient appointment

### Step 3: Referrer (If Urgent)
- Receives notification of urgent triage decision
- Sees "Triage Call" button on referral
- Opens modal and decides:
  - **Transport Now** - Patient will be transported immediately
  - **Schedule Transport** - Select future date/time for transport

### Step 4: EDCC & EDMAR
- Both receive notification of referrer's transit decision
- Can see decision in referral timeline
- Proceed with appropriate actions based on decision

## API Endpoint

```typescript
// POST /api/referrals/{id}/respond-to-triage-call/
{
  "transit_decision": "now" | "scheduled",
  "transit_scheduled_date": "2025-02-15", // if scheduled
  "transit_scheduled_time": "14:30"       // if scheduled
}
```

## Status Display

Referrals show enhanced status labels:
- "🚑 Transport Initiated" - When transit_decision = 'now'
- "📅 Transport Scheduled" - When transit_decision = 'scheduled'
- "⚡ Urgent" - When marked urgent but no decision yet
- "🚨 Emergent" - When marked emergent

## Notifications

Both EDCC and EDMAR staff receive notifications when:
1. Referrer responds to triage call
2. Transit decision is made
3. Scheduled transport date approaches

## Files Modified

1. `ReferrerDashboard.tsx` - Added triage call UI and logic
2. `api.ts` - Added `respondToTriageCall` method
3. Backend already has necessary models and fields

## Testing Checklist

- [ ] EDMAR can mark referral as urgent
- [ ] Referrer sees triage call notification
- [ ] Referrer can select "Transport Now"
- [ ] Referrer can schedule transport with date/time
- [ ] EDCC sees referrer's decision
- [ ] EDMAR sees referrer's decision
- [ ] Timeline shows transit decision
- [ ] Notifications sent to both EDCC and EDMAR

## Next Steps

1. Test the triage call workflow end-to-end
2. Add email/SMS notifications for urgent triage calls
3. Add reminder notifications for scheduled transports
4. Create admin dashboard to monitor triage call response times
