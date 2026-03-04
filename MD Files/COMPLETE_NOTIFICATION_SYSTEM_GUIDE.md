# Complete Notification System - Full Implementation Guide

## System Overview

The notification system now includes three layers:

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: REAL-TIME POP-UP NOTIFICATIONS                │
│ - Appear in top-right corner                            │
│ - Auto-dismiss after 8 seconds                          │
│ - Only appear once per notification                     │
│ - Modern gradient design                                │
│ - Sound alert (optional)                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 2: NOTIFICATION PANEL (FACEBOOK-STYLE)           │
│ - Click bell icon to open                               │
│ - Scrollable list of all notifications                  │
│ - Organized by type and timestamp                       │
│ - Clear all / See previous options                      │
│ - Click to navigate to details                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 3: NOTIFICATION HISTORY PAGE                      │
│ - View all previous notifications                       │
│ - Search and filter options                             │
│ - Archive/delete notifications                          │
│ - (Future enhancement)                                  │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. NotificationToast (Pop-up)
**File**: `SPMC/front-end/src/components/ui/NotificationToast.tsx`

**Purpose**: Individual pop-up notification
**Features**:
- Gradient background by type
- Emoji-based title
- Auto-dismiss (8 seconds)
- Smooth animations
- Dark mode support

**Lifecycle**:
```
Created → Fade in (300ms) → Visible (7.7s) → Fade out (300ms) → Removed
```

### 2. NotificationContainer
**File**: `SPMC/front-end/src/components/ui/NotificationContainer.tsx`

**Purpose**: Manages multiple pop-up notifications
**Features**:
- Stacks notifications vertically
- Plays sound for new notifications
- Prevents duplicates
- Handles cleanup

### 3. NotificationPanel (New)
**File**: `SPMC/front-end/src/components/ui/NotificationPanel.tsx`

**Purpose**: Facebook-style notification dropdown
**Features**:
- Scrollable list
- Color-coded by type
- Timestamps
- Clear all button
- View previous link
- Dark mode support

### 4. Notification Service
**File**: `SPMC/front-end/src/lib/notificationService.ts`

**Purpose**: Detects and triggers notifications
**Features**:
- Polls every 5 seconds
- Detects new referrals, transfers, delays
- Prevents duplicate pop-ups
- Tracks shown notifications

### 5. DashboardLayout
**File**: `SPMC/front-end/src/components/layout/DashboardLayout.tsx`

**Purpose**: Integrates all notification components
**Features**:
- Bell icon in header
- Notification count badge
- Pop-up container
- Notification panel
- Click handlers

## Data Flow

```
Backend (Django)
    ↓
API (/api/referrals/)
    ↓
Notification Service (polls every 5s)
    ↓
Duplicate Check (shownNotificationIds Set)
    ↓
├─→ Pop-up (NotificationToast)
│   └─→ Auto-dismiss after 8s
│
└─→ Panel (NotificationPanel)
    └─→ Stays until user clears
```

## Notification Types

### 1. New Referral (🆕 Blue)
**Trigger**: New pending referral created
**Audience**: EDCC staff
**Message**: "New referral from [Hospital]: [Patient]"

### 2. Referral Transfer (✓ Green)
**Trigger**: Referral transferred to triage
**Audience**: Triage staff
**Message**: "New referral transferred by EDCC: [Patient]"

### 3. Delay Transfer (✓ Green)
**Trigger**: Referrer reports transfer delay
**Audience**: Triage staff
**Message**: "Transfer delayed for [Patient]: [Reason]"

### 4. Account Approval (👤 Purple)
**Trigger**: New account registration
**Audience**: Admin staff
**Message**: "New [Type] registration: [Name]"

## Duplicate Prevention Mechanism

### How It Works
```
1. Notification detected
   ↓
2. Generate unique ID
   - Format: `{type}_{referral_id}_{timestamp}`
   - Example: `delay_transfer_123_2026-03-04T10:30:00Z`
   ↓
3. Check shownNotificationIds Set
   ↓
4. If NOT in set:
   - Add to set
   - Trigger pop-up callback
   - Add to panel list
   ↓
5. If in set:
   - Skip (already shown)
```

### Benefits
- ✅ Pop-ups appear only once
- ✅ Panel shows all notifications
- ✅ No duplicate pop-ups on refresh
- ✅ Automatic cleanup on logout
- ✅ Efficient tracking (Set-based)

## User Experience Flows

### Flow 1: Referrer Reports Delay
```
Referrer clicks "Delay Transfer"
    ↓
Enters delay reason
    ↓
Clicks "Notify EDCC/Triage"
    ↓
Success message shown
    ↓
Triage staff sees:
  1. Pop-up notification (appears once)
  2. Notification in panel
  3. Can click to view details
```

