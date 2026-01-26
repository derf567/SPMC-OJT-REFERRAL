# SPMC Hospital Referral System

A comprehensive hospital referral management system for SPMC Hospital to efficiently refer patients to partner hospitals when specialized services, doctors, or equipment are not available locally.

## System Purpose

This referral system addresses the common challenge where SPMC Hospital needs to refer patients to other hospitals because:
- **Specialized doctors** are not available (e.g., specific surgeons, specialists)
- **Medical equipment** is not available (e.g., advanced imaging, specialized surgical tools)
- **Specialized services** are not offered (e.g., certain procedures, treatments)
- **Capacity issues** during peak times or emergencies

## Key Features

### Referral Management
- **New Referral Creation**: Easy form to create patient referrals with all necessary details
- **Referral Tracking**: Monitor status of all referrals (Pending, Completed, Urgent)
- **Priority Levels**: Normal, Urgent, and Emergency classifications
- **Automated Matching**: System suggests best partner hospital based on required service

### Partner Hospital Network
- **Hospital Directory**: Complete list of partner hospitals with contact information
- **Service Availability**: Real-time status of services available at each hospital
- **Specialization Mapping**: Know which hospital offers which specialized services
- **Contact Integration**: Direct access to hospital contact information

### Dashboard & Analytics
- **Referral Statistics**: Track pending, completed, and urgent referrals
- **Recent Activity**: Quick view of latest referral activities
- **Performance Metrics**: Monitor referral success rates and response times
- **Reporting**: Generate reports for hospital administration

## Navigation Menu

- **🏠 Dashboard**: Overview of referral statistics and recent activities
- **📋 New Referral**: Create new patient referrals
- **📄 Referral History**: View and manage past referrals
- **🏥 Partner Hospitals**: Directory of partner hospitals and their services
- **🔍 Available Services**: Search for specific services across the network
- **👨‍⚕️ Doctors Network**: Directory of specialists at partner hospitals
- **🚨 Urgent Referrals**: Priority queue for emergency referrals
- **📊 Reports**: Analytics and reporting tools
- **⚙️ Settings**: System configuration and preferences

## Referral Process

1. **Patient Assessment**: Doctor determines patient needs specialized care not available at SPMC
2. **Create Referral**: Use the system to create a new referral with:
   - Patient information
   - Required service/specialty
   - Reason for referral
   - Priority level
   - Preferred hospital (or auto-select)
3. **Hospital Matching**: System suggests best partner hospital based on:
   - Service availability
   - Hospital capacity
   - Geographic proximity
   - Specialist availability
4. **Referral Submission**: Send referral to selected hospital
5. **Status Tracking**: Monitor referral progress until completion

## Partner Hospitals Network

Current partner hospitals include:
- **Vicente Sotto Memorial Medical Center** - Cardiology, Neurology, Emergency, ICU
- **Chong Hua Hospital** - Oncology, Radiology, Surgery, Dialysis
- **Cebu Doctors' University Hospital** - Pediatrics, Orthopedics, Maternity, Laboratory
- **Perpetual Succour Hospital** - General Medicine, Emergency Care

## Design Features

- **SPMC Red Theme**: Consistent branding with hospital identity
- **Modern Sidebar**: Collapsible navigation with smooth animations
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Status Indicators**: Visual cues for referral status and hospital availability
- **Priority Alerts**: Special highlighting for urgent referrals
- **Clean Forms**: User-friendly referral creation interface

## How to Run

1. Navigate to the frontend directory:
   ```bash
   cd SPMC/front-end
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## Usage

1. **Login**: Enter credentials to access the referral system
2. **Create Referral**: Click "New Referral" to refer a patient
3. **Track Progress**: Use "Referral History" to monitor status
4. **Find Services**: Use "Available Services" to search for specific treatments
5. **Emergency Cases**: Use "Urgent Referrals" for priority cases

## Benefits

- **Improved Patient Care**: Ensure patients get the specialized care they need
- **Efficient Coordination**: Streamlined communication with partner hospitals
- **Better Resource Utilization**: Optimal use of available medical resources across the network
- **Reduced Wait Times**: Quick identification of available services
- **Documentation**: Complete record of all referral activities
- **Cost Effective**: Avoid unnecessary transfers by matching patients to appropriate facilities

## Next Steps for Production

- **Integration with Hospital Management Systems**: Connect to existing patient records
- **Real-time Availability**: Live updates on hospital capacity and service availability
- **Automated Notifications**: Email/SMS alerts for referral status updates
- **Digital Document Transfer**: Secure transfer of patient records and medical images
- **Billing Integration**: Handle referral-related billing and insurance processing
- **Mobile App**: Dedicated mobile application for doctors and staff

## File Structure

```
SPMC/front-end/src/
├── App.js          # Main referral system application
├── App.css         # Complete styling with referral-specific components
├── index.css       # Global styles and SPMC branding
└── index.js        # React app entry point
```

This referral system transforms how SPMC Hospital manages patient referrals, ensuring no patient is left without access to the specialized care they need, even when it's not available locally.