# SPMC Emergency Dispatch System - Component Structure

The SPMC referral system has been organized into separate, modular components for easier debugging and maintenance. Each component handles a specific section of the application.

## 📁 File Structure

```
SPMC/front-end/src/
├── App.js                          # Main application with routing logic
├── App.css                         # All styling for the entire application
├── components/
│   ├── Dashboard.js                # Main dashboard with statistics
│   ├── NewReferral.js              # Complete referral form
│   ├── TransitTemplate.js          # Patient transfer information
│   ├── StatusTable.js              # Real-time status tracking table
│   ├── PartnerHospitals.js         # Hospital network directory
│   ├── ReferralHistory.js          # Historical referral records
│   ├── Reports.js                  # Analytics and report generation
│   └── Settings.js                 # System configuration
└── index.js                        # React app entry point
```

## 🔧 Component Details

### 1. **Dashboard.js**
- **Purpose**: Main overview screen with key statistics
- **Features**: 
  - Pending/completed referral counts
  - Emergency case alerts
  - Recent referral activity
- **Easy to modify**: Statistics, recent referrals list, layout

### 2. **NewReferral.js**
- **Purpose**: Complete SPMC referral form
- **Features**:
  - Patient status (vitals, GCS, RTPCR)
  - Specialty selection
  - Patient information
  - Referring hospital details
  - Consent and reason
- **Easy to modify**: Form fields, validation, sections

### 3. **TransitTemplate.js**
- **Purpose**: Patient transfer tracking
- **Features**:
  - Patient and watcher info
  - Escort details
  - Ambulance timing
- **Easy to modify**: Transfer fields, timing logic

### 4. **StatusTable.js**
- **Purpose**: Real-time referral status tracking
- **Features**:
  - Tabular view of all referrals
  - Status badges (Received/Cancelled/Uncoordinated)
  - Duration tracking
- **Easy to modify**: Table columns, status types, data

### 5. **PartnerHospitals.js**
- **Purpose**: Hospital network directory
- **Features**:
  - Hospital cards with services
  - Availability status
  - Contact information
- **Easy to modify**: Hospital list, services, contact info

### 6. **ReferralHistory.js**
- **Purpose**: Historical referral records
- **Features**:
  - Filtering by date, status, hospital
  - Timeline view of referral progress
  - Detailed referral information
- **Easy to modify**: Filters, timeline events, history data

### 7. **Reports.js**
- **Purpose**: Analytics and reporting
- **Features**:
  - Report generation options
  - Quick statistics
  - Download history
- **Easy to modify**: Report types, statistics, charts

### 8. **Settings.js**
- **Purpose**: System configuration
- **Features**:
  - User profile management
  - System preferences
  - Hospital network config
  - Security settings
- **Easy to modify**: Settings options, configurations

## 🛠️ How to Debug/Modify Specific Sections

### To modify the Dashboard:
```bash
# Edit only this file:
SPMC/front-end/src/components/Dashboard.js
```

### To modify the Referral Form:
```bash
# Edit only this file:
SPMC/front-end/src/components/NewReferral.js
```

### To modify any other section:
```bash
# Edit the corresponding component file:
SPMC/front-end/src/components/[ComponentName].js
```

### To modify styling:
```bash
# All styles are in one file:
SPMC/front-end/src/App.css
```

## 🔄 Benefits of This Structure

1. **Isolated Debugging**: Each component can be debugged independently
2. **Easy Maintenance**: Changes to one section don't affect others
3. **Clear Organization**: Each file has a single, clear purpose
4. **Scalable**: Easy to add new components or modify existing ones
5. **Team Development**: Multiple developers can work on different components

## 🚀 Quick Development Tips

### To test a specific component:
1. Navigate to the component file
2. Make your changes
3. Save the file
4. The React development server will automatically reload
5. Navigate to that section in the app to see changes

### To add a new component:
1. Create a new file in `/components/`
2. Import it in `App.js`
3. Add it to the `renderContent()` function
4. Add a menu item to the `menuItems` array

### Common modifications:
- **Add form fields**: Edit the specific component file
- **Change statistics**: Modify `Dashboard.js`
- **Update hospital list**: Edit `PartnerHospitals.js`
- **Modify table columns**: Update `StatusTable.js`
- **Add new reports**: Extend `Reports.js`

This modular structure makes the SPMC Emergency Dispatch System much easier to maintain, debug, and extend!