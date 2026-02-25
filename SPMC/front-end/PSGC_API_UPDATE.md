# PSGC API Integration Update

## Changes Made

### 1. Updated API Service (`src/services/psaApi.ts`)

**New API Base URL:**
- Changed from: `https://psgc-api.azurewebsites.net/api`
- Changed to: `https://psgc.cloud/api`

**Key Improvements:**

- **Barangay Caching**: Added 5-minute cache for barangays API to improve performance (barangays dataset is very large ~42,000+ records)
- **Davao City Fix**: Special handling for Region 11 (Davao Region) to include Davao City, which is an independent city (code: 1124)
- **Client-side Filtering**: Since PSGC Cloud API returns all data, filtering is done client-side using PSGC code prefixes

**Code Filtering Logic:**
- Regions: 2-digit codes (e.g., "11" for Davao Region)
- Provinces: 4-digit codes (e.g., "1123" for Davao del Sur)
- Cities/Municipalities: 6-digit codes (e.g., "112401" for Davao City)
- Barangays: 9-digit codes (filtered by first 6 digits)

### 2. Updated Register Page (`src/pages/Register.tsx`)

**Region 11 Special Handling:**
- When Region 11 (Davao Region) is selected, Davao City appears immediately even without selecting a province
- Added helper text: "Independent cities like Davao City are shown. Select a province to see more cities."

**Loading States:**
- Added `loadingBarangays` state to show loading indicator
- Improved user feedback with "Loading barangays... This may take a moment."

**Form Behavior:**
- City/Municipality dropdown is enabled for Region 11 even without province selection
- Barangay dropdown shows proper loading state and feedback

## Testing

### Test File Created: `test_psgc_api.html`
Open this file in a browser to test all API endpoints:
- Regions
- Provinces
- Cities
- Municipalities
- Barangays (sample)

### Expected Behavior:

1. **Select Region 11 (Davao Region)**
   - Provinces load (Davao del Norte, Davao del Sur, etc.)
   - Davao City appears in City dropdown immediately

2. **Select Province (e.g., Davao del Sur)**
   - Cities/Municipalities for that province load
   - Davao City remains available

3. **Select City (e.g., Davao City)**
   - Barangays load (may take 5-10 seconds on first load)
   - Subsequent loads are faster due to caching

## Performance Notes

- **Regions**: ~17 items - Fast
- **Provinces**: ~82 items - Fast
- **Cities**: ~149 items - Fast
- **Municipalities**: ~1,488 items - Fast
- **Barangays**: ~42,000+ items - Slow (5-10 seconds first load, then cached)

## API Documentation

Full API docs: https://psgc.cloud/api-docs

### Available Endpoints:
- `GET https://psgc.cloud/api/regions`
- `GET https://psgc.cloud/api/provinces`
- `GET https://psgc.cloud/api/cities`
- `GET https://psgc.cloud/api/municipalities`
- `GET https://psgc.cloud/api/barangays`

## Known Issues & Solutions

### Issue 1: Davao City Missing
**Problem**: Davao City is an independent city (not part of any province)
**Solution**: Special handling in code to include cities with code starting with "1124" when Region 11 is selected

### Issue 2: Barangays Loading Slow
**Problem**: 42,000+ barangays take time to download
**Solution**: 
- Added caching (5-minute duration)
- Added loading indicator
- Filter client-side after initial load

### Issue 3: Unexpected Token Error
**Problem**: Large JSON response from barangays API
**Solution**: Proper error handling and caching to avoid repeated large downloads

## Future Improvements

1. Consider using localStorage for longer-term caching
2. Implement progressive loading for barangays
3. Add search/filter functionality for large dropdowns
4. Consider using a virtualized select component for better performance
