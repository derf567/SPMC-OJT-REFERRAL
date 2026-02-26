# Triage Multiple Departments & Remarks Update

## Summary
Updated the triage "Accept & Apply Decision" functionality to allow selecting multiple departments and made the remarks field more prominent at the bottom of the modal.

## Changes Made

### Backend Changes

1. **Model Update** (`SPMC/referrals/models.py`)
   - Added new `assigned_departments` JSONField to store multiple department assignments
   - Kept the original `assigned_department` field for backward compatibility

2. **API Update** (`SPMC/referrals/views.py`)
   - Modified `accept_with_triage_decision` endpoint to:
     - Accept `assigned_departments` array parameter
     - Validate that at least one department is selected
     - Save multiple departments to the new field
     - Include department names in status history

3. **Serializer Update** (`SPMC/referrals/serializers.py`)
   - Added `assigned_departments` to the serializer fields

4. **Migration** (`SPMC/referrals/migrations/0014_add_assigned_departments.py`)
   - Created migration to add the new `assigned_departments` field

### Frontend Changes

1. **API Client** (`SPMC/front-end/src/lib/api.ts`)
   - Updated `acceptWithTriageDecision` function to accept `assignedDepartments` array parameter

2. **ReferralTable Component** (`SPMC/front-end/src/components/dashboard/ReferralTable.tsx`)
   - Added `selectedDepartments` state to track multiple department selections
   - Replaced single department dropdown with checkbox-based multi-select
   - Shows selected departments as badges below the checkbox list
   - Moved remarks/notes field to the bottom with prominent yellow styling
   - Made remarks field larger (4 rows) with better labeling
   - Updated validation to require at least one department
   - Updated button disable logic to check for selected departments array

## UI Changes

### Department Selection
- **Before**: Single dropdown selection
- **After**: Checkbox list allowing multiple selections with visual badges showing selected departments

### Remarks Field
- **Before**: Small optional textarea in the middle of the form
- **After**: Prominent yellow-highlighted section at the bottom with:
  - 📝 Icon and bold label
  - Larger textarea (4 rows)
  - Clear description that remarks are visible to all departments
  - Yellow border to draw attention

## How to Use

1. **Run Migration**
   ```bash
   cd SPMC
   python manage.py migrate
   ```

2. **Test the Feature**
   - Login as triage user (edmar)
   - Go to a referral in "waiting" status
   - Click "Accept Referral"
   - Select multiple departments using checkboxes
   - Add remarks in the prominent yellow section at the bottom
   - Click "Accept & Apply Decision"

## Database Schema

```python
# New field in Referral model
assigned_departments = models.JSONField(
    default=list,
    blank=True,
    help_text="Multiple departments assigned by triage team"
)
```

Example data:
```json
{
  "assigned_departments": ["emergency", "cardiology", "radiology"]
}
```

## Notes

- The original `assigned_department` field is kept for backward compatibility
- Multiple departments are stored as a JSON array
- All selected departments are shown in the status history
- Remarks are now more visible and prominent for better documentation
