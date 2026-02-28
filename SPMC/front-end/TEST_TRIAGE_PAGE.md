# Testing Triage Page

## Issue Encountered
Browser shows: "Module not found: Error: Can't resolve '@/contexts/AuthContext'"

## Troubleshooting Steps

### 1. Restart the Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd SPMC/front-end
npm run dev
```

### 2. Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear browser cache completely

### 3. Clear Vite Cache
```bash
cd SPMC/front-end
rm -rf node_modules/.vite
npm run dev
```

### 4. Verify Imports
The TriageReferrals.tsx file has been updated with correct imports:
- ✅ `import { useAuth } from '@/contexts/AuthContext';`
- ✅ `import { referralsAPI, departmentsAPI } from '@/lib/api';`
- ✅ `import { DashboardLayout } from '@/components/layout/DashboardLayout';`

### 5. Check File Structure
Verify these files exist:
- ✅ `SPMC/front-end/src/contexts/AuthContext.tsx`
- ✅ `SPMC/front-end/src/lib/api.ts`
- ✅ `SPMC/front-end/src/components/layout/DashboardLayout.tsx`
- ✅ `SPMC/front-end/src/pages/TriageReferrals.tsx`

### 6. Verify tsconfig.json
Path mapping is correct:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 7. Verify vite.config.ts
Alias is correct:
```typescript
{
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
}
```

## Quick Fix

If the error persists, try this:

1. **Stop the dev server** (Ctrl+C in terminal)

2. **Clear the cache:**
   ```bash
   cd SPMC/front-end
   rm -rf node_modules/.vite
   rm -rf dist
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

4. **Hard refresh the browser:** Ctrl+Shift+R

## Testing the Page

Once the server is running:

1. Navigate to: `http://localhost:3000/triage`
2. You should see the Triage Referrals page
3. If you see "No referrals in triage", that's correct (empty state)

## Expected Behavior

The page should load with:
- Header: "Triage Referrals" with refresh button
- Filter dropdown for status
- Empty state message if no referrals
- Or table with referrals if data exists

## If Still Not Working

Check the browser console (F12) for specific error messages and share them.

The most common causes are:
1. Dev server not restarted after file changes
2. Browser cache not cleared
3. Vite cache needs clearing
4. TypeScript compilation errors

## Alternative: Use Relative Imports

If path aliases continue to cause issues, you can temporarily use relative imports:

```typescript
// Instead of:
import { useAuth } from '@/contexts/AuthContext';

// Use:
import { useAuth } from '../contexts/AuthContext';
```

But this shouldn't be necessary as the path aliases are configured correctly.
