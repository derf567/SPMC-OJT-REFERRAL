# Acceptance Progress Auto-Refresh Fix

## Problem
On the Triage tab, when a department declined a referral, the "Acceptance Progress" counter wasn't updating to reflect the decline. It continued showing stale data (e.g., "0/2") until the user manually clicked the "Refresh" button.

## Root Cause
The TriageReferrals component fetched referral data only on:
1. Component mount
2. When the status filter changed
3. When the user manually clicked "Refresh"

When a doctor accepted/rejected a referral from the DoctorDashboard, the TriageReferrals page had no way to know about the update and continued displaying cached data.

## Solution
Implemented automatic polling to refresh the triage referrals data:

### Changes Made

#### 1. Main TriageReferrals Component
- Added an auto-refresh interval that fetches updated referral data every 10 seconds
- The interval is set up in the `useEffect` hook and properly cleaned up when the component unmounts
- This ensures the acceptance progress counter always reflects the latest department decisions

```typescript
useEffect(() => {
  fetchTriageReferrals();
  fetchDepartments();
  
  // Set up auto-refresh every 10 seconds to catch department decisions
  const interval = setInterval(() => {
    fetchTriageReferrals();
  }, 10000);
  
  return () => clearInterval(interval);
}, [statusFilter]);
```

#### 2. DetailsDialog Component
- Added local state to track the current referral data
- Implemented auto-refresh every 5 seconds while the dialog is open
- This provides real-time updates when viewing department acceptance status
- Users can see acceptance/rejection changes immediately without closing and reopening the dialog

```typescript
const [currentReferral, setCurrentReferral] = useState(referral);

useEffect(() => {
  // Auto-refresh the referral data every 5 seconds while dialog is open
  const interval = setInterval(async () => {
    try {
      const response = await referralsAPI.getById(referral.id.toString());
      setCurrentReferral(response);
    } catch (error) {
      console.error('Error refreshing referral:', error);
    }
  }, 5000);
  
  return () => clearInterval(interval);
}, [referral.id]);
```

## How It Works

1. **Main Table**: Every 10 seconds, the triage referrals list is automatically refreshed, updating the acceptance progress counter in real-time
2. **Details Dialog**: When viewing department acceptance status, the data refreshes every 5 seconds, showing live updates as departments make decisions
3. **Manual Refresh**: Users can still click the "Refresh" button for immediate updates if needed

## Benefits

- **Real-time Updates**: Acceptance progress now reflects department decisions automatically
- **Better UX**: Users don't need to manually refresh to see the latest status
- **Efficient**: Uses reasonable polling intervals (10s for main list, 5s for details dialog)
- **Clean Cleanup**: Intervals are properly cleared to prevent memory leaks

## Testing

To verify the fix:
1. Open the Triage tab
2. Have a doctor accept/reject a referral from the DoctorDashboard
3. The acceptance progress counter should update within 10 seconds
4. Click "View Status" to open the details dialog
5. The department acceptance status should update within 5 seconds as decisions are made
