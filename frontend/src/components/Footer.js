import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} MedDiagnosis AI. All rights reserved.</p>
        <p className="disclaimer">
          This application is for educational purposes only. Always consult with a healthcare professional for medical advice.
        </p>
      </div>
    </footer>
  );
};

export default Footer;