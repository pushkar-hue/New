import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for better performance with image processing
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Changed to false as the Flask backend doesn't require credentials for CORS
})

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error("Request error:", error)
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check if the error is a timeout error
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout. The server is taking too long to respond.")
      return Promise.reject(new Error("The server is taking too long to respond. Please try again later."))
    }

    // Check if the error is a network error
    if (!error.response) {
      console.error("Network error. Please check your connection or the server might be down.")
      return Promise.reject(new Error("Network error. Please check your connection or the server might be down."))
    }

    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refresh_token")
        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/token/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
            withCredentials: false, // Changed to false
          },
        )

        const { access_token } = response.data
        localStorage.setItem("access_token", access_token)

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return axios(originalRequest)
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user_id")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// Model interfaces
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
  id: string
  room_id: string
  sender_id: string
  sender_name: string
  content: string
  timestamp: number
  read: boolean
}

export interface ChatRoom {
  id: string
  name: string
  other_participant: {
    id: string
    name: string
    role: string
  }
  last_message?: {
    content: string
    timestamp: number
  }
  unread_count: number
}

export interface VideoRoom {
  room_id: string
  creator: string
  created_at: number
  participants?: {
    id: string
    name: string
    role: string
    avatar?: string
  }[]
  patient_id?: string
  doctor_id?: string
}

export interface Doctor {
  id: string
  name: string
  email: string
  role: string
  specialty: string
  status: string
  availability: boolean
  avatar: string
  existing_chat_room?: string
}

export interface Report {
  id: string
  filename: string
  date: string
  url: string
}

