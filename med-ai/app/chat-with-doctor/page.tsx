"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Send, User, Search, Clock, Calendar, PaperclipIcon, ImageIcon, FileText, MessageSquare } from "lucide-react"
import { ApiService, type ChatRoom } from "@/lib/api-service"
import SocketService, { useSocket, joinRoom, leaveRoom, sendMessage } from "@/lib/socket-service"

interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  sender_name: string
  content: string
  timestamp: number
  read: boolean
}

export default function ChatWithDoctorPage() {
  return (
    <ProtectedRoute>
      <ChatWithDoctorContent />
    </ProtectedRoute>
  )
}

function ChatWithDoctorContent() {
  const { user } = useAuth()
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = SocketService.initializeSocket()

    // Fetch chat rooms
    const fetchChatRooms = async () => {
      try {
        const rooms = await ApiService.getChatRooms()
        setChatRooms(rooms)
      } catch (error) {
        console.error("Error fetching chat rooms:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChatRooms()

    // Clean up socket connection
    return () => {
      if (activeChat) {
        leaveRoom(activeChat)
      }
    }
  }, [])

  useEffect(() => {
    // Set up socket message listener
    if (socket) {
      socket.on("message", (msg: ChatMessage) => {
        setChatMessages((prev) => ({
          ...prev,
          [msg.room_id]: [...(prev[msg.room_id] || []), msg],
        }))
      })
    }

    return () => {
      if (socket) {
        socket.off("message")
      }
    }
  }, [socket])

  useEffect(() => {
    scrollToBottom()
  }, [activeChat, chatMessages])

  useEffect(() => {
    // Fetch chat history when active chat changes
    if (activeChat) {
      const fetchChatHistory = async () => {
        try {
          const messages = await ApiService.getChatHistory(activeChat)
          setChatMessages((prev) => ({
            ...prev,
            [activeChat]: messages,
          }))

          // Join the socket room
          joinRoom(activeChat)
        } catch (error) {
          console.error("Error fetching chat history:", error)
        }
      }

      fetchChatHistory()

      // Leave previous room when changing chats
      return () => {
        leaveRoom(activeChat)
      }
    }
  }, [activeChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activeChat || !user) return

    // Send message via socket
    sendMessage(activeChat, message.trim(), user.id, user.name)

    setMessage("")
  }

  const filteredChatRooms = chatRooms.filter((room) =>
    room.other_participant.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <PageLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Medical Chat</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-16rem)]">
          {/* Contacts sidebar */}
          <div className="md:col-span-1 border rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="all" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-3 mx-4 mt-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="doctors">Doctors</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 overflow-y-auto p-0 m-0">
                {isLoading ? (
                  <div className="divide-y">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-muted"></div>
                          <div className="ml-3 flex-1">
                            <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                            <div className="h-3 w-1/2 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredChatRooms.length > 0 ? (
                  <div className="divide-y">
                    {filteredChatRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          activeChat === room.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setActiveChat(room.id)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src="/placeholder.svg?height=40&width=40"
                                alt={room.other_participant.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {room.other_participant.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></span>
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                              <span className="font-medium truncate">{room.other_participant.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {room.last_message
                                  ? new Date(room.last_message.timestamp * 1000).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground truncate">
                                {room.last_message ? room.last_message.content : "No messages yet"}
                              </p>
                              {room.unread_count > 0 && (
                                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {room.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">No conversations found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="doctors" className="flex-1 overflow-y-auto p-0 m-0">
                <div className="divide-y">
                  {filteredChatRooms
                    .filter((room) => room.other_participant.role === "doctor")
                    .map((room) => (
                      <div
                        key={room.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          activeChat === room.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setActiveChat(room.id)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src="/placeholder.svg?height=40&width=40"
                                alt={room.other_participant.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {room.other_participant.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></span>
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                              <span className="font-medium truncate">{room.other_participant.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {room.last_message
                                  ? new Date(room.last_message.timestamp * 1000).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground truncate">
                                {room.last_message ? room.last_message.content : "No messages yet"}
                              </p>
                              {room.unread_count > 0 && (
                                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {room.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="patients" className="flex-1 overflow-y-auto p-0 m-0">
                <div className="divide-y">
                  {filteredChatRooms
                    .filter((room) => room.other_participant.role === "patient")
                    .map((room) => (
                      <div
                        key={room.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          activeChat === room.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setActiveChat(room.id)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src="/placeholder.svg?height=40&width=40"
                                alt={room.other_participant.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {room.other_participant.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></span>
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                              <span className="font-medium truncate">{room.other_participant.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {room.last_message
                                  ? new Date(room.last_message.timestamp * 1000).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground truncate">
                                {room.last_message ? room.last_message.content : "No messages yet"}
                              </p>
                              {room.unread_count > 0 && (
                                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {room.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat area */}
          <div className="md:col-span-3 border rounded-lg overflow-hidden flex flex-col">
            {activeChat && chatRooms.length > 0 ? (
              <>
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src="/placeholder.svg?height=40&width=40"
                        alt={chatRooms.find((c) => c.id === activeChat)?.other_participant.name || ""}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {chatRooms.find((c) => c.id === activeChat)?.other_participant.name.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="font-medium">
                        {chatRooms.find((c) => c.id === activeChat)?.other_participant.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full mr-1 bg-green-500"></span>
                        Online
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <Calendar className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Clock className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages[activeChat]?.length > 0 ? (
                    chatMessages[activeChat].map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        {msg.sender_id !== user?.id && (
                          <Avatar className="h-8 w-8 mr-2 mt-1">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt={msg.sender_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {msg.sender_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-medium text-xs">{msg.sender_name}</span>
                            <span className="text-xs opacity-70 ml-2">
                              {new Date(msg.timestamp * 1000).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p>{msg.content}</p>
                        </div>

                        {msg.sender_id === user?.id && (
                          <Avatar className="h-8 w-8 ml-2 mt-1">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt={msg.sender_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {msg.sender_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-center">No messages yet</p>
                      <p className="text-sm text-muted-foreground text-center mt-1">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Button type="button" variant="ghost" size="icon">
                      <PaperclipIcon className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!isConnected}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                  <div className="flex justify-center mt-2 space-x-2">
                    <Button variant="ghost" size="sm" className="text-xs flex items-center">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Image
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      Document
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Choose a contact from the list to start chatting with your healthcare provider or patient.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
