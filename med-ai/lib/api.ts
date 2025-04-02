const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export interface Model {
  file: string
  classes: string[]
  display_name: string
  description: string
}

export interface Models {
  [key: string]: Model
}

export interface PredictionResult {
  prediction: string
  confidence: number
  model_used: string
  display_name: string
  probabilities: {
    [key: string]: number
  }
  report_url: string
  report_content: string
}

export interface SymptomCheckerResult {
  analysis: string
  recommended_models: {
    key: string
    name: string
    description: string
  }[]
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// Get all available models
export async function getModels(): Promise<Models> {
  const response = await fetch(`${API_BASE_URL}/api/models`)
  if (!response.ok) {
    throw new Error("Failed to fetch models")
  }
  return response.json()
}

// Upload image for prediction
export async function predictImage(file: File, modelKey: string): Promise<PredictionResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("model", modelKey)

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to process image")
  }

  return response.json()
}

// Check symptoms
export async function checkSymptoms(
  symptoms: string,
  age: string,
  gender: string,
  medicalHistory: string,
): Promise<SymptomCheckerResult> {
  const response = await fetch(`${API_BASE_URL}/api/check-symptoms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      symptoms,
      age,
      gender,
      medicalHistory,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to analyze symptoms")
  }

  return response.json()
}

// Send chat message
export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to send message")
  }

  const data = await response.json()
  return data.response
}

