import React from 'react';
import { Link } from 'react-router-dom';
import ModelCard from './ModelCard';
import './DiagnosisResult.css';

const DiagnosisResult = ({ result }) => {
  if (!result) return null;

  return (
    <div className="diagnosis-result">
      <div className="result-content">
        <h2>Symptom Analysis</h2>
        <div className="analysis-text">
          {result.analysis.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
      
      {result.recommended_models && result.recommended_models.length > 0 && (
        <div className="recommended-models">
          <h3>Recommended Diagnostic Models</h3>
          <p>Based on your symptoms, these diagnostic models might be helpful:</p>
          <div className="model-cards">
            {result.recommended_models.map((model) => (
              <div key={model.key} className="recommended-model">
                <ModelCard model={model} onClick={() => {}} />
                <Link to={`/?model=${model.key}`} className="use-model-button">
                  Use This Model
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisResult;