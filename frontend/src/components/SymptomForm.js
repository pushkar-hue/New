import React, { useState } from 'react';
import axios from 'axios';
import './SymptomForm.css';

const SymptomForm = ({ onSubmit }) => {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/check-symptoms`, {
        symptoms, 
        age, 
        gender, 
        medicalHistory
      });
      
      onSubmit(response.data);
    } catch (error) {
      console.error('Error checking symptoms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="symptom-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="symptoms">Describe your symptoms:</label>
        <textarea
          id="symptoms"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          required
          placeholder="Describe your symptoms in detail. Include when they started, severity, and any factors that make them better or worse."
          rows={5}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="0"
            max="120"
            placeholder="Enter your age"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="gender">Gender:</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="medicalHistory">Medical History (optional):</label>
        <textarea
          id="medicalHistory"
          value={medicalHistory}
          onChange={(e) => setMedicalHistory(e.target.value)}
          placeholder="List any existing medical conditions, medications, allergies, or relevant family history."
          rows={3}
        />
      </div>
      
      <button type="submit" className="submit-button" disabled={loading || !symptoms.trim()}>
        {loading ? 'Analyzing...' : 'Analyze Symptoms'}
      </button>
    </form>
  );
};

export default SymptomForm;