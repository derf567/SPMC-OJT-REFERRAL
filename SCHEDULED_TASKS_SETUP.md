# Scheduled Tasks Setup Guide

This guide explains how to set up automated tasks for the SPMC Referral System to maintain workflow alignment.

---

## Tasks to Schedule

### 1. Expire Old Referrals
**Command:** `python manage.py expire_old_referrals`  
**Frequency:** Every hour  
**Purpose:** Auto-cancel pending referrals not processed within 24 hours

### 2. Mark Did Not Arrive
**Command:** `python manage.py mark_did_not_arrive`  
**Frequency:** Every hour  
**Purpose:** Mark in-transit referrals as cancelled if patient doesn't arrive within 24 hours

---

## Windows Setup (Task Scheduler)

### Step 1: Create Batch Files

Create two batch files in your SPMC directory:

**File: `expire_referrals.bat`**
```batch
@echo off
cd /d "C:\Users\HP\Documents\SPMC OJT\SPMC-OJT-REFERRAL\SPMC"
python manage.py expire_old_referrals >> logs\expire_referrals.log 2>&1
```

**File: `mark_did_not_arrive.bat`**
```batch
@echo off
cd /d "C:\Users\HP\Documents\SPMC OJT\SPMC-OJT-REFERRAL\SPMC"
python manage.py mark_did_not_arrive >> logs\mark_did_not_arrive.log 2>&1
```

### Step 2: Create Logs Directory
```powershell
cd "C:\Users\HP\Documents\SPMC OJT\SPMC-OJT-REFERRAL\SPMC"
mkdir logs
```

### Step 3: Setup Task Scheduler

#### For Expire Old Referrals:

1. Open Task Scheduler (search "Task Scheduler" in Windows)
2. Click "Create Basic Task"
3. Name: "SPMC - Expire Old Referrals"
4. Description: "Auto-cancel pending referrals older than 24 hours"
5. Trigger: Daily
6. Start time: 00:00:00
7. Recur every: 1 day
8. Action: Start a program
9. Program/script: Browse to `expire_referrals.bat`
10. Click "Finish"
11. Right-click the task → Properties
12. Go to "Triggers" tab → Edit
13. Check "Repeat task every: 1 hour"
14. Duration: Indefinitely
15. Click OK

#### For Mark Did Not Arrive:

1. Repeat steps above but use:
   - Name: "SPMC - Mark Did Not Arrive"
   - Description: "Mark in-transit referrals as cancelled if patient doesn't arrive"
   - Program/script: Browse to `mark_did_not_arrive.bat`

### Step 4: Test the Tasks

Right-click each task → "Run" to test immediately.

Check the log files:
```powershell
type logs\expire_referrals.log
type logs\mark_did_not_arrive.log
```

---

## Linux Setup (Crontab)

### Step 1: Edit Crontab
```bash
crontab -e
```

### Step 2: Add Cron Jobs
```bash
# SPMC Referral System - Auto-expiration tasks
# Run every hour at minute 0

# Expire old referrals
0 * * * * cd /path/to/SPMC && /usr/bin/python3 manage.py expire_old_referrals >> /path/to/logs/expire_referrals.log 2>&1

# Mark did not arrive
0 * * * * cd /path/to/SPMC && /usr/bin/python3 manage.py mark_did_not_arrive >> /path/to/logs/mark_did_not_arrive.log 2>&1
```

### Step 3: Create Logs Directory
```bash
mkdir -p /path/to/SPMC/logs
```

### Step 4: Verify Crontab
```bash
crontab -l
```

### Step 5: Monitor Logs
```bash
tail -f /path/to/logs/expire_referrals.log
tail -f /path/to/logs/mark_did_not_arrive.log
```

---

## Production Deployment (Ubuntu Server)

### Using systemd timers (Recommended)

#### Step 1: Create Service Files

**File: `/etc/systemd/system/spmc-expire-referrals.service`**
```ini
[Unit]
Description=SPMC Expire Old Referrals
After=network.target

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/var/www/spmc
ExecStart=/usr/bin/python3 manage.py expire_old_referrals
StandardOutput=append:/var/log/spmc/expire_referrals.log
StandardError=append:/var/log/spmc/expire_referrals.log
```

**File: `/etc/systemd/system/spmc-expire-referrals.timer`**
```ini
[Unit]
Description=Run SPMC Expire Old Referrals every hour

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

**File: `/etc/systemd/system/spmc-mark-did-not-arrive.service`**
```ini
[Unit]
Description=SPMC Mark Did Not Arrive
After=network.target

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/var/www/spmc
ExecStart=/usr/bin/python3 manage.py mark_did_not_arrive
StandardOutput=append:/var/log/spmc/mark_did_not_arrive.log
StandardError=append:/var/log/spmc/mark_did_not_arrive.log
```

**File: `/etc/systemd/system/spmc-mark-did-not-arrive.timer`**
```ini
[Unit]
Description=Run SPMC Mark Did Not Arrive every hour

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

