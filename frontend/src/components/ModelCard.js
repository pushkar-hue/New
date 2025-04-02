import React from 'react';
import './ModelCard.css';

const ModelCard = ({ model, onClick, selected }) => {
  return (
    <div 
      className={`model-card ${selected ? 'selected' : ''}`} 
      onClick={() => onClick(model.key)}
    >
      <div className="model-card-content">
        <h3>{model.display_name}</h3>
        <p>{model.description}</p>
        <div className="model-classes">
          <strong>Detects: </strong>
          {model.classes.join(', ')}
        </div>
      </div>
    </div>
  );
};

export default ModelCard;