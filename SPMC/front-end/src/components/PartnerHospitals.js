import React from 'react';

const PartnerHospitals = () => {
  return (
    <div className="content-section">
      <h2>Partner Hospitals Network</h2>
      <div className="hospitals-grid">
        <div className="hospital-card">
          <div className="hospital-header">
            <h3>Davao Medical School Foundation</h3>
            <div className="hospital-status available">Available</div>
          </div>
          <div className="hospital-services">
            <h4>Available Services:</h4>
            <div className="service-tags">
              <span className="service-tag">Cardiology</span>
              <span className="service-tag">Neurology</span>
              <span className="service-tag">Emergency</span>
              <span className="service-tag">ICU</span>
            </div>
          </div>
          <div className="hospital-contact">
            <p>📞 (082) 227-2731</p>
            <p>📍 Bajada, Davao City</p>
          </div>
        </div>
        
        <div className="hospital-card">
          <div className="hospital-header">
            <h3>Davao Doctors Hospital</h3>
            <div className="hospital-status available">Available</div>
          </div>
          <div className="hospital-services">
            <h4>Available Services:</h4>
            <div className="service-tags">
              <span className="service-tag">Oncology</span>
              <span className="service-tag">Radiology</span>
              <span className="service-tag">Surgery</span>
              <span className="service-tag">Dialysis</span>
            </div>
          </div>
          <div className="hospital-contact">
            <p>📞 (082) 221-2101</p>
            <p>📍 Gen. Malvar St, Davao City</p>
          </div>
        </div>
        
        <div className="hospital-card">
          <div className="hospital-header">
            <h3>Brokenshire Hospital</h3>
            <div className="hospital-status busy">Busy</div>
          </div>
          <div className="hospital-services">
            <h4>Available Services:</h4>
            <div className="service-tags">
              <span className="service-tag">Pediatrics</span>
              <span className="service-tag">Orthopedics</span>
              <span className="service-tag">Maternity</span>
              <span className="service-tag">Laboratory</span>
            </div>
          </div>
          <div className="hospital-contact">
            <p>📞 (082) 241-3000</p>
            <p>📍 Madapo Hills, Davao City</p>
          </div>
        </div>
        
        <div className="hospital-card">
          <div className="hospital-header">
            <h3>Davao Regional Medical Center</h3>
            <div className="hospital-status available">Available</div>
          </div>
          <div className="hospital-services">
            <h4>Available Services:</h4>
            <div className="service-tags">
              <span className="service-tag">Trauma</span>
              <span className="service-tag">Burns</span>
              <span className="service-tag">Infectious Disease</span>
              <span className="service-tag">Psychiatry</span>
            </div>
          </div>
          <div className="hospital-contact">
            <p>📞 (082) 296-1645</p>
            <p>📍 Tagum-Mabini Road, Davao City</p>
          </div>
        </div>
        
        <div className="hospital-card">
          <div className="hospital-header">
            <h3>Adventist Medical Center</h3>
            <div className="hospital-status available">Available</div>
          </div>
          <div className="hospital-services">
            <h4>Available Services:</h4>
            <div className="service-tags">
              <span className="service-tag">General Medicine</span>
              <span className="service-tag">Surgery</span>
              <span className="service-tag">OB-Gyne</span>
              <span className="service-tag">Pediatrics</span>
            </div>
          </div>
          <div className="hospital-contact">
            <p>📞 (082) 224-7791</p>
            <p>📍 Digos Street, Davao City</p>
          </div>
        </div>
        
        <div className="hospital-card">
          <div className="hospital-header">
            <h3>Metro Davao Medical & Research Center</h3>
            <div className="hospital-status unavailable">Unavailable</div>
          </div>
          <div className="hospital-services">
            <h4>Available Services:</h4>
            <div className="service-tags">
              <span className="service-tag">Cardiology</span>
              <span className="service-tag">Nephrology</span>
              <span className="service-tag">Pulmonology</span>
              <span className="service-tag">Gastroenterology</span>
            </div>
          </div>
          <div className="hospital-contact">
            <p>📞 (082) 305-9999</p>
            <p>📍 J.P. Laurel Ave, Davao City</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerHospitals;