"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Mic, MicOff, VideoIcon, VideoOff, PhoneOff, MessageSquare, Users, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApiService } from "@/lib/api-service"
import SocketService, {
  useSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  sendVideoOffer,
  sendVideoAnswer,
  sendIceCandidate,
  leaveVideoRoom,
} from "@/lib/socket-service"
import { toast } from "@/components/ui/use-toast"
import { VideoDebugHelper } from "./debug-helper"

export default function VideoCallPage() {
  return (
    <ProtectedRoute>
      <VideoCallContent />
    </ProtectedRoute>
  )
}

function VideoCallContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const roomIdParam = searchParams.get("room")

  const [activeTab, setActiveTab] = useState("join")
  const [roomId, setRoomId] = useState(roomIdParam || "")
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [callInfo, setCallInfo] = useState<any>(null)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)
  const [callDuration, setCallDuration] = useState("00:00:00")
  const [callStartTime, setCallStartTime] = useState<number | null>(null)
  const [showDebugHelper, setShowDebugHelper] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const { socket, isConnected } = useSocket()

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isInCall && callStartTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const diff = now - callStartTime
        const hours = Math.floor(diff / 3600000)
          .toString()
          .padStart(2, "0")
        const minutes = Math.floor((diff % 3600000) / 60000)
          .toString()
          .padStart(2, "0")
        const seconds = Math.floor((diff % 60000) / 1000)
          .toString()
          .padStart(2, "0")
        setCallDuration(`${hours}:${minutes}:${seconds}`)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isInCall, callStartTime])

  // Initialize camera when component mounts
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        setLocalStream(stream)

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        console.log("Camera initialized successfully")
      } catch (err) {
        console.error("Error initializing camera:", err)
        setShowDebugHelper(true)
      }
    }

    initCamera()

    return () => {
      // Clean up the stream when component unmounts
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    // If room ID is provided in URL, join automatically
    if (roomIdParam && user && isConnected) {
      setRoomId(roomIdParam)
      handleJoinCall()
    }
  }, [roomIdParam, user, isConnected])

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = SocketService.initializeSocket()

    // Set up socket event listeners for WebRTC signaling
    if (socketInstance) {
      socketInstance.on("video-offer", async (data) => {
        console.log("Received video offer", data)
        if (data.sender_id !== user?.id) {
          try {
            await handleVideoOffer(data.offer)
          } catch (error) {
            console.error("Error handling video offer:", error)
          }
        }
      })

      socketInstance.on("video-answer", (data) => {
        console.log("Received video answer", data)
        if (data.sender_id !== user?.id) {
          handleVideoAnswer(data.answer)
        }
      })

      socketInstance.on("ice-candidate", (data) => {
        console.log("Received ICE candidate", data)
        if (data.sender_id !== user?.id) {
          handleNewICECandidate(data.candidate)
        }
      })

      socketInstance.on("user-left", (data) => {
        handleUserLeft(data.user_id)
      })

      socketInstance.on("video_room_ended", (data) => {
        toast({
          title: "Call Ended",
          description: `Call ended by ${data.ended_by}: ${data.end_reason}`,
        })
        closeVideoCall()
      })

      socketInstance.on("user_joined_video", (data) => {
        toast({
          title: "User Joined",
          description: `${data.user.name} has joined the call`,
        })
      })

      socketInstance.on("message", (data) => {
        const newMessage = {
          sender: data.sender_name,
          text: data.content,
          time: new Date(data.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, newMessage])
      })
    }

    return () => {
      // Clean up
      if (socketInstance) {
        socketInstance.off("video-offer")
        socketInstance.off("video-answer")
        socketInstance.off("ice-candidate")
        socketInstance.off("user-left")
        socketInstance.off("video_room_ended")
        socketInstance.off("user_joined_video")
        socketInstance.off("message")
      }

      closeVideoCall()
    }
  }, [user])

  useEffect(() => {
    // Join room when in call
    if (isInCall && roomId) {
      joinRoom(roomId)
    }

    return () => {
      if (isInCall && roomId) {
        leaveRoom(roomId)
      }
    }
  }, [isInCall, roomId])

  useEffect(() => {
    // Update video element whenever stream changes or call state changes
    if (localVideoRef.current && localStream) {
      console.log("Updating local video element with stream")
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch(console.error)
    }
  }, [localStream, isInCall]) // Add this after other useEffects
  

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
    }

    const pc = new RTCPeerConnection(configuration)

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId && user) {
        console.log("Sending ICE candidate:", event.candidate)
        sendIceCandidate(roomId, event.candidate, user.id)
      }
    }

    pc.ontrack = (event) => {
      console.log("Received remote track", event.streams)
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState)
    }

    peerConnectionRef.current = pc
    return pc
  }

  const handleVideoOffer = async (offer: RTCSessionDescriptionInit) => {
    console.log("Handling video offer")

    // Create a new peer connection if one doesn't exist
    if (!peerConnectionRef.current) {
      console.log("Creating new peer connection for offer")
      createPeerConnection()
    }

    const pc = peerConnectionRef.current
    if (!pc) {
      console.error("Failed to create peer connection")
      return
    }

    try {
      // Set the remote description first
      console.log("Setting remote description from offer")
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      console.log("Remote description set successfully")

      // Ensure we have a local stream
      let stream = localStream

      // If no stream exists, get a new one
      if (!stream) {
        console.log("Getting new media stream")
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        // Apply current mute settings
        stream.getVideoTracks().forEach((track) => {
          track.enabled = !isVideoOff
        })

        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted
        })

        setLocalStream(stream)
      }

      // Display local video
      if (localVideoRef.current) {
        console.log("Setting local video stream")
        localVideoRef.current.srcObject = stream
      }

      // Add tracks to peer connection
      console.log("Adding tracks to peer connection")
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream!)
      })

      // Create answer
      console.log("Creating answer")
      const answer = await pc.createAnswer()
      console.log("Setting local description (answer)")
      await pc.setLocalDescription(answer)

      // Send answer
      if (roomId && user) {
        console.log("Sending video answer")
        sendVideoAnswer(roomId, pc.localDescription, user.id)
      }

      console.log("Video offer handling complete")
    } catch (error) {
      console.error("Error in handleVideoOffer:", error)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  const handleVideoAnswer = (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current
    if (!pc) return

    pc.setRemoteDescription(new RTCSessionDescription(answer))
      .then(() => console.log("Set remote description from answer"))
      .catch((error) => console.error("Error setting remote description:", error))
  }

  const handleNewICECandidate = (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current
    if (!pc) return

    pc.addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => console.log("Added ICE candidate"))
      .catch((error) => console.error("Error adding ICE candidate:", error))
  }

  const handleUserLeft = (userId: string) => {
    // Handle user leaving the call
    if (userId !== user?.id) {
      toast({
        title: "User Left",
        description: "The other participant has left the call",
      })
      closeVideoCall()
    }
  }

  const closeVideoCall = () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Don't stop local video when closing call, just when component unmounts
    // This allows the camera to stay on for the next call

    // Stop remote video
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const remoteStream = remoteVideoRef.current.srcObject as MediaStream
      remoteStream.getTracks().forEach((track) => track.stop())
      remoteVideoRef.current.srcObject = null
    }

    setIsInCall(false)
    setCallStartTime(null)
    setCallDuration("00:00:00")
  }

  const handleJoinCall = async () => {
    try {
      // First ensure we have a local stream before doing anything else
      let stream = localStream
      let needsNewStream = !stream || 
        stream.getVideoTracks()[0]?.enabled === isVideoOff ||
        stream.getAudioTracks()[0]?.enabled === isMuted
  
      if (needsNewStream) {
        // Stop any existing tracks
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
  
        // Get new stream with current settings
        stream = await navigator.mediaDevices.getUserMedia({
          video: true, // Always request video
          audio: true, // Always request audio
        })
  
        // Apply mute settings after getting the stream
        stream.getVideoTracks().forEach((track) => {
          track.enabled = !isVideoOff
        })
  
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted
        })
  
        setLocalStream(stream)
      }
      // Ensure local video is displayed
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        console.log("Local video stream set to video element")
      }

      // Now handle room creation or joining
      let roomToJoin = roomId
      let roomResponse

      if (!roomToJoin) {
        // Create a new room if no room ID is provided
        console.log("Creating new room")
        roomResponse = await ApiService.createVideoRoom()
        roomToJoin = roomResponse.room_id
        setRoomId(roomToJoin)
        setCallInfo(roomResponse)

        console.log("Room created:", roomToJoin)

        // Set other participant info
        if (roomResponse.doctor) {
          setOtherParticipant({
            id: roomResponse.doctor.id,
            name: roomResponse.doctor.name,
            role: "doctor",
            specialty: roomResponse.doctor.specialty,
          })
        } else if (roomResponse.patient) {
          setOtherParticipant({
            id: roomResponse.patient.id,
            name: roomResponse.patient.name,
            role: "patient",
          })
        }
      } else {
        // Join existing room
        console.log("Joining existing room:", roomToJoin)
        roomResponse = await ApiService.joinVideoRoom(roomToJoin)
        setCallInfo(roomResponse)

        // Find the other participant
        if (roomResponse.participants) {
          const other = roomResponse.participants.find((p) => p.id !== user?.id)
          if (other) {
            setOtherParticipant(other)
          }
        }
      }

      // Join the socket room
      joinRoom(roomToJoin)
      console.log("Joined socket room:", roomToJoin)

      // Create peer connection
      const pc = createPeerConnection()
      console.log("Peer connection created")

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream!)
      })
      console.log("Added tracks to peer connection")

      // Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log("Created and set local description (offer)")

      if (user) {
        sendVideoOffer(roomToJoin, pc.localDescription, user.id)
        console.log("Sent video offer")
      }

      setIsInCall(true)
      setCallStartTime(Date.now())

      toast({
        title: "Call Started",
        description: "You have joined the video call",
      })
    } catch (error) {
      console.error("Error joining call:", error)
      setShowDebugHelper(true)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to join the call: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  const handleEndCall = () => {
    if (roomId && user) {
      leaveVideoRoom(roomId, user.id)
      ApiService.endVideoRoom(roomId, { reason: "Call ended by user" }).catch((error) => {
        console.error("Error ending room:", error)
      })
    }

    closeVideoCall()
    toast({
      title: "Call Ended",
      description: "You have ended the call",
    })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    const newMessage = {
      sender: user?.name || "You",
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setMessageInput("")

    // Send message via socket
    if (roomId && user) {
      sendMessage(roomId, messageInput, user.id, user.name)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted // Inverse because we're toggling state
      })
    }
  }

  
