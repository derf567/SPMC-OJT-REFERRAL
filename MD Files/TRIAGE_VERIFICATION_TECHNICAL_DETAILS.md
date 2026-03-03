# Triage Verification Workflow - Technical Details

## Architecture Overview

### Status Flow
The referral now goes through an additional status state:

```
pending
  ↓
in_triage
  ↓
waiting_acceptance (departments deciding)
  ↓
awaiting_triage_verification ← NEW STATUS
  ↓
dispositioned (ready for transit)
  ↓
in_transit
  ↓
completed/cancelled
```

## Database Changes

### New Fields in Referral Model
```python
triage_verified_by = ForeignKey(User, null=True, blank=True)
triage_verified_at = DateTimeField(null=True, blank=True)
triage_verification_notes = TextField(null=True, blank=True)
```

### Migration
- File: `SPMC/referrals/migrations/0024_add_triage_verification_workflow.py`
- Adds the three new fields
- Updates STATUS_CHOICES to include 'awaiting_triage_verification'

## Backend Logic

### Model Method: check_department_acceptance()
**Location**: `SPMC/referrals/models.py`

**Old Logic**:
```python
if accepted >= majority:
    self.status = 'dispositioned'  # Directly to dispositioned
```

**New Logic**:
```python
if accepted >= majority:
    self.status = 'awaiting_triage_verification'  # Wait for triage verification
```

### New Endpoint: approve_for_transit
**Location**: `SPMC/referrals/views.py`

**URL**: `/api/referrals/{id}/approve_for_transit/`
**Method**: POST
**Authentication**: Required (Token)

**Request Body**:
```json
{
  "verification_notes": "Optional notes from triage/EDCC"
}
```

**Response**:
```json
{
  "message": "Referral approved for transit. Referrer will be notified to fill transit form.",
  "referral_status": "dispositioned",
  "triage_verified_at": "2026-03-03T10:30:00Z",
  "triage_verified_by": "John Doe"
}
```

**Validation**:
1. Referral must be in 'awaiting_triage_verification' status
2. User must have role 'edcc_personnel' or 'call_triage'
3. Creates ReferralStatusHistory entry

**Side Effects**:
- Updates referral status to 'dispositioned'
- Records triage_verified_by and triage_verified_at
- Stores verification notes
- Creates status history entry

## Frontend Implementation

### API Method
**Location**: `SPMC/front-end/src/lib/api.ts`

```typescript
approveForTransit: async (id: string, verificationNotes?: string) => {
  return apiRequest(`/referrals/${id}/approve_for_transit/`, {
    method: 'POST',
    body: JSON.stringify({ verification_notes: verificationNotes || '' }),
  });
}
```

### Component: TriageReferrals
**Location**: `SPMC/front-end/src/pages/TriageReferrals.tsx`

**New State**:
```typescript
const [showApproveForTransitDialog, setShowApproveForTransitDialog] = useState(false);
```

**New Handler**:
```typescript
const handleApproveForTransit = (referral: TriageReferral) => {
  setSelectedReferral(referral);
  setShowApproveForTransitDialog(true);
};
```

**Updated Status Badge**:
```typescript
awaiting_triage_verification: { 
  bg: 'bg-orange-100', 
  text: 'text-orange-800', 
  label: 'Awaiting Verification' 
}
```

**Updated Action Buttons**:
- When status === 'awaiting_triage_verification':
  - Show "View Status" button
  - Show "Approve for Transit" button

### Component: ApproveForTransitDialog
**Location**: `SPMC/front-end/src/pages/TriageReferrals.tsx` (at end)

**Props**:
```typescript
{
  referral: TriageReferral;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features**:
- Displays referral and patient information
- Shows department acceptance summary (total, accepted, rejected, pending)
- Lists all departments that accepted
- Text area for verification notes
- Submit button that calls `referralsAPI.approveForTransit()`
- Error handling with toast notifications
- Loading state during submission

## Data Flow

### When Departments Accept (Majority)
```
1. Doctor clicks "Accept" in DoctorDashboard
2. departmentDecision endpoint called
3. DepartmentAcceptance.accept() called
4. check_department_acceptance() called
5. Majority rule checked
6. If majority accepted:
   - Referral.status = 'awaiting_triage_verification'
   - Referral.save()
7. Triage/EDCC sees referral in "Awaiting Verification" status
```

### When Triage/EDCC Approves
```
1. Triage/EDCC clicks "Approve for Transit"
2. ApproveForTransitDialog opens
3. Triage/EDCC adds optional notes
4. Clicks "Approve for Transit" button
5. approveForTransit API called
6. Backend validates:
   - Status is 'awaiting_triage_verification'
   - User is triage/EDCC
7. Updates referral:
   - status = 'dispositioned'
   - triage_verified_by = current user
   - triage_verified_at = now
   - triage_verification_notes = notes
8. Creates ReferralStatusHistory entry
9. Returns success response
10. Frontend refreshes referral list
11. Referrer is notified to fill transit form
```

## Serializer Changes

### ReferralSerializer
**Location**: `SPMC/referrals/serializers.py`

**New Fields**:
```python
triage_verified_by_name = serializers.CharField(
  source='triage_verified_by.get_full_name', 
  read_only=True
)
triage_verified_at  # Already in fields list
triage_verification_notes  # Already in fields list
```

## Security Considerations

1. **Role-Based Access**: Only users with 'edcc_personnel' or 'call_triage' role can approve
2. **Status Validation**: Can only approve referrals in 'awaiting_triage_verification' status
3. **Audit Trail**: All approvals are recorded with user and timestamp
4. **Token Authentication**: All API calls require valid authentication token

## Performance Considerations

1. **Status Filtering**: New status can be filtered in TriageReferrals page
2. **Auto-Refresh**: Dialog auto-refreshes every 5 seconds to show latest status
3. **Lazy Loading**: Department details only loaded when dialog opens
4. **Efficient Queries**: Uses select_related and prefetch_related where applicable

## Testing Scenarios

### Scenario 1: Happy Path
1. Create referral with 3 departments
2. 2 departments accept (majority)
3. Verify status is 'awaiting_triage_verification'
4. Triage/EDCC approves with notes
5. Verify status is 'dispositioned'
6. Verify triage_verified_by and triage_verified_at are set
7. Verify status history entry created

### Scenario 2: Permission Check
1. Create referral and get to 'awaiting_triage_verification'
2. Try to approve as non-triage user
3. Verify 403 Forbidden error

### Scenario 3: Status Validation
1. Create referral in 'dispositioned' status
2. Try to call approve_for_transit
3. Verify 400 Bad Request error

### Scenario 4: Verification Notes
1. Approve referral with verification notes
2. Verify notes are stored in triage_verification_notes
3. Verify notes appear in referral details

## Future Enhancements

1. **Notifications**: Send SMS/Email to triage/EDCC when referral is ready for verification
2. **Timeout**: Auto-escalate if triage doesn't approve within X hours
3. **Bulk Approval**: Allow approving multiple referrals at once
4. **Verification History**: Track multiple verification attempts
5. **Department Feedback**: Allow departments to add feedback during acceptance
