import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import './ImageUpload.css';

const ImageUpload = ({ onImageSelect }) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      onImageSelect(file);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreview(null);
    onImageSelect(null);
  };

  return (
    <div className="image-upload-container">
      {preview ? (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <button className="remove-image" onClick={removeImage}>
            <X size={20} />
          </button>
        </div>
      ) : (
        <div 
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="dropzone-content">
            <Upload size={48} />
            <p>Drag and drop an image here or click to select</p>
            <input 
              type="file" 
              id="image-upload" 
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleChange}
            />
            <label htmlFor="image-upload" className="upload-button">
              Select Image
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
