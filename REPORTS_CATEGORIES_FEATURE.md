# Reports Categories Feature

## Overview
Added 7 new report categories to the EDCC/EDMA Reports page for comprehensive referral analytics across Southern Mindanao.

## Date
March 8, 2026

## Report Categories Added

### 1. Coordinated Overall
- **Description**: Top referring hospitals in overall Southern Mindanao region
- **Scope**: All coordinated referrals across Southern Mindanao
- **Color Theme**: Green
- **Icon**: Building2
- **Status**: Coming Soon (UI ready, backend not connected)

### 2. Coordinated Inside Davao
- **Description**: Top referring hospitals within Davao City
- **Scope**: Coordinated referrals from hospitals inside Davao City
- **Color Theme**: Blue
- **Icon**: Building2
- **Status**: Coming Soon (UI ready, backend not connected)

### 3. Coordinated Outside Davao
- **Description**: Top referring hospitals outside Davao City
- **Scope**: Coordinated referrals from hospitals outside Davao City
- **Color Theme**: Indigo
- **Icon**: Building2
- **Status**: Coming Soon (UI ready, backend not connected)

### 4. Uncoordinated Overall
- **Description**: Uncoordinated referrals in overall Southern Mindanao
- **Scope**: All uncoordinated/cancelled referrals across Southern Mindanao
- **Color Theme**: Red
- **Icon**: Building2
- **Status**: Coming Soon (UI ready, backend not connected)

### 5. Uncoordinated Inside Davao
- **Description**: Top uncoordinated hospitals in Davao City
- **Scope**: Uncoordinated referrals from hospitals inside Davao City
- **Color Theme**: Orange
- **Icon**: Building2
- **Status**: Coming Soon (UI ready, backend not connected)

### 6. Uncoordinated Outside Davao
- **Description**: Top uncoordinated hospitals outside Davao City
- **Scope**: Uncoordinated referrals from hospitals outside Davao City
- **Color Theme**: Amber
- **Icon**: Building2
- **Status**: Coming Soon (UI ready, backend not connected)

### 7. Delay Department
- **Description**: Top delayed departments by processing time
- **Scope**: Departments with longest average processing times
- **Color Theme**: Purple
- **Icon**: Users
- **Status**: Coming Soon (UI ready, backend not connected)

## UI Features

### Report Cards
Each report category is displayed as an interactive card with:
- **Icon**: Visual indicator with color-coded background
- **Title**: Report category name
- **Subtitle**: Geographic scope or context
- **Description**: Brief explanation of what the report shows
- **Badge**: "Coming Soon" status indicator
- **Count Display**: Placeholder for data count (currently shows "---")
- **Hover Effect**: Shadow and transition effects for better UX

### Layout
- **Grid Layout**: Responsive 3-column grid (1 column on mobile, 2 on tablet, 3 on desktop)
- **Section Header**: "Detailed Report Categories" with FileText icon
- **Info Box**: Blue information box explaining that reports are in development

### Design System
- **Dark Mode Support**: All cards and elements support dark mode
- **Color Coding**: Each category has a unique color for easy identification
  - Green: Coordinated Overall
  - Blue: Coordinated Inside Davao
  - Indigo: Coordinated Outside Davao
  - Red: Uncoordinated Overall
  - Orange: Uncoordinated Inside Davao
  - Amber: Uncoordinated Outside Davao
  - Purple: Delay Department

## Technical Implementation

### File Modified
- `SPMC-OJT-REFERRAL/SPMC/front-end/src/pages/Reports.tsx`

### Components Used
- Badge (from @/components/ui/badge)
- Icons: Building2, Users, FileText, Info (from lucide-react)

### Styling
- Tailwind CSS classes for responsive design
- Dark mode support with `dark:` prefix
- Hover effects with `hover:` prefix
- Transition animations

## Future Backend Integration

When connecting to the backend, each report will need:

### API Endpoints (to be created)
```typescript
// Coordinated reports
GET /api/reports/coordinated-overall/
GET /api/reports/coordinated-inside-davao/
GET /api/reports/coordinated-outside-davao/

// Uncoordinated reports
GET /api/reports/uncoordinated-overall/
GET /api/reports/uncoordinated-inside-davao/
GET /api/reports/uncoordinated-outside-davao/

// Delay reports
GET /api/reports/delay-department/
```

### Expected Data Structure
```typescript
interface ReportData {
  category: string;
  total_count: number;
  items: Array<{
    name: string;
    count: number;
    percentage: number;
    avg_processing_time?: number; // For delay reports
  }>;
  time_period: {
    start_date: string;
    end_date: string;
  };
}
```

### Graph Requirements

#### For Hospital Reports (Coordinated/Uncoordinated)
- **Bar Chart**: Horizontal bars showing top 10 hospitals
- **X-axis**: Number of referrals
- **Y-axis**: Hospital names
- **Colors**: Match category color theme
- **Interactive**: Hover to show exact counts and percentages

#### For Delay Department Report
- **Bar Chart**: Horizontal bars showing departments
- **X-axis**: Average processing time (hours)
- **Y-axis**: Department names
- **Colors**: Purple theme
- **Additional Info**: Show min/max processing times on hover

### Click Behavior (Future)
When clicked, each card should:
1. Navigate to detailed report page
2. Show full data table with pagination
3. Display interactive graphs
4. Provide export options (PDF, Excel)
5. Allow date range filtering

## User Roles
These reports are visible to:
- ✅ EDCC (Emergency Dispatch and Communication Center)
- ✅ EDMA (Emergency Department Medical Administrator)
- ✅ Admin users
- ❌ Referrer accounts (hospital/doctor)

## Notes
- All reports respect the global filter (week/month/year) at the top of the page
- Reports will automatically update when filter changes
- "Coming Soon" badges will be removed once backend is connected
- Placeholder "---" will be replaced with actual counts

## Testing Checklist
- [ ] Cards display correctly on desktop
- [ ] Cards display correctly on tablet
- [ ] Cards display correctly on mobile
- [ ] Dark mode works properly
- [ ] Hover effects work
- [ ] Info box displays correctly
- [ ] Layout doesn't break with long hospital names
- [ ] Section integrates well with existing reports

## Next Steps
1. Create backend API endpoints for each report category
2. Implement data fetching logic in frontend
3. Add loading states for each report card
4. Create detailed report pages for each category
5. Implement graph visualizations
6. Add export functionality
7. Remove "Coming Soon" badges
8. Add click handlers to navigate to detailed views
