# Modal Auto-Reopen Bug Fix

## Issue
When clicking "Close" on the Department Acceptance Status modal in the Triage page, the modal would automatically reopen after a few seconds. This was caused by the `viewDetails` URL parameter remaining in the URL and continuously triggering the modal to reopen.

## Root Cause
In `TriageReferrals.tsx`, the `useEffect` that handles the `viewDetails` URL parameter was:
1. Setting the modal state (opening the modal)
2. THEN removing the URL parameter

This meant that after the URL parameter was removed, the component would re-render, but the effect would still run again because `searchParams` was in the dependency array, causing the modal to reopen.

## Solution
Implemented a three-part fix:

### 1. Remove URL Parameter BEFORE Setting Modal State
Changed the order of operations so the URL parameter is removed immediately when detected, before setting any modal state:

```typescript
// Remove the URL parameter BEFORE setting modal state to prevent re-triggering
window.history.replaceState({}, document.title, window.location.pathname);
setSelectedReferral(referralToView);
setShowDetailsDialog(true);
```

### 2. Add Processing Flag
Added a `hasProcessedViewDetails` state flag to track whether the viewDetails parameter has already been processed:

```typescript
const [hasProcessedViewDetails, setHasProcessedViewDetails] = useState(false);
```

This prevents the effect from running multiple times for the same parameter.

### 3. Reset Flag on Modal Close
When the modal closes (either via the Close button or Redirect button), the flag is reset:

```typescript
onClose={() => {
  setShowDetailsDialog(false);
  setSelectedReferral(null);
  setHasProcessedViewDetails(false);
}}
```

## Files Modified
- `SPMC/front-end/src/pages/TriageReferrals.tsx`

## Changes Made
1. Added `hasProcessedViewDetails` state variable
2. Moved `window.history.replaceState()` to execute BEFORE setting modal state
3. Added `!hasProcessedViewDetails` check to the useEffect condition
4. Set `hasProcessedViewDetails(true)` after processing the parameter
5. Reset `hasProcessedViewDetails(false)` in both `onClose` and `onRedirect` handlers
6. Removed unused `useAuth` import and `user` variable

## Testing
The modal should now:
- Open correctly when clicking a notification
- Close properly when clicking the "Close" button
- NOT reopen after closing
- Allow the user to manually open the modal again by clicking "View Status" button
- Work correctly with the "Redirect to Assign Departments" button

## Behavior Summary
- **Notification Click**: Opens modal with referral details ✓
- **Close Button**: Closes modal and stays closed ✓
- **Redirect Button**: Closes modal and opens assign departments dialog ✓
- **Manual View Status**: Opens modal on demand ✓
- **No Auto-Reopen**: Modal stays closed after user closes it ✓
