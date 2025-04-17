// This file provides mock data when the backend is unavailable
import type {
    Models,
    PredictionResult,
    SymptomCheckerResult,
    ChatRoom,
    ChatMessage,
    Doctor,
    Report,
  } from "./api-service"
  
  // Mock models data
  export const mockModels: Models = {
    skin_cancer: {
      file: "skin_cancer_model.pt",
      classes: ["Benign", "Malignant"],
      display_name: "Skin Cancer Classification",
      description: "Detects malignant skin lesions from images",
    },
    pneumonia: {
      file: "pneumonia_model.pt",
      classes: ["Normal", "Pneumonia"],
      display_name: "Pneumonia Detection",
      description: "Detects pneumonia from chest X-rays",
    },
    covid19: {
      file: "covid19_model.pt",
      classes: ["Normal", "COVID-19"],
      display_name: "COVID-19 Analysis",
      description: "Detects COVID-19 from chest X-rays",
    },
  }
  
  // Mock prediction result
  export const mockPredictionResult: PredictionResult = {
    prediction: "Benign",
    confidence: 92.5,
    model_used: "skin_cancer",
    display_name: "Skin Cancer Classification",
    probabilities: {
      Benign: 92.5,
      Malignant: 7.5,
    },
    report_url: "/mock-report.pdf",
    report_content:
      "**Analysis Summary:** The image shows a benign skin lesion with typical characteristics of a common nevus.\n\n**Key Findings:** The lesion has regular borders, consistent coloration, and symmetrical shape, all indicative of a benign condition.\n\n**Recommendations:** Regular monitoring is advised, but no immediate medical intervention is necessary based on this analysis.",
  }
  
  // Mock symptom checker result
  export const mockSymptomCheckerResult: SymptomCheckerResult = {
    analysis:
      "Based on the symptoms described, you may be experiencing a common cold or seasonal allergies. Your symptoms are mild and consistent with upper respiratory infections.",
    recommended_models: [
      {
        key: "pneumonia",
        name: "Pneumonia Detection",
        description: "Recommended for further analysis of respiratory symptoms",
      },
    ],
  }
  
  // Mock chat rooms
  export const mockChatRooms: ChatRoom[] = [
    {
      id: "room-1",
      name: "Dr. Sarah Johnson",
      other_participant: {
        id: "doctor-1",
        name: "Dr. Sarah Johnson",
        role: "doctor",
      },
      last_message: {
        content: "How are you feeling today?",
        timestamp: Date.now() / 1000 - 3600,
      },
      unread_count: 1,
    },
    {
      id: "room-2",
      name: "Dr. Michael Chen",
      other_participant: {
        id: "doctor-2",
        name: "Dr. Michael Chen",
        role: "doctor",
      },
      last_message: {
        content: "Your test results look good.",
        timestamp: Date.now() / 1000 - 86400,
      },
      unread_count: 0,
    },
  ]
  
  // Mock chat messages
  export const mockChatMessages: Record<string, ChatMessage[]> = {
    "room-1": [
      {
        id: "msg-1",
        room_id: "room-1",
        sender_id: "doctor-1",
        sender_name: "Dr. Sarah Johnson",
        content: "Hello! How can I help you today?",
        timestamp: Date.now() / 1000 - 7200,
        read: true,
      },
      {
        id: "msg-2",
        room_id: "room-1",
        sender_id: "patient-1",
        sender_name: "You",
        content: "I've been having headaches for the past few days.",
        timestamp: Date.now() / 1000 - 7100,
        read: true,
      },
      {
        id: "msg-3",
        room_id: "room-1",
        sender_id: "doctor-1",
        sender_name: "Dr. Sarah Johnson",
        content: "How severe are they and have you taken any medication?",
        timestamp: Date.now() / 1000 - 7000,
        read: true,
      },
      {
        id: "msg-4",
        room_id: "room-1",
        sender_id: "doctor-1",
        sender_name: "Dr. Sarah Johnson",
        content: "How are you feeling today?",
        timestamp: Date.now() / 1000 - 3600,
        read: false,
      },
    ],
  }
  
  // Mock doctors
  export const mockDoctors: Doctor[] = [
    {
      id: "doctor-1",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@example.com",
      role: "doctor",
      specialty: "Dermatology",
      status: "online",
      availability: true,
      avatar: "/placeholder.svg?height=40&width=40",
      existing_chat_room: "room-1",
    },
    {
      id: "doctor-2",
      name: "Dr. Michael Chen",
      email: "michael.chen@example.com",
      role: "doctor",
      specialty: "Cardiology",
      status: "online",
      availability: true,
      avatar: "/placeholder.svg?height=40&width=40",
      existing_chat_room: "room-2",
    },
    {
      id: "doctor-3",
      name: "Dr. Emily Rodriguez",
      email: "emily.rodriguez@example.com",
      role: "doctor",
      specialty: "General Medicine",
      status: "offline",
      availability: false,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]
  
  // Mock reports
  export const mockReports: Report[] = [
    {
      id: "report-1",
      filename: "skin_analysis_report.pdf",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      url: "/mock-report.pdf",
    },
    {
      id: "report-2",
      filename: "chest_xray_report.pdf",
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      url: "/mock-report.pdf",
    },
  ]
  
  // Mock service functions
  export const MockService = {
    getModels: () => Promise.resolve(mockModels),
    predictImage: () => Promise.resolve(mockPredictionResult),
    checkSymptoms: () => Promise.resolve(mockSymptomCheckerResult),
    getChatRooms: () => Promise.resolve(mockChatRooms),
    getChatHistory: (roomId: string) => Promise.resolve(mockChatMessages[roomId] || []),
    getDoctors: () => Promise.resolve(mockDoctors),
    getUserReports: () => Promise.resolve(mockReports),
    downloadReport: (url: string) => {
      alert("Mock download: In a real app, this would download a report file.")
    },
  }
  