const toggleVideo = () => {
  setIsVideoOff(!isVideoOff)
  if (localStream) {
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOff // Inverse because we're toggling state
    })
  }
}
  if (isInCall) {
    return (
      <PageLayout>
        <div className="container py-6">
          {showDebugHelper && <VideoDebugHelper />}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main video area */}
            <div className="lg:col-span-3 space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                      if (remoteVideoRef.current) {
                        remoteVideoRef.current.play().catch(console.error)
                      }
                    }}
                  ></video>
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video 
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (localVideoRef.current) {
                      localVideoRef.current.play().catch(console.error)
                    }
                  }}
                />
                </div>
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {otherParticipant?.name || "Connecting..."}
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? (
                      <VideoOff className="h-5 w-5 text-white" />
                    ) : (
                      <VideoIcon className="h-5 w-5 text-white" />
                    )}
                  </Button>
                  <Button variant="destructive" size="icon" className="rounded-full" onClick={handleEndCall}>
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Call Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {otherParticipant?.role === "doctor" ? "Doctor:" : "Patient:"}
                      </span>
                      <span className="font-medium">{otherParticipant?.name || "Unknown"}</span>
                    </div>
                    {otherParticipant?.specialty && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Specialty:</span>
                        <span className="font-medium">{otherParticipant.specialty}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Call Duration:</span>
                      <span className="font-medium">{callDuration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room ID:</span>
                      <span className="font-medium">{roomId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat sidebar */}
            <div className="lg:col-span-1">
              <Card className="h-[calc(100vh-12rem)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100%-5rem)]">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            msg.sender === user?.name || msg.sender === "You" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.sender === user?.name || msg.sender === "You"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div className="text-xs mb-1">
                              {msg.sender} • {msg.time}
                            </div>
                            <div>{msg.text}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="mt-auto">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                      />
                      <Button type="submit" size="icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="m22 2-7 20-4-9-9-4Z" />
                          <path d="M22 2 11 13" />
                        </svg>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Video Consultation</h1>

        {showDebugHelper && <VideoDebugHelper />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Start or Join a Video Call</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="join">Join a Call</TabsTrigger>
                    <TabsTrigger value="create">Create a Call</TabsTrigger>
                  </TabsList>

                  <TabsContent value="join" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomId">Room ID</Label>
                      <Input
                        id="roomId"
                        placeholder="Enter room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleJoinCall} className="w-full" disabled={!isConnected || !roomId}>
                      Join Call
                    </Button>
                  </TabsContent>

                  <TabsContent value="create" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Call Settings</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableVideo"
                            className="rounded"
                            checked={!isVideoOff}
                            onChange={() => setIsVideoOff(!isVideoOff)}
                          />
                          <Label htmlFor="enableVideo">Enable Video</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableAudio"
                            className="rounded"
                            checked={!isMuted}
                            onChange={() => setIsMuted(!isMuted)}
                          />
                          <Label htmlFor="enableAudio">Enable Audio</Label>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleJoinCall} className="w-full" disabled={!isConnected}>
                      Start New Call
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>How Video Consultations Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <VideoIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Create or Join</h3>
                    <p className="text-sm text-muted-foreground">Start a new call or join with a room ID</p>
                  </div>
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Connect</h3>
                    <p className="text-sm text-muted-foreground">Connect with your healthcare provider</p>
                  </div>
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Consult</h3>
                    <p className="text-sm text-muted-foreground">Discuss your diagnosis and treatment options</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt={user?.name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="text-lg font-medium">{user?.name}</div>
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                    <div className="text-sm text-primary capitalize">{user?.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Camera Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                </div>
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowDebugHelper(!showDebugHelper)}>
                    {showDebugHelper ? "Hide Debug Helper" : "Show Debug Helper"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
