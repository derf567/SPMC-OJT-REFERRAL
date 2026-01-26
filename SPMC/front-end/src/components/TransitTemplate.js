import React from 'react';

const TransitTemplate = () => {
  return (
    <div className="content-section">
      <h2>Transit Template</h2>
      <div className="transit-form-container">
        <form className="transit-form">
          <div className="form-section">
            <h3>Patient Transfer Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Patient Name</label>
                <input type="text" placeholder="Enter patient name" />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input type="number" placeholder="Enter age" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Watcher's Name</label>
                <input type="text" placeholder="Enter watcher's name" />
              </div>
              <div className="form-group">
                <label>Watcher's Age</label>
                <input type="number" placeholder="Enter watcher's age" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Relation to patient</label>
                <input type="text" placeholder="e.g., Spouse, Child, Parent" />
              </div>
              <div className="form-group">
                <label>Contact number</label>
                <input type="tel" placeholder="Enter contact number" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Escort Nurse</label>
                <input type="text" placeholder="Enter escort nurse name" />
              </div>
              <div className="form-group">
                <label>Driver</label>
                <input type="text" placeholder="Enter driver name" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Referring MD/Contact</label>
                <input type="text" placeholder="Enter referring doctor and contact" />
              </div>
              <div className="form-group">
                <label>Referring Facility</label>
                <input type="text" placeholder="Enter referring facility name" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Latest Vital Signs</label>
                <input type="text" placeholder="Enter latest vital signs" />
              </div>
              <div className="form-group">
                <label>GCS</label>
                <input type="text" placeholder="Enter GCS score" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Time ambulance left</label>
              <input type="datetime-local" />
            </div>
          </div>
          
          <button type="submit" className="submit-referral-btn">Save Transit Information</button>
        </form>
      </div>
    </div>
  );
};

export default TransitTemplate;