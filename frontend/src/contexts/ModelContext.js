import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
  const [models, setModels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/models`);
        setModels(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load models');
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <ModelContext.Provider value={{ models, loading, error }}>
      {children}
    </ModelContext.Provider>
  );
};