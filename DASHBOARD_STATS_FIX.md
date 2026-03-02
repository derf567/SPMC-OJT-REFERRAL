# Dashboard Stats Fix

## Problem
The dashboard was showing "0" for all statistics even though there were referrals in the system.

## Root Cause
The frontend was trying to fetch all referrals and calculate stats client-side, which was:
1. Inefficient (fetching all data just to count)
2. Not working properly with the API response format
3. Not using the existing backend `dashboard_stats` endpoint correctly

## Solution Implemented

### Backend Changes (views.py)
Updated the `dashboard_stats` endpoint to return comprehensive daily statistics:

```python
@action(detail=False, methods=['get'])
def dashboard_stats(self, request):
    """Get dashboard statistics"""
    # Returns:
    - total_referrals_today: Referrals created today
    - total_referrals_yesterday: Referrals created yesterday
    - pending_referrals: Current pending cases
    - critical_referrals: Current critical priority cases
    - completed_today: Referrals completed today
    - completed_yesterday: Referrals completed yesterday
    - total_patients: Unique patient count
    - Other stats (in_transit, urgent, emergent, etc.)
```

### Frontend Changes (Index.tsx)
Simplified the stats fetching to use the backend endpoint directly:

**Before:**
- Fetched all referrals
- Filtered and calculated stats client-side
- Inefficient and error-prone

**After:**
- Calls `getDashboardStats()` API
- Uses backend-calculated stats directly
- Fast and reliable

## Stats Displayed

1. **Total Referrals Today**
   - Shows referrals created today
   - Percentage change from yesterday

2. **Pending Cases**
   - Current pending referrals
   - Shows critical count

3. **Completed Today**
   - Referrals completed today
   - Percentage change from yesterday

4. **Total Patients**
   - Unique patient count across all referrals

## Testing

Run the test script to verify stats:
```bash
cd SPMC
python test_dashboard_stats.py
```

Expected output shows actual counts from database.

## Current Data (as of test)
- Total referrals today: 0 (no new referrals created today)
- Total referrals yesterday: 16
- Pending cases: 0
- Critical cases: 5
- Completed today: 0
- Completed yesterday: 1
- Total unique patients: 14
- Total referrals (all time): 21

## How to Verify Fix

1. **Backend**: The API endpoint `/api/referrals/dashboard_stats/` returns correct data
2. **Frontend**: After refreshing the browser, dashboard shows actual numbers
3. **Real-time**: Stats update every 2 minutes automatically

## Notes

- Stats are calculated based on Philippine timezone (UTC+8)
- "Today" means from 00:00:00 to 23:59:59 of current date
- Percentage changes compare today vs yesterday
- If yesterday had 0 and today has any, shows +100%

## Date Fixed
February 26, 2026
