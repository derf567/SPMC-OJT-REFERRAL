# Notification System - Complete Flow Diagram

## User Journey: From Notification to Action

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGERED                        │
│                                                                   │
│  Backend detects event (new referral, status change, etc.)      │
│  → Sends notification to frontend                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POP-UP APPEARS                                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🆕 New Referral                                          │   │
│  │ Patient: John Doe, Age: 45, Chief Complaint: Chest pain │   │
│  │ ID: REF-20260304-001                                     │   │
│  │ → Click to view details                                  │   │
│  │                                                    [X]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Auto-dismisses after 8 seconds                                 │
│  Notification added to panel                                    │
│  Count badge updates (e.g., "1")                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │          │
                    ▼          ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  CLICK X BUTTON  │  │ CLICK NOTIFICATION
        │                  │  │
        │ Pop-up closes    │  │ Marks as read
        │ Notification     │  │ Glow disappears
        │ stays in panel   │  │ Navigates to Triage
        │ Count persists   │  │ Opens modal
        │                  │  │ Count decreases
        └────────┬─────────┘  └────────┬─────────┘
                 │                     │
                 ▼                     ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ NOTIFICATION     │  │ TRIAGE PAGE      │
        │ PANEL            │  │                  │
        │                  │  │ Department       │
        │ [Bell] 1         │  │ Acceptance       │
        │ ┌──────────────┐ │  │ Status Modal     │
        │ │ Notification │ │  │                  │
        │ │ (unread)     │ │  │ [Close] [Redirect]
        │ └──────────────┘ │  │                  │
        │                  │  │ User can:        │
        │ [Load more]      │  │ - View details   │
        │ [Clear all]      │  │ - Close modal    │
        │                  │  │ - Redirect       │
        └──────────────────┘  └────────┬─────────┘
                                       │
                                  ┌────┴────┐
                                  │          │
                                  ▼          ▼
                        ┌──────────────────┐  ┌──────────────────┐
                        │ CLOSE MODAL      │  │ REDIRECT         │
                        │                  │  │                  │
                        │ Modal closes     │  │ Opens Assign     │
                        │ Stays closed     │  │ Departments      │
                        │ No reopen        │  │ Dialog           │
                        │                  │  │                  │
                        │ User can:        │  │ User can:        │
                        │ - View panel     │  │ - Assign depts   │
                        │ - Click other    │  │ - Add remarks    │
                        │   notifications  │  │ - Submit         │
                        └──────────────────┘  └──────────────────┘
