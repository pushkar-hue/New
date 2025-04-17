"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ApiService } from "@/lib/api-service"
import { initializeSocket, closeSocket } from "@/lib/socket-service"

export interface User {
  id: string
  name: string
  email: string
  role: "patient" | "doctor" | "admin"
  avatar?: string
  specialty?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: "patient" | "doctor",
    specialty?: string,
  ) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  accessToken: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (!refreshToken) {
        return false
      }

      const response = await ApiService.refreshToken()
      const { access_token } = response
      localStorage.setItem("access_token", access_token)
      setAccessToken(access_token)
      return true
    } catch (error) {
      console.error("Token refresh error:", error)
      return false
    }
  }

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("access_token")
        if (storedToken) {
          setAccessToken(storedToken)

          // Try to get user data from localStorage first
          const storedUserData = localStorage.getItem("user_data")
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData)
              setUser(userData)

              // Initialize socket connection
              initializeSocket()

              setIsLoading(false)
              return
            } catch (parseError) {
              console.error("Error parsing stored user data:", parseError)
              // Continue to fetch from API
            }
          }

          // Fetch user data from the server
          try {
            const userData = await ApiService.getCurrentUser()
            setUser(userData)

            // Initialize socket connection
            initializeSocket()
          } catch (error) {
            console.error("Error fetching user data:", error)
            // Try to refresh the token
            const refreshed = await refreshToken()
            if (!refreshed) {
              // Clear invalid tokens
              localStorage.removeItem("access_token")
              localStorage.removeItem("refresh_token")
              localStorage.removeItem("user_data")
              localStorage.removeItem("user_id")
              setAccessToken(null)
            } else {
              // Try fetching user data again with the new token
              try {
                const userData = await ApiService.getCurrentUser()
                setUser(userData)

                // Initialize socket connection
                initializeSocket()
              } catch (secondError) {
                console.error("Error fetching user data after token refresh:", secondError)
                localStorage.removeItem("access_token")
                localStorage.removeItem("refresh_token")
                localStorage.removeItem("user_data")
                localStorage.removeItem("user_id")
                setAccessToken(null)
              }
            }
          }
        }
      } catch (error) {
        console.error("Authentication error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Cleanup socket on unmount
    return () => {
      closeSocket()
    }
  }, [])

  // Update the login function to match Flask backend authentication
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await ApiService.login(email, password)
      const { access_token, refresh_token, ...userData } = response

      setUser(userData)
      setAccessToken(access_token)
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("refresh_token", refresh_token)
      localStorage.setItem("user_data", JSON.stringify(userData))
      localStorage.setItem("user_id", userData.id)

      // Initialize socket connection
      initializeSocket()
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Update the register function to match Flask backend response
  const register = async (
    name: string,
    email: string,
    password: string,
    role: "patient" | "doctor",
    specialty?: string,
  ) => {
    setIsLoading(true)
    try {
      const response = await ApiService.register(name, email, password, role, specialty)
      const { access_token, refresh_token, ...userInfo } = response

      setUser(userInfo)
      setAccessToken(access_token)
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("refresh_token", refresh_token)
      localStorage.setItem("user_data", JSON.stringify(userInfo))
      localStorage.setItem("user_id", userInfo.id)

      // Initialize socket connection
      initializeSocket()
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Update the logout function to match Flask backend
  const logout = async () => {
    try {
      // Call the logout endpoint
      await ApiService.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear user data regardless of API success
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user_data")
      localStorage.removeItem("user_id")

      // Disconnect socket
      closeSocket()

      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshToken,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
