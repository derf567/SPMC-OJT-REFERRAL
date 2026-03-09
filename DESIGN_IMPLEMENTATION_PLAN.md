# Design Implementation Plan - 12 Pages from New Folder

## Status: IN PROGRESS

This document tracks the implementation of all 12 reconstructed designs from the `SPMC/front-end/New` folder.

## Pages to Update

### Priority 1 - Critical User Flow (Login & Core Pages)
1. ✅ **Login Page** (`login.tsx`) - Already matches design closely
2. ⏳ **Dashboard** (`dashboard.tsx` / `index.tsx`) - Needs sidebar + stats cards
3. ⏳ **Active Referrals** (`activereferrals.tsx`) - Needs table redesign
4. ⏳ **Triage Referrals** (`triagereferrals.tsx`) - Needs progress bars + filters

### Priority 2 - Registration & Forms  
5. ⏳ **Hospital Register** (`register.tsx`) - Needs form redesign
6. ⏳ **Doctor Register** (`doctorregister.tsx`) - Needs form redesign
7. ⏳ **Referral Form** (`externalreferral.tsx`) - Needs multi-step form

### Priority 3 - Management Pages
8. ⏳ **Account Approval** (`approval.tsx`) - Needs card-based layout
9. ⏳ **Incoming Referrals** (`incomingreferrals.tsx`) - Needs table redesign
10. ⏳ **Doctor Dashboard** (`doctordashboard.tsx`) - Needs stats + table
11. ⏳ **Outpatient Page** (`outpatient.tsx`) - Needs appointment cards
12. ⏳ **Reports/Analytics** (`reports.tsx`) - Needs charts + filters

## Design System Specifications

### Colors
- Primary: `#1975d2`
- Secondary Green: `#2e7d32`
- Background Light: `#f6f7f8`
- Background Dark: `#111921`

### Common Components Needed
- Sidebar navigation with active states
- Header with search bar, notifications, settings
- Stat cards with progress bars
- Data tables with hover states
- Filter dropdowns
- Pagination controls
- Modal dialogs
- Status badges (Urgent, High, Medium, Low)
- Progress indicators

### Typography
- Font: Inter
- Icons: Material Symbols Outlined

## Implementation Notes

- All pages use Material Symbols icons (not lucide-react where possible)
- Dark mode support required for all pages
- Responsive design (mobile-first)
- Consistent spacing and border radius
- Shadow effects for depth
- Hover states and transitions

## Next Steps

1. Update login page icon (use `medical_services` instead of `local_hospital`)
2. Implement dashboard with sidebar
3. Update active referrals table
4. Update triage referrals with progress bars
5. Continue with remaining pages in priority order
