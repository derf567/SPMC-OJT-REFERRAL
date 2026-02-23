# Testing New Hospital Fields - Quick Guide

## ✅ Backend Verification Complete

The test script confirmed that all new fields are working correctly in the backend:
- `hospital_doh_level` ✅
- `hospital_location` ✅  
- `hospital_contact_numbers` ✅
- `vital_signs_time` ✅

## 🔍 Why Old Referrals Don't Show New Fields

**Important:** Old referrals (created before the new fields were added) will NOT have this data because:
1. They were created before the database migrations added these fields
2. The default values for these fields are `NULL` or empty arrays
3. The data doesn't exist in the database for old records

## ✨ How to See the New Fields

### Step 1: Submit a NEW Referral
1. Go to the External Referral form
2. Fill in ALL the new fields:
   - **DOH Level**: Select Primary, Secondary, or Tertiary
   - **Hospital Location**: Select a Mindanao location (e.g., Davao City, Surigao del Norte)
   - **Hospital Contact Numbers**: Add at least one contact number
   - **Time Taken** (in Vital Signs): Enter the time vital signs were taken

### Step 2: View the Referral Details
1. Go to the Queue/Dashboard
2. Click on the newly created referral
3. The Referral Details modal will show:
   - ✅ DOH Level in the Referring Hospital section
   - ✅ Hospital Location in the Referring Hospital section
   - ✅ Hospital Contact Numbers as blue badges
   - ✅ Time Taken in the Vital Signs section

## 📋 Checklist for Testing

- [ ] Create a NEW referral through the form
- [ ] Fill in DOH Level (required)
- [ ] Fill in Hospital Location (required)
- [ ] Add at least one Hospital Contact Number (required)
- [ ] Fill in Time Taken for vital signs (required)
- [ ] Submit the referral
- [ ] View the referral details
- [ ] Verify all new fields are displayed

## 🐛 Troubleshooting

### If fields still don't show:

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for the console log: "Submitting data:"
   - Verify the new fields are in the data being sent

2. **Check Backend Logs**
   - Look for: "Creating referral with data:"
   - Verify the new fields are being received

3. **Verify Form Validation**
   - Make sure all required fields are filled
   - Check for validation error messages

4. **Check API Response**
   - In Network tab, check the response from the referral creation
   - Verify the response includes the new fields

## 📊 Test Data Created

A test referral was created with ID: `REF-20260223-003`

This referral has all the new fields populated:
- Hospital DOH Level: Tertiary
- Hospital Location: Davao City
- Hospital Contact Numbers: ["0912-345-6789", "0923-456-7890"]
- Vital Signs Time: 14:30:00

You can view this referral to see how the new fields display.

## ✅ Confirmation

The backend is working correctly. The new fields will appear for:
- ✅ All NEW referrals submitted after this update
- ❌ Old referrals (they don't have this data)

**Solution:** Submit a new referral with all fields filled in to see the new fields in action!
