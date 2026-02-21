# How to Clear Referral Data (Keep User Accounts)

This guide shows you how to clear referral data from the database while keeping all user accounts intact.

## Why Clear Data?

- 🧪 **Testing**: Start fresh for testing workflows
- 🔄 **Reset**: Clear old test data before production
- 🧹 **Cleanup**: Remove specific referrals (e.g., completed ones)

## What Gets Deleted vs Preserved

### ✅ PRESERVED (Not Deleted)
- 👥 User accounts (all users)
- 🔐 User profiles and permissions
- 🏥 Hospitals
- 🩺 Specialties
- 👨‍⚕️ Referrer accounts (but their documents will be deleted)

### 🗑️ DELETED
- 📋 All referrals
- 🚑 Transit information
- 📊 Status history
- 📎 Referral documents
- 📄 Referrer documents

## Usage

### Step 1: Check What Will Be Deleted

First, see what data exists:

```bash
cd SPMC
python clear_referral_data.py --check
```

This shows:
- How many referrals exist
- Breakdown by status (pending, waiting, completed, etc.)
- Related data counts
- User accounts (which will be preserved)

### Step 2: Clear Data (Choose One Option)

#### Option A: Clear ALL Referral Data

```bash
python clear_referral_data.py --clear
```

This will:
1. Show you what will be deleted
2. Ask for confirmation (type `DELETE ALL`)
3. Delete all referral data
4. Keep all user accounts

#### Option B: Clear Specific Status Only

Clear only completed referrals:
```bash
python clear_referral_data.py --status completed
```

Clear multiple statuses:
```bash
python clear_referral_data.py --status completed,cancelled
```

Valid statuses:
- `pending`
- `waiting`
- `in_transit`
- `emergent`
- `urgent`
- `schedule_opd`
- `completed`
- `cancelled`

## Examples

### Example 1: Clear All Test Data

```bash
# Check what exists
python clear_referral_data.py --check

# Clear everything
python clear_referral_data.py --clear
# Type: DELETE ALL
```

### Example 2: Clear Only Completed Referrals

```bash
# Clear completed referrals only
python clear_referral_data.py --status completed
# Type: yes
```

### Example 3: Clear Archived Referrals

```bash
# Clear both completed and cancelled
python clear_referral_data.py --status completed,cancelled
# Type: yes
```

## Sample Output

### Check Command
```
================================================================================
DATABASE DATA CHECK
================================================================================

👥 USER ACCOUNTS (will be preserved):
   Total users: 5
   - Superusers: 1
   - Staff users: 2
   - Regular users: 2

🗑️  REFERRAL DATA (will be deleted):
   Total referrals: 15
   - Pending: 2
   - Waiting: 3
   - Emergent: 1
   - Urgent: 2
   - Schedule OPD: 1
   - In Transit: 1
   - Completed: 4
   - Cancelled: 1

📋 RELATED DATA (will be deleted):
   Transit info records: 5
   Status history records: 45
   Referral documents: 8
   Referrer documents: 3

================================================================================
```

### Clear Command
```
================================================================================
CLEARING REFERRAL DATA
================================================================================

✅ Deleted 8 referral documents
✅ Deleted 3 referrer documents
✅ Deleted 45 status history records
✅ Deleted 5 transit info records
✅ Deleted 15 referrals

================================================================================
✅ ALL REFERRAL DATA CLEARED!
================================================================================

👥 User accounts have been preserved.
   Total users remaining: 5
```

## After Clearing Data

### What You Can Do:
1. ✅ Log in with existing accounts
2. ✅ Create new referrals
3. ✅ Test workflows from scratch
4. ✅ All users and permissions still work

### What You Need to Do:
- 🔄 Refresh your browser
- 🔄 The Active Referrals page will be empty
- 🔄 The Archived Referrals page will be empty
- ✅ You can start creating new referrals

## Safety Features

### Confirmation Required
- For `--clear`: Must type `DELETE ALL` exactly
- For `--status`: Must type `yes` to confirm
- For `--check`: No confirmation needed (read-only)

### No Accidental Deletion
- User accounts are NEVER deleted
- Hospitals and specialties are preserved
- Must explicitly confirm before deletion

## Troubleshooting

### "No referral data found"
✅ Database is already clean, nothing to delete.

### "Invalid status"
❌ Check the status name spelling. Valid statuses are listed above.

### Permission Denied
❌ Make sure you're in the SPMC directory and Django is set up correctly.

## Quick Reference

```bash
# Check data
python clear_referral_data.py --check

# Clear all
python clear_referral_data.py --clear

# Clear specific status
python clear_referral_data.py --status completed

# Clear multiple statuses
python clear_referral_data.py --status completed,cancelled,pending
```

## Important Notes

⚠️ **This operation cannot be undone!**
- Always run `--check` first to see what will be deleted
- Make a database backup if you're unsure
- User accounts are safe and will not be deleted

✅ **Safe for Testing**
- Perfect for resetting test environments
- Keeps all user accounts and permissions
- Can be run multiple times safely

🔄 **After Clearing**
- Refresh your browser
- All pages will show empty lists
- You can immediately start creating new referrals
- All workflows will work normally
