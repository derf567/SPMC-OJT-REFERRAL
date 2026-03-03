# Acceptance Progress - Triage Verification Workflow

## Overview
This document outlines the revised acceptance progress workflow for triage/EDCC accounts. Instead of automatically notifying the referrer to fill the transit form when all departments accept, the workflow now requires triage/EDCC verification before the referrer is notified.

## Current Workflow (Before)
1. Triage assigns departments to referral
2. Departments accept/reject referral
3. When majority of departments accept → Referral status changes to "dispositioned"
4. Referrer automatically notified to fill transit form
5. Referrer fills transit form → Status changes to "in_transit"

## New Workflow (After)
1. Triage assigns departments to referral
2. Departments accept/reject referral
3. When majority of departments accept → Referral status changes to "**awaiting_triage_verification**" (NEW)
4. **Triage/EDCC receives notification that referral was accepted**
5. **Triage/EDCC calls the accepting department to verify/discuss details**
6. **After triage/EDCC is satisfied, they manually approve the referral**
7. **Referrer is then notified to fill transit form**
8. Referrer fills transit form → Status changes to "in_transit"

## Changes Required

### Backend (Django)

#### 1. Models (SPMC/referrals/models.py)
- Add new status: `'awaiting_triage_verification'` to Referral status choices
- Add new field to Referral: `triage_verified_at` (DateTimeField, nullable)
- Add new field to Referral: `triage_verified_by` (ForeignKey to User, nullable)
- Add new field to Referral: `triage_verification_notes` (TextField, nullable)

#### 2. Views (SPMC/referrals/views.py)
- Modify `check_department_acceptance()` method:
  - When majority accepts, set status to `'awaiting_triage_verification'` instead of `'dispositioned'`
  - Create notification for triage/EDCC personnel
  
- Add new endpoint: `approve_for_transit` (POST)
  - Only accessible to triage/EDCC personnel
  - Changes status from `'awaiting_triage_verification'` to `'dispositioned'`
  - Records who approved and when
  - Sends notification to referrer to fill transit form
  - Creates status history entry

#### 3. Serializers (SPMC/referrals/serializers.py)
- Add new fields to ReferralSerializer:
  - `triage_verified_at`
  - `triage_verified_by` (with full name)
  - `triage_verification_notes`

### Frontend (React)

#### 1. TriageReferrals.tsx
- Update status badge display to show `'awaiting_triage_verification'` status
- Add new action button for triage/EDCC: "Approve for Transit"
- When referral is in `'awaiting_triage_verification'` status:
  - Show "Approve for Transit" button (only for triage/EDCC)
  - Show department acceptance details
  - Allow triage to add verification notes

#### 2. New Dialog Component: ApproveForTransitDialog
- Display referral and department acceptance details
- Show which departments accepted
- Allow triage/EDCC to add verification notes
- Confirm button to approve for transit
- On success, referrer will be notified

#### 3. Notification System
- When majority accepts: Notify triage/EDCC that referral is ready for verification
- When triage approves: Notify referrer to fill transit form

## Status Flow Diagram
```
in_triage
    ↓
waiting_acceptance
    ↓
awaiting_triage_verification (NEW - after majority accepts)
    ↓ (triage/EDCC approves)
dispositioned
    ↓
in_transit
    ↓
completed/cancelled
```

## UI Changes

### TriageReferrals Page
- Add new status badge for `'awaiting_triage_verification'`
- Show "Approve for Transit" button when status is `'awaiting_triage_verification'`
- Display acceptance progress with department details
- Allow triage to view and verify department responses

### New "Approve for Transit" Dialog
- Show referral details
- Show all department acceptances with status
- Show which departments accepted
- Input field for verification notes
- Confirm button to approve

## Notifications

### To Triage/EDCC
- **Trigger**: When majority of departments accept
- **Message**: "Referral [ID] has been accepted by [X] departments. Please verify and approve for transit."
- **Action**: Navigate to TriageReferrals page, click "Approve for Transit"

### To Referrer
- **Trigger**: When triage/EDCC approves the referral
- **Message**: "Your referral [ID] has been approved. Please fill in the transit form."
- **Action**: Navigate to referral details and fill transit form

## Implementation Steps
1. Add new status and fields to Referral model
2. Create migration for new fields
3. Update check_department_acceptance() logic
4. Create approve_for_transit endpoint
5. Update ReferralSerializer
6. Update TriageReferrals.tsx UI
7. Create ApproveForTransitDialog component
8. Update notification system
9. Test complete workflow
