# How to Fix "Davao Account" Display Issue

The system is now configured to show "Davao Doctors Hospital" instead of "Davao Account" for hospital accounts.

## To see the fix:

### Option 1: Log out and log back in
1. Click on the user dropdown (top right)
2. Click "Sign Out"
3. Log back in with: `davao_doctors` / `davao123`
4. You should now see "Davao Doctors Hospital" instead of "Davao Account"

### Option 2: Clear browser cache
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files" and "Cookies and other site data"
3. Click "Clear data"
4. Refresh the page with `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
5. Log back in

### Option 3: Clear localStorage manually
1. Open browser DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "Local Storage" in the left sidebar
4. Click on your site's URL
5. Delete the `token` key
6. Refresh the page
7. Log back in

## What was changed:

1. **ExternalReferral.tsx** - "Logged in as" now shows hospital name first
2. **ReferrerDashboardLayout.tsx** - Already had logic to show hospital name in dropdown
3. **authentication.py** - Already includes hospital_name in login response

The changes are complete, you just need to refresh your login session to see them!
