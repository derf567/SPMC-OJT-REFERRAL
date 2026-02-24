# Admin Portal Access Instructions

## Admin User Credentials

To access the Admin Portal, you need to log in with admin credentials:

**Username:** `admin`  
**Password:** `admin123`

## How to Access Admin Portal

1. **Logout** from your current account (if logged in)
2. Go to the **Login page** at `http://localhost:3001/login`
3. Enter the admin credentials:
   - Username: `admin`
   - Password: `admin123`
4. Click **Login**
5. You will be automatically redirected to `/admin/dashboard`

## Admin Portal Features

Once logged in as admin, you have access to:

- **Dashboard** - View statistics and pending referrer registrations
- **Account Approval** - Review, approve, or reject referrer account registrations (ADMIN ONLY)
- **Heads Up** - Manage doctors and assign specialties by department (ADMIN ONLY)
- **Reports** - View system reports and analytics

## Important: Admin-Only Access

**ONLY ADMIN users** have authority to:
- ✅ Approve or reject incoming referrer registrations
- ✅ Manage doctor specialties
- ✅ Access the admin dashboard

**EDMAR/EDHO (Triage) users** do NOT have access to:
- ❌ Account approval functionality
- ❌ Admin dashboard
- ❌ Heads Up (doctor management)

This ensures proper separation of duties and security.

## Creating Additional Admin Users

If you need to create more admin users, run:

```bash
cd SPMC-OJT-REFERRAL/SPMC
python manage.py create_admin
```

This will create or update the admin user with the credentials above.

## Troubleshooting

### 403 Forbidden Error
If you see a 403 error when accessing admin pages:
1. Make sure you're logged in with admin credentials
2. Check that your user has `role: 'admin'` in their profile
3. Verify the user is a superuser

### User Not Redirecting to Admin Dashboard
If admin users are not redirected to `/admin/dashboard`:
1. Clear browser cache and cookies
2. Log out and log back in
3. Check browser console for errors

## Security Note

**IMPORTANT:** Change the default admin password in production!

To change the password:
1. Log in as admin
2. Use Django admin panel at `http://localhost:8000/admin`
3. Or use Django shell:
   ```bash
   python manage.py shell
   >>> from django.contrib.auth.models import User
   >>> user = User.objects.get(username='admin')
   >>> user.set_password('your_new_secure_password')
   >>> user.save()
   ```
