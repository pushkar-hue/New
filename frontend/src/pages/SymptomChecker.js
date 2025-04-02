import React, { useState } from 'react';
import SymptomForm from '../components/SymptomForm';
import DiagnosisResult from '../components/DiagnosisResult';
import './SymptomChecker.css';

const SymptomChecker = () => {
  const [result, setResult] = useState(null);

  const handleSubmit = (data) => {
    setResult(data);
  };

  return (
    <div className="symptom-checker">
      <div className="symptom-checker-header">
        <h1>Symptom Checker</h1>
        <p>Describe your symptoms to get a preliminary analysis and recommendations</p>
      </div>
      
      <div className="symptom-checker-content">
        {!result ? (
          <SymptomForm onSubmit={handleSubmit} />
        ) : (
          <div className="analysis-result">
            <DiagnosisResult result={result} />
            <button onClick={() => setResult(null)} className="back-button">
              Check New Symptoms
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;