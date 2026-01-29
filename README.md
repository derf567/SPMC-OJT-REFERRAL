# SPMC Emergency Dispatch and Communication Center

A comprehensive hospital referral management system for SPMC Hospital to efficiently manage patient referrals to partner hospitals when specialized services, doctors, or equipment are not available locally.

![SPMC Logo](https://img.shields.io/badge/SPMC-Hospital-red?style=for-the-badge)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Django](https://img.shields.io/badge/Django-4+-green?style=for-the-badge&logo=django)

## 🏥 System Overview

The SPMC Emergency Dispatch System handles patient referrals when:
- **Specialized doctors** are not available (surgeons, specialists)
- **Medical equipment** is not available (MRI, surgical tools)
- **Specialized services** are not offered (procedures, treatments)
- **Capacity issues** during emergencies

## 📋 Features

- **Complete Referral Form** with all medical details
- **Real-time Status Tracking** of patient transfers
- **Partner Hospital Network** management
- **Transit Template** for ambulance coordination
- **Historical Records** with filtering and search
- **Reports & Analytics** for performance monitoring
- **Modern UI** with Tailwind CSS styling and responsive design

## 🛠️ Prerequisites

Before running this application, make sure you have the following installed:

### Required Software:
- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **Python** (version 3.8 or higher) - [Download here](https://python.org/)
- **Git** - [Download here](https://git-scm.com/)

### Check if installed:
```bash
node --version    # Should show v16+ 
npm --version     # Should show 8+
python --version  # Should show 3.8+
git --version     # Should show git version
```

## 🚀 Installation & Setup

### Step 1: Clone or Download the Project
```bash
# If using Git:
git clone <repository-url>
cd SPMC-OJT-REFERRAL

# Or download and extract the ZIP file, then navigate to the folder
```

### Step 2: Set Up the Frontend (React with Tailwind CSS)
```bash
# Navigate to the frontend directory
cd SPMC/front-end

# Install all required packages
npm install

# This will install:
# - React 19.2.3
# - React DOM 19.2.3
# - React Scripts 5.0.1
# - Tailwind CSS 3.4.0
# - PostCSS and Autoprefixer
# - Testing libraries
# - Web Vitals
```

### Step 3: Set Up the Backend (Django) - Optional
```bash
# Navigate back to SPMC directory
cd ../

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Django and dependencies
pip install django

# Run database migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

## ▶️ Running the Application

### Option 1: Frontend Only (Recommended for Testing)
```bash
# Navigate to frontend directory
cd SPMC/front-end

# Start the development server
npm start

# The application will open automatically at:
# http://localhost:3000
```

### Option 2: Full Stack (Frontend + Backend)
```bash
# Terminal 1 - Start Django Backend
cd SPMC
python manage.py runserver
# Backend will run at: http://localhost:8000

# Terminal 2 - Start React Frontend
cd SPMC/front-end
npm start
# Frontend will run at: http://localhost:3000
```

## 🎨 Tailwind CSS Styling

This project uses **Tailwind CSS** for styling instead of custom CSS files. Benefits include:

### ✅ **Advantages of Tailwind CSS:**
- **Utility-first**: Build designs directly in your markup
- **Responsive**: Built-in responsive design utilities
- **Customizable**: Easy to customize colors, spacing, and components
- **Maintainable**: No more CSS conflicts or unused styles
- **Fast Development**: Rapid prototyping and development

### 🎨 **SPMC Custom Theme:**
- **Primary Colors**: Custom SPMC red color palette (`spmc-red-50` to `spmc-red-900`)
- **Animations**: Custom slide-up and pulse animations
- **Components**: Reusable component classes for forms, cards, and buttons

### 🔧 **Customizing Styles:**
To modify the design, edit the Tailwind classes directly in the component files:
```jsx
// Example: Change button color
<button className="bg-blue-600 hover:bg-blue-700"> // Blue button
<button className="bg-spmc-red-600 hover:bg-spmc-red-700"> // SPMC red button
```

## 🔐 Login Instructions

### Default Login (Demo Mode):
- **Username**: Enter any username (e.g., `admin`, `doctor`, `nurse`)
- **Password**: Enter any password (e.g., `password`, `123456`)
- Click **Login** to access the system

> **Note**: The current system uses client-side authentication for demonstration. In production, this would connect to your Django backend for secure authentication.

## 🧭 Navigation Guide

After logging in, you'll see the main dashboard with a collapsible sidebar containing:

### 🏠 **Dashboard**
- Overview of referral statistics with animated cards
- Recent referral activities with status indicators
- Emergency case alerts with pulse animations
- Key performance metrics

### 📋 **New Referral**
Complete referral form with Tailwind-styled sections:
- **Patient Status**: Vitals, GCS, RTPCR results
- **Specialty Needed**: Required medical services
- **Patient Information**: Demographics and contact details
- **Referring Hospital**: Facility and referrer information
- **Consent & Transfer**: Legal and transport details

### 🚑 **Transit Template**
Patient transfer coordination with modern form styling

### 📊 **Status Table**
Real-time tracking with responsive table design

### 🏥 **Partner Hospitals**
Hospital network directory with card-based layout

### 📄 **Referral History**
Historical records with advanced filtering

### 📈 **Reports**
Analytics dashboard with modern UI components

### ⚙️ **Settings**
System configuration with organized sections

## 🎨 UI Features

### Sidebar Navigation:
- **Expand/Collapse**: Click the hamburger menu (☰) to toggle
- **Smooth Animations**: CSS transitions with Tailwind classes
- **Responsive Design**: Adapts to mobile and tablet screens
- **Active Indicators**: Current page highlighted with SPMC red theme
- **Hover Effects**: Interactive feedback on all elements

### Form Features:
- **Focus States**: Red border highlights on input focus
- **Validation Styling**: Visual feedback for form validation
- **File Upload**: Styled drag-and-drop file upload areas
- **Responsive Grid**: Forms adapt to different screen sizes

## 🔧 Troubleshooting

### Common Issues:

#### 1. **"npm: command not found"**
```bash
# Install Node.js from https://nodejs.org/
# Restart your terminal after installation
```

#### 2. **"Tailwind styles not working"**
```bash
# Make sure Tailwind is properly installed
npm install -D tailwindcss postcss autoprefixer

# Verify tailwind.config.js and postcss.config.js exist
# Check that @tailwind directives are in index.css
```

#### 3. **"Port 3000 is already in use"**
```bash
# Kill the process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# On Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port:
npm start -- --port 3001
```

#### 4. **"Module not found" errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📱 Browser Compatibility

### Recommended Browsers:
- **Chrome** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Mobile Support:
- **iOS Safari** 14+
- **Android Chrome** 90+
- **Responsive design** with Tailwind CSS breakpoints

## 🔄 Development Mode

### Hot Reload:
- Changes to React components automatically refresh the browser
- Tailwind CSS changes are compiled automatically
- No need to restart the server for frontend changes

### File Structure:
```
SPMC-OJT-REFERRAL/
├── SPMC/
│   ├── front-end/                 # React application with Tailwind
│   │   ├── src/
│   │   │   ├── components/        # Individual page components
│   │   │   ├── App.js            # Main application
│   │   │   └── index.css         # Tailwind CSS imports
│   │   ├── tailwind.config.js    # Tailwind configuration
│   │   ├── postcss.config.js     # PostCSS configuration
│   │   └── package.json          # Dependencies
│   ├── web_project/              # Django backend
│   └── manage.py                 # Django management
└── README.md                     # This file
```

## 🎨 Tailwind Configuration

### Custom SPMC Theme:
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'spmc-red': {
        50: '#fef2f2',
        600: '#dc2626',
        700: '#b91c1c',
        // ... full color palette
      },
    },
  },
}
```

### Custom Components:
You can add custom component classes in `index.css`:
```css
@layer components {
  .btn-spmc {
    @apply bg-spmc-red-600 hover:bg-spmc-red-700 text-white px-4 py-2 rounded-lg;
  }
}
```

## 📞 Support & Contact

### For Technical Issues:
- Check the **COMPONENT_STRUCTURE.md** for debugging specific sections
- Review browser console for error messages
- Ensure all prerequisites are installed correctly
- Check Tailwind CSS compilation in the browser dev tools

### For Styling Questions:
- Refer to [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- Check the `tailwind.config.js` for custom SPMC theme colors
- Use browser dev tools to inspect Tailwind classes

## 🚀 Production Deployment

### For Production Use:
1. **Build the React app**:
   ```bash
   cd SPMC/front-end
   npm run build
   ```

2. **Optimize Tailwind CSS** (automatically done in build)
3. **Configure Django settings** for production
4. **Set up proper authentication** and database
5. **Configure web server** (Apache/Nginx)
6. **Set up SSL certificates** for security

## 📄 License

© 2026 SPMC Hospital. All rights reserved.

---

**Quick Start Summary:**
1. Install Node.js and Python
2. Navigate to `SPMC/front-end`
3. Run `npm install`
4. Run `npm start`
5. Open http://localhost:3000
6. Login with any username/password
7. Enjoy the modern Tailwind CSS interface!

For detailed component information, see **COMPONENT_STRUCTURE.md**