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
import { Send, User, Search, Clock, Calendar, PaperclipIcon, Image, FileText, MessageSquare } from "lucide-react"

interface ChatMessage {
  id: string
  sender: string
  senderRole: "patient" | "doctor"
  content: string
  timestamp: string
  read: boolean
}

interface ChatContact {
  id: string
  name: string
  role: "patient" | "doctor"
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  status: "online" | "offline" | "busy"
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

  // Mock contacts data
  const [contacts, setContacts] = useState<ChatContact[]>([
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      role: "doctor",
      lastMessage: "I've reviewed your latest test results.",
      lastMessageTime: "10:30 AM",
      unreadCount: 2,
      status: "online",
    },
    {
      id: "2",
      name: "Dr. Michael Chen",
      role: "doctor",
      lastMessage: "Let's schedule a follow-up appointment.",
      lastMessageTime: "Yesterday",
      unreadCount: 0,
      status: "offline",
    },
    {
      id: "3",
      name: "Dr. Emily Rodriguez",
      role: "doctor",
      lastMessage: "How are you feeling today?",
      lastMessageTime: "2 days ago",
      unreadCount: 0,
      status: "busy",
    },
    {
      id: "4",
      name: "John Smith",
      role: "patient",
      lastMessage: "Thank you for the consultation.",
      lastMessageTime: "3 days ago",
      unreadCount: 0,
      status: "online",
    },
  ])

  // Mock messages data
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({
    "1": [
      {
        id: "m1",
        sender: "Dr. Sarah Johnson",
        senderRole: "doctor",
        content: "Hello! I've reviewed your latest test results and everything looks good.",
        timestamp: "10:15 AM",
        read: true,
      },
      {
        id: "m2",
        sender: "Dr. Sarah Johnson",
        senderRole: "doctor",
        content: "Your blood pressure has improved since your last visit.",
        timestamp: "10:16 AM",
        read: true,
      },
      {
        id: "m3",
        sender: user?.name || "You",
        senderRole: "patient",
        content: "That's great news! I've been taking my medication regularly.",
        timestamp: "10:20 AM",
        read: true,
      },
      {
        id: "m4",
        sender: "Dr. Sarah Johnson",
        senderRole: "doctor",
        content: "Excellent! Continue with the current dosage and let's check again in a month.",
        timestamp: "10:25 AM",
        read: false,
      },
      {
        id: "m5",
        sender: "Dr. Sarah Johnson",
        senderRole: "doctor",
        content: "Do you have any questions or concerns about your treatment plan?",
        timestamp: "10:30 AM",
        read: false,
      },
    ],
    "2": [
      {
        id: "m1",
        sender: "Dr. Michael Chen",
        senderRole: "doctor",
        content: "Hello! How have you been feeling since our last appointment?",
        timestamp: "Yesterday, 2:45 PM",
        read: true,
      },
      {
        id: "m2",
        sender: user?.name || "You",
        senderRole: "patient",
        content: "I've been doing better, but still have some occasional pain.",
        timestamp: "Yesterday, 3:00 PM",
        read: true,
      },
      {
        id: "m3",
        sender: "Dr. Michael Chen",
        senderRole: "doctor",
        content: "Let's schedule a follow-up appointment to reassess your condition.",
        timestamp: "Yesterday, 3:15 PM",
        read: true,
      },
    ],
    "3": [
      {
        id: "m1",
        sender: "Dr. Emily Rodriguez",
        senderRole: "doctor",
        content: "Good morning! I wanted to check in on how you're doing with the new medication.",
        timestamp: "2 days ago, 9:30 AM",
        read: true,
      },
      {
        id: "m2",
        sender: user?.name || "You",
        senderRole: "patient",
        content: "The new medication seems to be working well. No side effects so far.",
        timestamp: "2 days ago, 10:15 AM",
        read: true,
      },
      {
        id: "m3",
        sender: "Dr. Emily Rodriguez",
        senderRole: "doctor",
        content: "That's excellent news! How are you feeling today?",
        timestamp: "2 days ago, 10:30 AM",
        read: true,
      },
    ],
    "4": [
      {
        id: "m1",
        sender: user?.name || "You",
        senderRole: "patient",
        content: "Thank you for the consultation yesterday, Dr. Smith.",
        timestamp: "3 days ago, 11:00 AM",
        read: true,
      },
      {
        id: "m2",
        sender: "John Smith",
        senderRole: "patient",
        content: "You're welcome! Don't hesitate to reach out if you have any questions.",
        timestamp: "3 days ago, 11:30 AM",
        read: true,
      },
    ],
  })

  useEffect(() => {
    scrollToBottom()
  }, [activeChat, chatMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activeChat) return

    const newMessage: ChatMessage = {
      id: `m${Date.now()}`,
      sender: user?.name || "You",
      senderRole: "patient",
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: true,
    }

    setChatMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }))

    setMessage("")

    // Simulate doctor response after 1-3 seconds
    if (activeChat === "1") {
      setTimeout(() => {
        const responseMessage: ChatMessage = {
          id: `m${Date.now() + 1}`,
          sender: "Dr. Sarah Johnson",
          senderRole: "doctor",
          content:
            "I'm glad to hear that. Remember to keep track of any changes in your symptoms and we'll discuss them during your next visit.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false,
        }

        setChatMessages((prev) => ({
          ...prev,
          [activeChat]: [...(prev[activeChat] || []), responseMessage],
        }))
      }, 2000)
    }
  }

  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const markMessagesAsRead = (contactId: string) => {
    setChatMessages((prev) => ({
      ...prev,
      [contactId]: prev[contactId].map((msg) => ({
        ...msg,
        read: true,
      })),
    }))

    setContacts((prev) => prev.map((contact) => (contact.id === contactId ? { ...contact, unreadCount: 0 } : contact)))
  }

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
                <div className="divide-y">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        activeChat === contact.id ? "bg-muted" : ""
                      }`}
                      onClick={() => {
                        setActiveChat(contact.id)
                        markMessagesAsRead(contact.id)
                      }}
                    >
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
                        <div className="ml-3 flex-1 overflow-hidden">
                          <div className="flex justify-between items-baseline">
                            <span className="font-medium truncate">{contact.name}</span>
                            <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                            {contact.unreadCount > 0 && (
                              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="doctors" className="flex-1 overflow-y-auto p-0 m-0">
                <div className="divide-y">
                  {filteredContacts
                    .filter((contact) => contact.role === "doctor")
                    .map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          activeChat === contact.id ? "bg-muted" : ""
                        }`}
                        onClick={() => {
                          setActiveChat(contact.id)
                          markMessagesAsRead(contact.id)
                        }}
                      >
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
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                              <span className="font-medium truncate">{contact.name}</span>
                              <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                              {contact.unreadCount > 0 && (
                                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {contact.unreadCount}
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
                  {filteredContacts
                    .filter((contact) => contact.role === "patient")
                    .map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          activeChat === contact.id ? "bg-muted" : ""
                        }`}
                        onClick={() => {
                          setActiveChat(contact.id)
                          markMessagesAsRead(contact.id)
                        }}
                      >
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
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                              <span className="font-medium truncate">{contact.name}</span>
                              <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                              {contact.unreadCount > 0 && (
                                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {contact.unreadCount}
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
            {activeChat ? (
              <>
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src="/placeholder.svg?height=40&width=40"
                        alt={contacts.find((c) => c.id === activeChat)?.name || ""}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contacts.find((c) => c.id === activeChat)?.name.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="font-medium">{contacts.find((c) => c.id === activeChat)?.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full mr-1 ${
                            contacts.find((c) => c.id === activeChat)?.status === "online"
                              ? "bg-green-500"
                              : contacts.find((c) => c.id === activeChat)?.status === "busy"
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                          }`}
                        ></span>
                        {contacts.find((c) => c.id === activeChat)?.status === "online"
                          ? "Online"
                          : contacts.find((c) => c.id === activeChat)?.status === "busy"
                            ? "Busy"
                            : "Offline"}
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
                  {chatMessages[activeChat]?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === "patient" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.senderRole === "doctor" && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt={msg.sender} />
                          <AvatarFallback className="bg-primary/10 text-primary">{msg.sender.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.senderRole === "patient" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-medium text-xs">{msg.sender}</span>
                          <span className="text-xs opacity-70 ml-2">{msg.timestamp}</span>
                        </div>
                        <p>{msg.content}</p>
                      </div>

                      {msg.senderRole === "patient" && (
                        <Avatar className="h-8 w-8 ml-2 mt-1">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt={msg.sender} />
                          <AvatarFallback className="bg-primary/10 text-primary">{msg.sender.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
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
                    <Button type="submit" size="icon">
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                  <div className="flex justify-center mt-2 space-x-2">
                    <Button variant="ghost" size="sm" className="text-xs flex items-center">
                      <Image className="h-3 w-3 mr-1" />
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

