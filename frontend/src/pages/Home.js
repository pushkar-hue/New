import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ModelContext } from '../contexts/ModelContext';
import ModelCard from '../components/ModelCard';
import ImageUpload from '../components/ImageUpload';
import { Loader } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { models, loading: loadingModels } = useContext(ModelContext);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get model from URL param if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modelParam = params.get('model');
    if (modelParam && models[modelParam]) {
      setSelectedModel(modelParam);
    } else if (Object.keys(models).length > 0 && !selectedModel) {
      // Default to first model if none selected
      setSelectedModel(Object.keys(models)[0]);
    }
  }, [location.search, models, selectedModel]);

  const handleModelSelect = (modelKey) => {
    setSelectedModel(modelKey);
    // Reset prediction when changing models
    setPrediction(null);
  };

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    // Reset prediction when changing image
    setPrediction(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedModel || !selectedImage) {
      setError('Please select a model and upload an image.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('model', selectedModel);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/predict`, formData);

      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process the image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewReport = () => {
    if (prediction && prediction.report_url) {
      window.open(`${process.env.REACT_APP_API_URL}${prediction.report_url}`, '_blank');
    }
  };

  if (loadingModels) {
    return (
      <div className="loading-container">
        <Loader size={48} className="spinner" />
        <p>Loading models...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <section className="hero">
        <h1>AI-Powered Medical Diagnosis</h1>
        <p>Upload medical images for instant analysis using our advanced AI models</p>
      </section>

      <section className="model-selection">
        <h2>1. Select a Diagnostic Model</h2>
        <div className="model-grid">
          {Object.entries(models).map(([key, model]) => (
            <ModelCard 
              key={key}
              model={{...model, key}}
              onClick={handleModelSelect}
              selected={selectedModel === key}
            />
          ))}
        </div>
      </section>

      <section className="image-section">
        <h2>2. Upload a Medical Image</h2>
        <ImageUpload onImageSelect={handleImageSelect} />
      </section>

      <section className="action-section">
        <button 
          className="analyze-button"
          onClick={handleSubmit}
          disabled={loading || !selectedModel || !selectedImage}
        >
          {loading ? (
            <>
              <Loader size={20} className="spinner" />
              Analyzing...
            </>
          ) : 'Analyze Image'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </section>

      {prediction && (
        <section className="results-section">
          <h2>Analysis Results</h2>
          <div className="result-card">
            <div className="result-header">
              <h3>Diagnosis: {prediction.prediction}</h3>
              <span className="confidence">
                Confidence: {prediction.confidence.toFixed(2)}%
              </span>
            </div>
            
            <div className="result-details">
              <h4>Probability Distribution:</h4>
              <div className="probability-bars">
                {Object.entries(prediction.probabilities).map(([className, probability]) => (
                  <div key={className} className="probability-item">
                    <div className="probability-label">{className}</div>
                    <div className="probability-bar-container">
                      <div 
                        className="probability-bar" 
                        style={{width: `${probability}%`}}
                      ></div>
                      <span className="probability-value">{probability.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {prediction.report_content && (
              <div className="report-preview">
                <h4>Report Summary:</h4>
                <div className="report-content">
                  {prediction.report_content.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            <div className="result-actions">
              <button onClick={viewReport} className="view-report-button">
                View Full Report
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;