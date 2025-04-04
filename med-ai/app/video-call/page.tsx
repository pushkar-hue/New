"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Mic, MicOff, VideoIcon, VideoOff, Phone, PhoneOff, MessageSquare, Users, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function VideoCallPage() {
  return (
    <ProtectedRoute>
      <VideoCallContent />
    </ProtectedRoute>
  )
}

function VideoCallContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("join")
  const [roomId, setRoomId] = useState("")
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([])
  const [messageInput, setMessageInput] = useState("")
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Simulate a list of contacts
  const contacts = [
    { id: 1, name: "Dr. Sarah Johnson", role: "Radiologist", status: "online" },
    { id: 2, name: "Dr. Michael Chen", role: "Oncologist", status: "offline" },
    { id: 3, name: "Dr. Emily Rodriguez", role: "Dermatologist", status: "online" },
    { id: 4, name: "Dr. James Wilson", role: "Cardiologist", status: "busy" },
  ]

  useEffect(() => {
    // Simulate getting local video stream
    if (!isInCall) return

    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: !isVideoOff,
          audio: !isMuted,
        })

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Simulate remote video after 2 seconds
        setTimeout(() => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
          }
        }, 2000)
      } catch (err) {
        console.error("Error accessing media devices:", err)
      }
    }

    getLocalStream()

    return () => {
      // Clean up streams
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isInCall, isMuted, isVideoOff])

  const handleJoinCall = () => {
    setIsInCall(true)
  }

  const handleEndCall = () => {
    setIsInCall(false)
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

    // Simulate response after 1 second
    setTimeout(() => {
      const responseMessage = {
        sender: "Dr. Sarah Johnson",
        text: "Thank you for the information. Based on the images, I recommend scheduling a follow-up appointment next week.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, responseMessage])
    }, 1000)
  }

  if (isInCall) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main video area */}
            <div className="lg:col-span-3 space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                </div>
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  Dr. Sarah Johnson
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    onClick={() => setIsVideoOff(!isVideoOff)}
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
                      <span className="text-muted-foreground">Doctor:</span>
                      <span className="font-medium">Dr. Sarah Johnson</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Specialty:</span>
                      <span className="font-medium">Radiologist</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Call Duration:</span>
                      <span className="font-medium">00:05:23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room ID:</span>
                      <span className="font-medium">{roomId || "MediScan-123456"}</span>
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
                    <Button onClick={handleJoinCall} className="w-full">
                      Join Call
                    </Button>
                  </TabsContent>

                  <TabsContent value="create" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Call Settings</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="enableVideo" className="rounded" defaultChecked />
                          <Label htmlFor="enableVideo">Enable Video</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="enableAudio" className="rounded" defaultChecked />
                          <Label htmlFor="enableAudio">Enable Audio</Label>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleJoinCall} className="w-full">
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
                  <Users className="h-5 w-5 mr-2" />
                  Available Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" alt={contact.name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {contact.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                              contact.status === "online"
                                ? "bg-green-500"
                                : contact.status === "busy"
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                            }`}
                          ></span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">{contact.name}</div>
                          <div className="text-xs text-muted-foreground">{contact.role}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center"
                        onClick={() => {
                          setRoomId(`room-${contact.id}`)
                          handleJoinCall()
                        }}
                        disabled={contact.status !== "online"}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
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
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