#### Step 2: Enable and Start Timers
```bash
# Create log directory
sudo mkdir -p /var/log/spmc
sudo chown www-data:www-data /var/log/spmc

# Reload systemd
sudo systemctl daemon-reload

# Enable timers
sudo systemctl enable spmc-expire-referrals.timer
sudo systemctl enable spmc-mark-did-not-arrive.timer

# Start timers
sudo systemctl start spmc-expire-referrals.timer
sudo systemctl start spmc-mark-did-not-arrive.timer

# Check status
sudo systemctl status spmc-expire-referrals.timer
sudo systemctl status spmc-mark-did-not-arrive.timer
```

#### Step 3: Test Services Manually
```bash
# Test expire referrals
sudo systemctl start spmc-expire-referrals.service

# Test mark did not arrive
sudo systemctl start spmc-mark-did-not-arrive.service

# Check logs
sudo tail -f /var/log/spmc/expire_referrals.log
sudo tail -f /var/log/spmc/mark_did_not_arrive.log
```

---

## Monitoring and Maintenance

### Check Task Execution

**Windows:**
```powershell
# View recent logs
Get-Content logs\expire_referrals.log -Tail 20
Get-Content logs\mark_did_not_arrive.log -Tail 20

# Check Task Scheduler history
# Open Task Scheduler → View → Show Task History
```

**Linux:**
```bash
# View recent logs
tail -20 /var/log/spmc/expire_referrals.log
tail -20 /var/log/spmc/mark_did_not_arrive.log

# Check cron execution
grep CRON /var/log/syslog | tail -20

# Check systemd timer status
systemctl list-timers | grep spmc
```

### Log Rotation

**Linux (logrotate):**

Create `/etc/logrotate.d/spmc`:
```
/var/log/spmc/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## Troubleshooting

### Task Not Running

**Windows:**
1. Check Task Scheduler history
2. Verify batch file paths are correct
3. Ensure Python is in system PATH
4. Check user permissions

**Linux:**
1. Check cron logs: `grep CRON /var/log/syslog`
2. Verify Python path: `which python3`
3. Test command manually
4. Check file permissions

### No Referrals Being Expired

This is normal if:
- No pending referrals are older than 24 hours
- No in-transit referrals are older than 24 hours

Test with custom threshold:
```bash
# Test with 1 hour threshold
python manage.py expire_old_referrals --hours=1 --dry-run
python manage.py mark_did_not_arrive --hours=1 --dry-run
```

### Logs Not Being Created

**Windows:**
```powershell
# Ensure logs directory exists
mkdir logs -Force

# Check write permissions
icacls logs
```

**Linux:**
```bash
# Ensure logs directory exists
mkdir -p /var/log/spmc

# Set permissions
sudo chown www-data:www-data /var/log/spmc
sudo chmod 755 /var/log/spmc
```

---

## Testing the Setup

### Manual Test
```bash
# Test expire command
python manage.py expire_old_referrals --dry-run

# Test mark did not arrive command
python manage.py mark_did_not_arrive --dry-run

# Run actual commands
python manage.py expire_old_referrals
python manage.py mark_did_not_arrive
```

### Create Test Data

To test the commands, you can create old referrals:

```python
# In Django shell (python manage.py shell)
from referrals.models import Referral
from django.utils import timezone
from datetime import timedelta

# Create a pending referral from 25 hours ago
referral = Referral.objects.first()
if referral:
    referral.created_at = timezone.now() - timedelta(hours=25)
    referral.status = 'pending'
    referral.save()
    print(f"Created test referral: {referral.referral_id}")
```

Then run:
```bash
python manage.py expire_old_referrals --dry-run
# Should show 1 referral to expire
```

---

## Summary

✅ **Windows:** Use Task Scheduler with batch files  
✅ **Linux Development:** Use crontab  
✅ **Linux Production:** Use systemd timers (recommended)

Both commands should run **every hour** to maintain workflow alignment with the documented process flow.

**Next Steps:**
1. Choose your platform setup method
2. Create the batch files or service files
3. Setup the scheduled tasks
4. Test manually
5. Monitor logs for the first 24 hours
6. Verify tasks are running automatically

---

**Setup Complete!** Your SPMC Referral System now has automated workflow maintenance. 🎉
