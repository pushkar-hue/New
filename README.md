# AI-Driven Healthcare Platform

This is a comprehensive AI-powered healthcare platform designed to assist in diagnosing various diseases using deep learning. Users can upload medical images (X-rays, histopathology images, and skin lesion scans) to receive AI-generated diagnostic insights. The platform also includes real-time video consultations, a chat system with doctors, and an appointment booking feature.

A chatbot powered by Google’s Gemini API is integrated to provide real-time medical explanations and symptom analysis.

---

![WhatsApp Image 2025-04-04 at 17 59 07_f264b4fd](https://github.com/user-attachments/assets/0957d02d-7413-4259-bdb4-5f1d6fd65997)
![WhatsApp Image 2025-04-04 at 17 59 08_2097207b](https://github.com/user-attachments/assets/735c9341-7fd4-4f66-81c4-56f95febedc6)
![WhatsApp Image 2025-04-04 at 17 59 08_2bf8996f](https://github.com/user-attachments/assets/de5ab826-8c08-408a-8be5-7c01f07ddd08)
![WhatsApp Image 2025-04-04 at 17 59 09_441b21b0](https://github.com/user-attachments/assets/9391784c-f676-4f0e-bce2-fec748c166dd)
![WhatsApp Image 2025-04-04 at 17 59 12_01e72d7e](https://github.com/user-attachments/assets/21ec2ccd-1666-40d2-9265-206ceffc3835)


## Features

- **Image-Based Disease Detection**: Supports classification of multiple diseases using custom deep learning models.
- **AI-Generated Medical Reports**: Includes detailed explanations, risk assessment, and suggested next steps.
- **Medical Chatbot**: Provides information on conditions, symptoms, and treatment using Gemini API.
- **Symptom Checker**: Helps users identify potential conditions based on input symptoms.
- **Video Consultation with Doctors**: Enables real-time video-based doctor-patient consultations.
- **Chat with Doctors**: Allows users to communicate with doctors via text chat.
- **Appointment Booking**: Users can schedule appointments with healthcare professionals.
- **User-Friendly Web Interface**: Developed using React and TypeScript for a responsive and intuitive experience.

---

## Supported Disease Classifications

All AI models were developed from scratch and trained on publicly available medical imaging datasets.

1. **Breast Cancer Detection** – Classifies histopathology images (Healthy or Sick)
2. **COVID-19 Analysis** – Classifies chest X-rays (COVID, Lung Opacity, Normal, Viral Pneumonia)
3. **Malaria Detection** – Detects infected blood smear images (Parasitized or Uninfected)
4. **Pneumonia Detection** – Identifies pneumonia in chest X-rays (Normal or Pneumonia)
5. **Skin Cancer Classification** – Classifies lesion scans (Benign or Malignant)
6. **Tuberculosis Screening** – Classifies chest X-rays (Normal or Tuberculosis)

---

## Model Accuracies

- **Skin Cancer**: 90%  
- **Malaria**: 94%  
- **Breast Cancer**: 95%  
- **Tuberculosis**: 97%  
- **Pneumonia**: 95%  
- **COVID-19**: 96%

---


## Malaria:
![WhatsApp Image 2025-03-20 at 21 38 31_718fe8dc](https://github.com/user-attachments/assets/fe83f6f4-0ba6-4744-9133-192844fbb926)

## Breast Cancer:
![image](https://github.com/user-attachments/assets/1da6e26b-ce48-4be9-bf65-484b7c54f8ec)

## Pneumonia:
![image](https://github.com/user-attachments/assets/012e15e5-8f4e-4bb7-af63-68c34c43088e)

## Skin Cancer
![WhatsApp Image 2025-03-20 at 21 41 46_014b0344](https://github.com/user-attachments/assets/ed6a088a-938b-4401-81c6-e7d6410ac4d3)

## Tuberculosis
![WhatsApp Image 2025-03-20 at 21 42 16_2b7be797](https://github.com/user-attachments/assets/34cc3b1a-a08d-45d3-a5bb-8899b772f39a)

## COVID-19
![image](https://github.com/user-attachments/assets/1ec8268e-32ff-48ac-9ffc-b2271bca1482)


## Technologies Used

- **Frontend**: React, TypeScript, HTML, CSS  
- **Backend**: Flask (Python)  
- **Machine Learning Framework**: PyTorch  
- **Model Architecture**: EfficientNetB0 (Transfer Learning)  
- **API Integration**: Google’s Gemini API (for chatbot and report generation)  
- **Database**: JSON-based storage (for model outputs and user reports)

---

## Team Contributions

- **Frontend Development**: 
- **Backend Development**:
- **AI Model Development**:
- **Model Optimization**:

---

## Future Enhancements

- Doctor-Patient Video Consultation (Implemented)  
- Chat with Doctors (Implemented)  
- Appointment Booking (Implemented)  
- User Authentication and Profile Management  
- Advanced NLP-Based Symptom Checker  
- Expansion to include more diseases and datasets

---

## Installation & Setup

Clone the repository:

```bash
git clone https://github.com/pushkar-hue/MedDiagnosis.git
cd disease-detection-improved
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Set environment variables:

```bash
export GEMINI_API_KEY=your_api_key_here
```

Run the backend:

```bash
python app.py
```
In another terminal:
```bash
cd med-ai
```
Install all the dependencies:
```bash
npm install
```
Run the frontend:
```bash
npm run dev
```

Access the web interface at:

```
http://127.0.0.1:3000
```

---

## Usage

- Upload an image to get AI-based disease classification  
- Use the chatbot for medical guidance  
- Generate a medical report for further analysis  
- Book an appointment or start a video consultation with a doctor  

---

## Disclaimer

This platform is intended for research and educational purposes only. It does not provide a certified medical diagnosis. Always consult a licensed healthcare professional for medical concerns.

---
