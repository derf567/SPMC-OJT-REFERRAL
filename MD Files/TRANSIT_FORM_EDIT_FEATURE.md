# Transit Form Edit Feature

## Overview
Added the ability to edit transit form information from the Patient Arrival tab. Previously, users could only view the transit information, but now they can edit it.

## Changes Made

### Frontend Changes

#### 1. TransitFormDialog Component (`SPMC/front-end/src/components/ui/TransitFormDialog.tsx`)
- Added support for edit mode with new props:
  - `existingData`: Pre-filled transit information
  - `isEditMode`: Boolean flag to indicate edit mode
- Added `useEffect` hook to pre-fill form fields when editing
- Updated dialog title to show "Edit Transit Form" when in edit mode
- Updated submit button text to show "Update Transit Form" when editing
- Updated success message to differentiate between create and update

#### 2. Patient Arrival Page (`SPMC/front-end/src/pages/TriageReferrals.tsx`)
- Added Edit icon import from lucide-react
- Added TransitFormDialog import
- Added state management for edit transit dialog:
  - `editTransitOpen`: Controls dialog visibility
  - `editTransitReferral`: Stores referral data for editing
- Added `openEditTransit()` function to load referral data and open edit dialog
- Added `handleTransitFormSuccess()` callback to refresh data after successful edit
- Added Edit button (blue pencil icon) in the actions column
- Added TransitFormDialog component at the end with edit mode enabled

### Backend Changes

#### 3. Views (`SPMC/referrals/views.py`)
- Modified `fill_transit_info()` endpoint to support editing:
  - Now accepts both 'dispositioned' and 'in_transit' status
  - Allows referrer, EDCC personnel, and triage users to edit
  - Only changes status from 'dispositioned' to 'in_transit' if needed
  - Returns appropriate message indicating if data was created or updated
  - Does not create duplicate status history when editing existing transit info

## User Experience

### Before
- Users could only view transit information via the Eye icon
- No way to correct mistakes or update information

### After
- Users can view transit information via the Eye icon (unchanged)
- Users can edit transit information via the new Edit icon (blue pencil)
- Edit dialog pre-fills all existing data
- Users can update any field and save changes
- Success message confirms whether data was created or updated

## Permissions
- Referrer who created the referral can edit
- EDCC personnel can edit
- Triage users can edit

## Technical Details
- Backend uses `update_or_create()` to handle both create and update operations
- Frontend passes `isEditMode` flag to differentiate UI behavior
- Status transition only happens when moving from 'dispositioned' to 'in_transit'
- Editing an already 'in_transit' referral does not change its status