// API functions
export const ApiService = {
  // Auth
  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/api/login", { email, password })

      // Store user data for socket connection
      if (response.data.id) {
        localStorage.setItem("user_id", response.data.id)
        localStorage.setItem("user_data", JSON.stringify(response.data))
      }

      return response.data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  },

  register: async (name: string, email: string, password: string, role: "patient" | "doctor", specialty?: string) => {
    const userData = { name, email, password, role }
    if (role === "doctor" && specialty) {
      Object.assign(userData, { specialty })
    }

    try {
      const response = await api.post("/api/register", userData)

      // Store user data for socket connection
      if (response.data.id) {
        localStorage.setItem("user_id", response.data.id)
        localStorage.setItem("user_data", JSON.stringify(response.data))
      }

      return response.data
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/api/logout")

      // Clear user data
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_data")

      return response.data
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/token/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
          withCredentials: false, // Changed to false
        },
      )
      return response.data
    } catch (error) {
      console.error("Token refresh error:", error)
      throw error
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/api/user")

      // Store user data for socket connection
      if (response.data.id) {
        localStorage.setItem("user_id", response.data.id)
        localStorage.setItem("user_data", JSON.stringify(response.data))
      }

      return response.data
    } catch (error) {
      console.error("Error fetching user data:", error)
      throw error
    }
  },

  // Models
  getModels: async (): Promise<Models> => {
    try {
      const response = await api.get("/api/models")
      return response.data
    } catch (error) {
      console.error("Error fetching models:", error)
      throw error
    }
  },

  // Diagnosis
  predictImage: async (file: File, modelKey: string): Promise<PredictionResult> => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("model", modelKey)

      const response = await api.post("/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error predicting image:", error)
      throw error
    }
  },

  // Symptom Checker
  checkSymptoms: async (
    symptoms: string,
    age: string,
    gender: string,
    medicalHistory: string,
  ): Promise<SymptomCheckerResult> => {
    try {
      const response = await api.post("/api/check-symptoms", {
        symptoms,
        age,
        gender,
        medicalHistory,
      })
      return response.data
    } catch (error) {
      console.error("Error checking symptoms:", error)
      throw error
    }
  },

  // AI Chat
  sendChatMessage: async (message: string): Promise<string> => {
    try {
      const response = await api.post("/api/chat", { message })
      return response.data.response
    } catch (error) {
      console.error("Error sending chat message:", error)
      throw error
    }
  },

  // Chat Rooms
  getChatRooms: async (): Promise<ChatRoom[]> => {
    try {
      const response = await api.get("/api/chat/rooms")
      return response.data
    } catch (error) {
      console.error("Error fetching chat rooms:", error)
      throw error
    }
  },

  getChatHistory: async (roomId: string): Promise<ChatMessage[]> => {
    try {
      const response = await api.get(`/api/chat/history/${roomId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching chat history:", error)
      throw error
    }
  },

  createChatRoom: async (userId: string): Promise<ChatRoom> => {
    try {
      const response = await api.post("/api/chat/create-room", { user_id: userId })
      return response.data
    } catch (error) {
      console.error("Error creating chat room:", error)
      throw error
    }
  },

  markMessagesAsRead: async (roomId: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.post(`/api/chat/mark-read/${roomId}`)
      return response.data
    } catch (error) {
      console.error("Error marking messages as read:", error)
      throw error
    }
  },

  // Doctors
  getDoctors: async (filters?: { specialty?: string; name?: string; availability?: boolean }): Promise<Doctor[]> => {
    try {
      let url = "/api/doctors"
      if (filters) {
        const params = new URLSearchParams()
        if (filters.specialty) params.append("specialty", filters.specialty)
        if (filters.name) params.append("name", filters.name)
        if (filters.availability !== undefined) params.append("availability", String(filters.availability))

        if (params.toString()) {
          url += `?${params.toString()}`
        }
      }

      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error("Error fetching doctors:", error)
      throw error
    }
  },

  updateDoctorAvailability: async (availability: boolean): Promise<{ success: boolean; availability: boolean }> => {
    try {
      const response = await api.post("/api/doctors/availability", { availability })
      return response.data
    } catch (error) {
      console.error("Error updating doctor availability:", error)
      throw error
    }
  },

  // Video Calls
  // Improve the video call API functions

  // Update the createVideoRoom function to better handle room creation
  createVideoRoom: async (doctorId?: string): Promise<VideoRoom> => {
    try {
      console.log("Creating video room", doctorId ? `with doctor: ${doctorId}` : "without specific doctor")
      const data = doctorId ? { doctor_id: doctorId } : {}
      const response = await api.post("/api/video/create-room", data)
      console.log("Video room created successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("Error creating video room:", error)
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to create room: ${error.response.data.error || error.message}`)
      }
      throw error
    }
  },

  // Update the joinVideoRoom function to better handle room joining
  joinVideoRoom: async (roomId: string): Promise<VideoRoom> => {
    try {
      console.log("Joining video room:", roomId)
      const response = await api.post(`/api/video/join-room/${roomId}`)
      console.log("Joined video room successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("Error joining video room:", error)
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to join room: ${error.response.data.error || error.message}`)
      }
      throw error
    }
  },

  // Add a function to check if a room exists and is joinable
  checkVideoRoom: async (roomId: string): Promise<boolean> => {
    try {
      console.log("Checking if video room exists:", roomId)
      const response = await api.get(`/api/video/check-room/${roomId}`)
      return response.data.exists && response.data.active
    } catch (error) {
      console.error("Error checking video room:", error)
      return false
    }
  },

  respondToVideoCall: async (roomId: string, accept: boolean): Promise<{ status: string; room_id: string }> => {
    try {
      const response = await api.post(`/api/video/respond/${roomId}`, {
        response: accept ? "accept" : "reject",
      })
      return response.data
    } catch (error) {
      console.error("Error responding to video call:", error)
      throw error
    }
  },

  endVideoRoom: async (
    roomId: string,
    data?: { reason?: string; follow_up?: string; notes?: string },
  ): Promise<{ success: boolean }> => {
    try {
      const response = await api.post(`/api/video/end-room/${roomId}`, data || {})
      return response.data
    } catch (error) {
      console.error("Error ending video room:", error)
      throw error
    }
  },

  getVideoRooms: async (): Promise<VideoRoom[]> => {
    try {
      const response = await api.get("/api/video/rooms")
      return response.data
    } catch (error) {
      console.error("Error fetching video rooms:", error)
      throw error
    }
  },

  getVideoHistory: async (): Promise<any[]> => {
    try {
      const response = await api.get("/api/video/history")
      return response.data
    } catch (error) {
      console.error("Error fetching video history:", error)
      throw error
    }
  },

  // Reports
  getUserReports: async (): Promise<Report[]> => {
    try {
      const response = await api.get("/api/reports")
      return response.data
    } catch (error) {
      console.error("Error fetching reports:", error)
      throw error
    }
  },

  downloadReport: (reportUrl: string): void => {
    window.open(`${API_BASE_URL}${reportUrl}`, "_blank")
  },

  // Get socket URL
  getSocketUrl: (): string => {
    return SOCKET_URL
  },
}

export default ApiService