### Flow 2: Triage Staff Manages Notifications
```
Triage staff clicks bell icon
    ↓
Panel opens showing all notifications
    ↓
Options:
  - Click notification → Navigate to details
  - Click "Clear all" → Remove all
  - Click "See previous" → View history
  - Click X → Close panel
```

### Flow 3: Notification Click Navigation
```
User clicks notification
    ↓
System checks notification type
    ↓
If delay notification:
  - Navigate to /triage?viewDetails={id}
  - Auto-open details modal
  ↓
If other notification:
  - Open modal with details
```

## Styling & Theming

### Color Schemes
```
New Referral (Blue):
- Background: from-blue-50 to-blue-100
- Border: blue-300
- Icon: blue-600
- Text: blue-700

Referral Transfer (Green):
- Background: from-green-50 to-emerald-100
- Border: green-300
- Icon: green-600
- Text: green-700

Account Approval (Purple):
- Background: from-purple-50 to-pink-100
- Border: purple-300
- Icon: purple-600
- Text: purple-700
```

### Dark Mode
```
Light Mode:
- Background: white
- Text: gray-900
- Border: gray-200

Dark Mode:
- Background: gray-900
- Text: white
- Border: gray-700
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Polling Interval | 5 seconds |
| Pop-up Duration | 8 seconds |
| Animation Duration | 300ms |
| Panel Max Height | 600px |
| Notification Count Badge | Max 99 |
| Memory (tracking) | Minimal (Set-based) |

## Accessibility

✅ **Keyboard Navigation**
- Tab to bell icon
- Enter to open/close panel
- Tab through notifications
- Escape to close panel

✅ **Screen Readers**
- Semantic HTML
- ARIA labels
- Descriptive text
- Timestamps

✅ **Color Contrast**
- WCAG AA compliant
- Readable in light/dark mode
- Color + icon differentiation

✅ **Focus Indicators**
- Visible focus rings
- Clear focus states
- Keyboard accessible

## Testing Checklist

### Pop-up Notifications
- [ ] Appear in top-right corner
- [ ] Show correct message
- [ ] Auto-dismiss after 8 seconds
- [ ] Only appear once per notification
- [ ] Sound plays (if enabled)
- [ ] Smooth animations
- [ ] Dark mode works

### Notification Panel
- [ ] Bell icon visible in header
- [ ] Badge shows correct count
- [ ] Panel opens on click
- [ ] Notifications listed correctly
- [ ] Timestamps display
- [ ] Color coding works
- [ ] Clear all button works
- [ ] See previous link works
- [ ] Click notification navigates
- [ ] Dark mode works

### Duplicate Prevention
- [ ] Pop-up appears once
- [ ] Panel shows notification
- [ ] Refresh doesn't repeat pop-up
- [ ] Logout clears tracking
- [ ] Multiple notifications tracked separately

### Navigation
- [ ] Notification click navigates to triage
- [ ] Details modal opens automatically
- [ ] URL parameter handled correctly
- [ ] URL cleaned after navigation

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Latest version |
| Edge | ✅ Full | Latest version |
| Firefox | ✅ Full | Latest version |
| Safari | ✅ Full | Latest version |
| Mobile | ✅ Full | Responsive design |

## Future Enhancements

### Phase 2
- [ ] Notification history page
- [ ] Search notifications
- [ ] Filter by type
- [ ] Archive notifications

### Phase 3
- [ ] Email digest
- [ ] SMS alerts
- [ ] Notification preferences
- [ ] Do not disturb mode

### Phase 4
- [ ] Real-time WebSocket updates
- [ ] Notification categories
- [ ] Custom notification sounds
- [ ] Notification scheduling

## Troubleshooting

### Pop-ups Not Appearing
1. Check notification service is polling
2. Verify user has correct permissions
3. Check browser console for errors
4. Verify referral data has required fields

### Panel Not Opening
1. Check bell icon is visible
2. Verify showNotificationPanel state
3. Check for JavaScript errors
4. Verify NotificationPanel component loaded

### Duplicate Pop-ups
1. Check shownNotificationIds tracking
2. Verify notification IDs are unique
3. Check for page refresh issues
4. Verify logout clears tracking

### Dark Mode Issues
1. Check dark mode classes applied
2. Verify color contrast
3. Check for hardcoded colors
4. Verify Tailwind dark mode enabled

## Summary

The complete notification system provides:

1. **Real-time Pop-ups** - Immediate alerts with auto-dismiss
2. **Notification Panel** - Facebook-style management interface
3. **Duplicate Prevention** - Pop-ups appear only once
4. **Smart Navigation** - Click to view details
5. **Dark Mode** - Full support
6. **Accessibility** - WCAG AA compliant
7. **Performance** - Optimized polling and rendering
8. **Extensibility** - Ready for future enhancements

Users now have a modern, familiar notification experience similar to Facebook, with efficient duplicate prevention and easy notification management.
