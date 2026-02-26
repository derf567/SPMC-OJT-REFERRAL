# EDCC/Triage Dashboard Rebuild

## Overview
Rebuilt the EDCC/Triage Dashboard (Index.tsx) with 4 referral containers to better visualize the referral workflow stages from the EDCC/Triage perspective.

## 4 Containers

### 1. Requests (Yellow)
- **Status**: `pending`
- **Description**: Requests that aren't entertained yet, going to triage stage
- **Icon**: FileText
- **Color**: Yellow
- **Action**: EDCC personnel can transfer these to triage

### 2. Active (Blue)
- **Status**: `waiting`
- **Description**: Requests managed by triage, for EDMA to endorse to department doctors in SPMC
- **Icon**: Activity
- **Color**: Blue
- **Action**: Triage team makes decisions (emergent/urgent/schedule OPD)

### 3. Dispositioned (Purple)
- **Status**: `emergent`, `urgent`, or `schedule_opd`
- **Description**: Department doctors already coordinated, referrer got the transit template waiting to be filled out
- **Icon**: ClipboardCheck
- **Color**: Purple
- **Action**: Waiting for referrer to fill transit template

### 4. In Transit (Green)
- **Status**: `in_transit`
- **Description**: All is set, waiting for patient to arrive to mark as "Complete", "Cancelled (Reason)", or "HAMA"
- **Icon**: Truck
- **Color**: Green
- **Action**: HIS Department marks arrival/completion

## Features
- Real-time count display for each container
- Scrollable list of referrals in each container (max height 96)
- Click on any referral card to view details
- Color-coded status badges
- Responsive grid layout (2 columns on large screens, 1 on mobile)
- Empty state messages when no referrals in a container
- Auto-refresh every 2 minutes
- Dark mode support

## Technical Details
- File: `SPMC/front-end/src/pages/Index.tsx`
- Fetches all referrals via `referralsAPI.getAll()`
- Filters referrals by status into 4 separate arrays
- Each container shows:
  - Referral ID
  - Patient name
  - Specialty needed
  - Referring hospital
  - Time since creation
- Maintains user role display in header
- Uses DashboardLayout component

## User Roles That See This Dashboard
- EDCC Personnel (`edcc_personnel`)
- Call Triage (`call_triage`)
- View Only users with department assignment
