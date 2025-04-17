"use client"

import { io, type Socket } from "socket.io-client"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"

let socket: Socket | null = null

// Add socket to window for global access
declare global {
  interface Window {
    socket: Socket | null
  }
}

// Update the socket initialization to match the Flask backend's expectations
export const initializeSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem("access_token")
    const userId = getUserIdFromToken()

    console.log("Initializing socket connection")

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      withCredentials: false, // Changed to match Flask CORS config
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // Increased timeout for better reliability
      auth: token ? { token } : undefined, // Remove Bearer prefix to match Flask
      query: userId ? { user_id: userId } : undefined, // Add user_id to query params
    })

    socket.on("connect", () => {
      console.log("Socket connected successfully")

      // If user is logged in, emit user_connected event
      if (userId) {
        console.log("Emitting user_connected event with user_id:", userId)
        socket.emit("user_connected", { user_id: userId })
      }
    })

    // Add handlers for video call requests and responses
    socket.on("video_call_request", (data) => {
      console.log("Received video call request:", data)
      // Show notification for incoming call
      toast({
        title: "Incoming Video Call",
        description: `${data.patient_name || data.doctor_name} is calling you`,
        action: <Button onClick={() => (window.location.href = `/video-call?room=${data.room_id}`)}>Join Call</Button>,
      })
    })

    socket.on("video_call_accepted", (data) => {
      console.log("Video call accepted:", data)
      toast({
        title: "Call Accepted",
        description: `${data.accepted_by} accepted your call`,
      })
    })

    socket.on("video_call_rejected", (data) => {
      console.log("Video call rejected:", data)
      toast({
        title: "Call Rejected",
        description: `${data.rejected_by} rejected your call`,
      })
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    // Make socket available globally
    if (typeof window !== "undefined") {
      window.socket = socket
    }
  }

  return socket
}

// Helper to extract user ID from JWT token
function getUserIdFromToken(): string | null {
  try {
    // First try to get user_id from localStorage
    const userId = localStorage.getItem("user_id")
    if (userId) return userId

    // If not found, try to extract from token
    const token = localStorage.getItem("access_token")
    if (!token) return null

    // Extract payload from JWT
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(window.atob(base64))

    // Get user ID from payload
    return payload.sub || payload.user_id || null
  } catch (error) {
    console.error("Error extracting user ID from token:", error)
    return null
  }
}

export const getSocket = (): Socket | null => {
  if (!socket) {
    return initializeSocket()
  }
  return socket
}

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
    if (typeof window !== "undefined") {
      window.socket = null
    }
  }
}

export const useSocket = (): { socket: Socket | null; isConnected: boolean } => {
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    const socketInstance = initializeSocket()

    const onConnect = () => {
      setIsConnected(true)
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }

    socketInstance.on("connect", onConnect)
    socketInstance.on("disconnect", onDisconnect)

    // Set initial connection state
    setIsConnected(socketInstance.connected)

    return () => {
      socketInstance.off("connect", onConnect)
      socketInstance.off("disconnect", onDisconnect)
    }
  }, [])

  return { socket, isConnected }
}

// Improve the joinRoom function to ensure proper room joining
export const joinRoom = (roomId: string): void => {
  if (socket) {
    console.log("Joining room:", roomId)
    socket.emit("join", { room: roomId })
  } else {
    console.error("Cannot join room: Socket not initialized")
  }
}

export const leaveRoom = (roomId: string): void => {
  if (socket) {
    socket.emit("leave", { room: roomId })
  }
}

export const sendMessage = (roomId: string, message: string, senderId: string, senderName: string): void => {
  if (socket) {
    socket.emit("message", {
      room: roomId,
      message,
      sender_id: senderId,
      sender_name: senderName,
    })
  }
}

// Improve the video signaling functions
export const sendVideoOffer = (roomId: string, offer: any, senderId: string): void => {
  if (socket) {
    console.log("Sending video offer to room:", roomId)
    socket.emit("video-offer", {
      room: roomId,
      offer,
      sender_id: senderId,
    })
  } else {
    console.error("Cannot send video offer: Socket not initialized")
  }
}

export const sendVideoAnswer = (roomId: string, answer: any, senderId: string): void => {
  if (socket) {
    console.log("Sending video answer to room:", roomId)
    socket.emit("video-answer", {
      room: roomId,
      answer,
      sender_id: senderId,
    })
  } else {
    console.error("Cannot send video answer: Socket not initialized")
  }
}

export const sendIceCandidate = (roomId: string, candidate: any, senderId: string): void => {
  if (socket) {
    console.log("Sending ICE candidate to room:", roomId)
    socket.emit("ice-candidate", {
      room: roomId,
      candidate,
      sender_id: senderId,
    })
  } else {
    console.error("Cannot send ICE candidate: Socket not initialized")
  }
}

export const leaveVideoRoom = (roomId: string, userId: string): void => {
  if (socket) {
    socket.emit("leave-room", {
      room: roomId,
      user_id: userId,
    })
  }
}

export default {
  initializeSocket,
  getSocket,
  closeSocket,
  useSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  sendVideoOffer,
  sendVideoAnswer,
  sendIceCandidate,
  leaveVideoRoom,
}