```

## Notification Panel States

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION PANEL                            │
├─────────────────────────────────────────────────────────────────┤
│ [Bell] Notifications                                        [X]  │
├─────────────────────────────────────────────────────────────────┤
│ Filter by date: [All ▼]                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ UNREAD NOTIFICATIONS (with glow effect):                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🆕 New Referral                                    [● blue] │ │
│ │ Patient: John Doe, Age: 45                                 │ │
│ │ ID: REF-20260304-001                                       │ │
│ │ Mar 4, 2026 10:30 AM                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ READ NOTIFICATIONS (no glow):                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Referral Transferred                                      │ │
│ │ Referral REF-20260303-001 transferred to EDCC              │ │
│ │ ID: REF-20260303-001                                       │ │
│ │ Mar 3, 2026 02:15 PM                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [Load more notifications]                                        │
│ [Clear all]                                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Backend to Frontend

```
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND                                    │
│                                                                   │
│  Event Detected:                                                 │
│  - New referral assigned                                         │
│  - Department accepted/rejected                                  │
│  - Account approved/rejected                                     │
│  - Transfer delay reported                                       │
│                                                                   │
│  → Create Notification object                                    │
│  → Send via WebSocket/Polling                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND                                     │
│                                                                   │
│  notificationService.ts:                                         │
│  - Receives notification                                         │
│  - Checks for duplicates                                         │
│  - Saves to localStorage                                         │
│  - Triggers pop-up callback                                      │
│                                                                   │
│  NotificationContainer.tsx:                                      │
│  - Renders pop-up (NotificationToast)                           │
│  - Auto-dismisses after 8 seconds                               │
│                                                                   │
│  NotificationPanel.tsx:                                          │
│  - Displays in persistent panel                                  │
│  - Shows read/unread status                                      │
│  - Handles pagination                                            │
│  - Filters by date                                               │
│                                                                   │
│  localStorage:                                                   │
│  - Stores all notifications                                      │
│  - Stores read status                                            │
│  - Persists across sessions                                      │
└──────────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION RECEIVED                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  notificationService.ts                                          │
│  - Check if already shown (shownNotificationIds)                │
│  - Save to localStorage (spmc_notifications)                    │
│  - Call onNotification callback                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  NotificationContainer.tsx                                       │
│  - Add to notifications state                                   │
│  - Render NotificationToast                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  NotificationToast.tsx                                           │
│  - Fade in (300ms)                                              │
│  - Display for 7.7 seconds                                      │
│  - Fade out (300ms)                                             │
│  - Call onClose callback                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  NotificationPanel.tsx                                           │
│  - Load from localStorage                                       │
│  - Display in persistent list                                   │
│  - Show unread indicator                                        │
│  - Handle click to mark as read                                 │
│  - Navigate on click                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Modal Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              NOTIFICATION CLICK                                   │
│                                                                   │
│  User clicks notification in panel                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  NotificationPanel.tsx                                           │
│  - Mark as read (localStorage)                                  │
│  - Call onNotificationClick callback                            │
│  - Pass referralId and type                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  DashboardLayout.tsx                                             │
│  - Navigate to /triage?viewDetails={referralId}                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  TriageReferrals.tsx                                             │
│  - useEffect detects viewDetails parameter                      │
│  - Finds referral in list                                       │
│  - REMOVES URL parameter (prevents reopen)                      │
│  - Sets hasProcessedViewDetails flag                            │
│  - Opens DetailsDialog modal                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  DetailsDialog.tsx                                               │
│  - Shows Department Acceptance Status                           │
│  - User can Close or Redirect                                   │
│                                                                   │
│  On Close:                                                       │
│  - Modal closes                                                 │
│  - Resets hasProcessedViewDetails flag                          │
│  - Modal stays closed (no reopen)                               │
│                                                                   │
│  On Redirect:                                                    │
│  - Modal closes                                                 │
│  - Opens Assign Departments dialog                              │
│  - Resets hasProcessedViewDetails flag                          │
└─────────────────────────────────────────────────────────────────┘
```

## Storage Structure

```
localStorage:
{
  "spmc_notifications": [
    {
      "id": "notif_1234567890",
      "type": "new_referral",
      "message": "New referral assigned: John Doe",
      "referralId": "REF-20260304-001",
      "timestamp": "2026-03-04T10:30:00Z"
    },
    {
      "id": "notif_1234567891",
      "type": "referral_transferred",
      "message": "Referral transferred to EDCC",
      "referralId": "REF-20260303-001",
      "timestamp": "2026-03-03T14:15:00Z"
    }
  ],
  "notification_read_notif_1234567890": "true",
  "notification_read_at_notif_1234567890": "2026-03-04T10:35:00Z",
  "notification_read_notif_1234567891": "false"
}
```

## Key Features Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION FEATURES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ✓ Pop-up Notifications                                          │
│   - Appear once when triggered                                  │
│   - Auto-dismiss after 8 seconds                                │
│   - Smooth fade in/out animations                               │
│                                                                   │
│ ✓ Persistent Panel                                              │
│   - Shows all notifications                                     │
│   - Survives page refresh                                       │
│   - Survives browser restart                                    │
│   - Up to 100 notifications stored                              │
│                                                                   │
│ ✓ Read/Unread Status                                            │
│   - Blue dot indicator on unread                                │
│   - Glow effect (blue border + pulse)                           │
│   - Disappears when clicked                                     │
│   - Stored in localStorage                                      │
│                                                                   │
│ ✓ Smart Pagination                                              │
│   - Shows 10 notifications per page                             │
│   - Load more button only when > 10                             │
│   - Loads inline without page redirect                          │
│                                                                   │
│ ✓ Date Filtering                                                │
│   - Filter by: All, Today, Yesterday, This Month                │
│   - Dropdown in panel header                                    │
│   - Maintains selection during session                          │
│                                                                   │
│ ✓ Modal Navigation                                              │
│   - Opens referral details modal                                │
│   - Closes properly without reopening                           │
│   - Can be opened manually again                                │
│                                                                   │
│ ✓ Count Badge                                                   │
│   - Shows unread notification count                             │
│   - Updates when notifications are read                         │
│   - Persists across sessions                                    │
│                                                                   │
│ ✓ Clear All Function                                            │
│   - Removes all notifications                                   │
│   - Clears localStorage                                         │
│   - Resets count badge                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**Status**: ✅ COMPLETE
**All Features**: ✅ IMPLEMENTED
**Quality**: ✅ PRODUCTION READY
