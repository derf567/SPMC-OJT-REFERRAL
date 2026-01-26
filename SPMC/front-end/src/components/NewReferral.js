import React from 'react';

const NewReferral = () => {
  return (
    <div className="content-section">
      <h2>SPMC Emergency Dispatch and Communication Center Referral Form</h2>
      <div className="referral-form-container">
        <form className="referral-form">
          
          {/* Patient Status Section */}
          <div className="form-section">
            <h3>Patient Status</h3>
            <div className="form-group">
              <label>Chief Complaint</label>
              <textarea placeholder="Enter chief complaint" rows="3"></textarea>
            </div>
            <div className="form-group">
              <label>Pertinent History</label>
              <textarea placeholder="Enter pertinent history" rows="3"></textarea>
            </div>
            <div className="form-group">
              <label>Pertinent Physical Exam or Laboratories</label>
              <textarea placeholder="Enter physical exam findings or laboratory results" rows="3"></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Blood Pressure (BP)</label>
                <input type="text" placeholder="e.g., 120/80 mmHg" />
              </div>
              <div className="form-group">
                <label>Heart Rate (HR)</label>
                <input type="text" placeholder="e.g., 80 bpm" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Respiratory Rate (RR)</label>
                <input type="text" placeholder="e.g., 18/min" />
              </div>
              <div className="form-group">
                <label>Temperature</label>
                <input type="text" placeholder="e.g., 36.5°C" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>O2 Saturation</label>
                <input type="text" placeholder="e.g., 98%" />
              </div>
              <div className="form-group">
                <label>GCS Score or AVPU</label>
                <input type="text" placeholder="e.g., GCS 15 or Alert" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>O2 Support</label>
                <input type="text" placeholder="e.g., Room air, Nasal cannula 2L/min" />
              </div>
              <div className="form-group">
                <label>Admission Status in Referring Institution</label>
                <select>
                  <option value="">Select admission status</option>
                  <option value="emergency-room">Emergency Room</option>
                  <option value="ward">Ward</option>
                  <option value="intensive-care-unit">Intensive Care Unit</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>RTPCR Result</label>
                <select>
                  <option value="">Select RTPCR result</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="not-done">Not Done</option>
                </select>
              </div>
              <div className="form-group">
                <label>Working Impression</label>
                <input type="text" placeholder="DONE (automatic)" disabled />
              </div>
            </div>
            
            <div className="form-group">
              <label>Management done to the patient</label>
              <textarea placeholder="LABS (automatic)" rows="3" disabled></textarea>
            </div>
            
            <div className="form-group">
              <label>Upload Pertinent Laboratories and Images</label>
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
              <small>Or send directly through Viber: 0915 541 3040</small>
            </div>
          </div>

          {/* Specialty Needed Section */}
          <div className="form-section">
            <h3>Specialty Needed</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Which Specialty/Service is Needed</label>
                <select>
                  <option value="">Select specialty needed</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="oncology">Oncology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="surgery">Surgery</option>
                  <option value="emergency-medicine">Emergency Medicine</option>
                  <option value="internal-medicine">Internal Medicine</option>
                  <option value="icu">Intensive Care Unit</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div className="form-group">
                <label>If others, please specify</label>
                <input type="text" placeholder="Specify required specialty or service" />
              </div>
            </div>
          </div>

          {/* Patient General Information Section */}
          <div className="form-section">
            <h3>Patient General Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Patient Category</label>
                <select>
                  <option value="">Select patient category</option>
                  <option value="new-patient">New Patient of SPMC</option>
                  <option value="old-patient">Old or Known Patient of SPMC</option>
                </select>
              </div>
              <div className="form-group">
                <label>If known Patient of SPMC, HRN (Hospital Record Number)</label>
                <input type="text" placeholder="Enter HRN or N/A if unknown" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Patient's Full Name</label>
              <input type="text" placeholder="Enter patient's complete name" />
            </div>
            
            <div className="form-group">
              <label>Patient Current Complete Address</label>
              <textarea placeholder="Enter complete current address" rows="2"></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Birthday</label>
                <input type="date" />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input type="number" placeholder="Enter age" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Gender</label>
              <select>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Service Needed Section */}
          <div className="form-section">
            <h3>Service Needed</h3>
            <div className="form-group">
              <label>Urgent</label>
              <select>
                <option value="">Select urgency level</option>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Referring Hospital Section */}
          <div className="form-section">
            <h3>Referring Hospital</h3>
            <div className="form-group">
              <label>Is your Hospital/Facility Located inside Davao City?</label>
              <select>
                <option value="">Select location</option>
                <option value="inside-davao">Inside Davao City</option>
                <option value="outside-davao">Outside Davao City</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Complete name of the referring facility</label>
              <input type="text" placeholder="Enter referring facility name" />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Name of the referrer</label>
                <input type="text" placeholder="Enter referrer's name" />
              </div>
              <div className="form-group">
                <label>Profession of the referrer</label>
                <input type="text" placeholder="e.g., MD, RN, etc." />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Cellphone number of the referrer</label>
                <input type="tel" placeholder="Enter contact number" />
              </div>
              <div className="form-group">
                <label>Mode of transportation</label>
                <select>
                  <option value="">Select transportation</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="private-vehicle">Private Vehicle</option>
                  <option value="public-transport">Public Transport</option>
                  <option value="helicopter">Helicopter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Consent to Transfer Section */}
          <div className="form-section">
            <h3>Consent to Transfer</h3>
            <div className="form-group">
              <label>Was a consent form to transfer secured from the patient/relative prior to this referral?</label>
              <select>
                <option value="">Select consent status</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Reason for referral</label>
              <textarea placeholder="Enter detailed reason for referral" rows="3"></textarea>
            </div>
          </div>

          <button type="submit" className="submit-referral-btn">Submit Referral Form</button>
        </form>
      </div>
    </div>
  );
};

export default NewReferral;