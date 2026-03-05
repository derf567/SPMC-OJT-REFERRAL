# Main Service vs Co-Manage Implementation

## Overview
Implemented the main service vs co-manage business logic for the triage referral system. The main service is the primary department handling the referral, and its decision overrides all co-manage departments.

## Business Logic

### Main Service
- **Definition**: The primary/main department assigned to handle the referral
- **Authority**: Final decision maker for the referral
- **Constraint**: Only 1 main service per referral
- **Decision Impact**: If main service accepts → referral is accepted (regardless of co-manage decisions)

### Co-Manage
- **Definition**: Supporting/assisting departments
- **Authority**: No final authority
- **Constraint**: Multiple co-manage departments can be selected
- **Decision Impact**: Their decisions don't affect overall referral status if main service accepts

### Decision Rules
1. **If main service accepts** → Referral moves to `awaiting_triage_verification` (ACCEPTED)
2. **If main service rejects** → Referral stays in `pending` (REJECTED)
3. **If main service is pending** → Wait for main service decision (co-manage decisions don't matter)

## Database Changes

### New Fields

#### Referral Model
- `main_service_code` (CharField): Stores the code of the main service department

#### DepartmentAcceptance Model
- `is_main_service` (BooleanField): Marks if this department is the main service

### Migration
- File: `SPMC/referrals/migrations/0030_main_service_logic.py`
- Adds both new fields to the database

## Backend Changes

### Models (SPMC/referrals/models.py)

#### Updated `check_department_acceptance()` method
```python
def check_department_acceptance(self):
    """Check if main service has accepted and update status accordingly"""
    # Gets main service acceptance record
    # If main service accepted → status = 'awaiting_triage_verification'
    # If main service rejected → status = 'pending'
    # If main service pending → keep current status
    # Fallback to majority rule if no main service designated
```

### API Endpoints (SPMC/referrals/views.py)

#### Updated `assign_departments` endpoint
- **New Parameter**: `main_service_code` (required)
- **Validation**: 
  - Main service must be one of the selected departments
  - Only 1 main service allowed
- **Behavior**: Creates DepartmentAcceptance records with `is_main_service=True` for the main service

## Frontend Changes

### TriageReferrals.tsx

#### AssignDepartmentsDialog Component
- **New State**: `mainServiceCode` to track selected main service
- **New UI Section**: "Select Main Service" radio button group (appears after departments selected)
- **Validation**: Requires main service selection before submission
- **Updated API Call**: Passes `mainServiceCode` to backend

#### DetailsDialog Component
- **Visual Indicator**: Main service departments highlighted with purple background
- **Badge**: "Main Service" badge displayed on main service department
- **Status Display**: Shows which department is the main service

### API Client (SPMC/front-end/src/lib/api.ts)

#### Updated `assignDepartments` method
```typescript
assignDepartments: async (
  id: string, 
  departments: string[], 
  mainServiceCode: string,  // NEW
  remarks?: string, 
  triageDecision?: string, 
  scheduledDate?: string, 
  scheduledTime?: string
)
```

## User Interface Changes

### Assign Departments Dialog
1. **Step 1**: Select departments (checkboxes) - can select multiple
2. **Step 2**: Select main service (radio buttons) - only from selected departments
3. **Step 3**: Select triage decision (Emergent/Urgent/Schedule OPD)
4. **Step 4**: Add remarks and schedule if needed

### Department Status View
- Main service departments are highlighted in purple
- "Main Service" badge clearly identifies the primary department
- Status shows acceptance/rejection for each department
- Main service decision determines overall referral status

## Workflow Example

### Scenario: Referral assigned to 3 departments
1. **Departments Selected**: Cardiology, Internal Medicine, Emergency
2. **Main Service**: Cardiology (selected as primary)
3. **Co-Manage**: Internal Medicine, Emergency (supporting)

### Outcomes:
- **If Cardiology accepts**: Referral → `awaiting_triage_verification` ✅
- **If Cardiology rejects**: Referral → `pending` (stays rejected) ❌
- **If Internal Medicine accepts but Cardiology pending**: Wait for Cardiology ⏳
- **If Emergency rejects but Cardiology accepts**: Referral still accepted ✅

## Testing Checklist

- [ ] Can select multiple departments
- [ ] Main service selection is required
- [ ] Main service must be from selected departments
- [ ] Main service acceptance moves referral to verification
- [ ] Main service rejection keeps referral pending
- [ ] Co-manage decisions don't override main service
- [ ] Main service badge displays correctly
- [ ] Purple highlighting shows on main service department
- [ ] Triage decision still works with main service logic
- [ ] OPD scheduling works with main service logic

## Files Modified

1. **Backend**:
   - `SPMC/referrals/models.py` - Added fields and updated logic
   - `SPMC/referrals/views.py` - Updated assign_departments endpoint
   - `SPMC/referrals/serializers.py` - Already includes all fields
   - `SPMC/referrals/migrations/0030_main_service_logic.py` - New migration

2. **Frontend**:
   - `SPMC/front-end/src/pages/TriageReferrals.tsx` - Updated dialogs
   - `SPMC/front-end/src/lib/api.ts` - Updated API call

## Next Steps

1. Run migrations: `python manage.py migrate`
2. Test the assign departments dialog
3. Verify main service logic in department decisions
4. Test all triage decision types with main service
5. Verify co-manage departments don't affect final status
