# SPMC Design Implementation Guide

## Completed Implementations ✅

1. **doctorregister.tsx** - Doctor Registration Page
   - Account credentials section
   - Personal information section
   - Professional details with specialty checkboxes
   - File upload for SPMC ID
   - Success modal with redirect

2. **login.tsx** - Login Page
   - Username/password authentication
   - Remember me checkbox
   - Forgot password link
   - Demo credentials display
   - Registration links for hospital and doctor

3. **register.tsx** - Hospital Registration Page
   - Account credentials
   - Hospital information (name, level, bed capacity)
   - Location details (region, province, city, barangay)
   - Privacy agreement checkbox
   - Success modal

## Remaining Implementations 📋

### High Priority (Core Functionality)

1. **dashboard.tsx** - Main Dashboard
   - Header with search and notifications
   - Sidebar navigation
   - KPI cards (pending, active, dispositioned, in transit)
   - Referral overview table with tabs
   - Timeline modal for referral details

2. **incomingreferrals.tsx** - Incoming Referrals
   - Sidebar navigation
   - Header with search and notifications
   - Referral cards with status indicators
   - Priority badges (urgent, emergent, scheduled)
   - Arrived button for each referral
   - Footer stats

3. **activereferrals.tsx** - Active Referrals
   - Sidebar navigation
   - Search and filter bar
   - Data table with pagination
   - Status indicators
   - Priority badges
   - Action buttons (view, edit)

4. **triagereferrals.tsx** - Triage Referrals
   - Sidebar navigation
   - Filter by status and specialty
   - Referral table with progress bars
   - Assign departments button
   - View status button
   - Dashboard stats

5. **doctordashboard.tsx** - Doctor Dashboard
   - Top navigation with search
   - KPI cards (total, pending, in progress, completed)
   - Info banner about read-only access
   - Referrals awaiting decision section
   - Accept/Reject/View buttons
   - Decision dialog modal

### Medium Priority (Administrative)

6. **approval.tsx** - Account Approvals (Admin)
   - Header with search
   - Sidebar navigation
   - Filter tabs (pending, approved, rejected)
   - Practitioner approval table
   - Review button with modal
   - Approve/Reject actions

7. **reports.tsx** - Reports & Analytics
   - Sidebar navigation
   - Date range filters
   - KPI cards (total, coordinated, pending, uncoordinated)
   - Referral trends chart
   - Top referring hospitals list
   - Department distribution pie chart
   - Coordination analysis

8. **outpatient.tsx** - Outpatient Appointments
   - Sidebar navigation
   - Header with search
   - Active/Completed toggle
   - Appointment data table
   - Patient info with avatars
   - Mark as completed button
   - Appointment detail modal

### Lower Priority (Forms & Additional)

9. **referraledit.tsx** - Referral Form (Multi-step)
   - Stepper progress bar
   - Personal details section
   - Address information (PSGC API)
   - Vitals & clinical status
   - Medical documents upload
   - Navigation buttons

10. **referralview.tsx** - Referral View/Details
    - Similar to referral form but read-only
    - Display all referral information
    - Timeline of events
    - Status history

11. **referrerdashboard.tsx** - Referrer Dashboard
    - For external referrers
    - Referral submission form
    - Status tracking
    - History of referrals

## Implementation Pattern

Each page follows this structure:

```typescript
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { [Icons] from "lucide-react";

const PageComponent = () => {
  const [state, setState] = useState({...});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handlers
  const handleAction = () => {...};

  return (
    <div className="bg-background-light dark:bg-background-dark">
      {/* Header */}
      {/* Sidebar (if needed) */}
      {/* Main Content */}
      {/* Modals/Overlays */}
    </div>
  );
};

export default PageComponent;
```

## Design System Constants

- **Primary Color**: #1975d2
- **Background Light**: #f6f7f8
- **Background Dark**: #111921
- **Font**: Inter (sans-serif)
- **Border Radius**: 0.25rem (default), 0.5rem (lg), 0.75rem (xl)
- **Icons**: Material Symbols Outlined

## Key Components Used

- Sidebar navigation with active states
- Data tables with pagination
- Status badges (color-coded)
- Modal overlays
- Form inputs with validation
- Search and filter bars
- KPI cards with trends
- Charts and analytics

## Next Steps

1. Implement dashboard.tsx (most critical)
2. Implement incomingreferrals.tsx and activereferrals.tsx
3. Implement triagereferrals.tsx and doctordashboard.tsx
4. Implement admin pages (approval.tsx)
5. Implement reports.tsx and analytics
6. Implement outpatient.tsx
7. Implement referral form pages

## Notes

- All pages support dark mode
- Responsive design (mobile-first)
- Material Symbols icons for consistency
- Tailwind CSS for styling
- React hooks for state management
- API integration via authAPI and other services
