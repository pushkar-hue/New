"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiService, type Doctor } from "@/lib/api-service"
import { useRouter } from "next/navigation"
import { Search, Video, MessageSquare, Filter } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function FindDoctor() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [specialty, setSpecialty] = useState<string>("")
  const [availableOnly, setAvailableOnly] = useState(false)
  const router = useRouter()

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    try {
      const filters: { specialty?: string; name?: string; availability?: boolean } = {}
      if (specialty && specialty !== "all") filters.specialty = specialty
      if (searchTerm) filters.name = searchTerm
      if (availableOnly) filters.availability = true

      const doctorsList = await ApiService.getDoctors(filters)
      setDoctors(doctorsList)
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load doctors. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }, [specialty, searchTerm, availableOnly])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDoctors()
  }

  const startChat = async (doctor: Doctor) => {
    try {
      // If there's an existing chat room, navigate to it
      if (doctor.existing_chat_room) {
        router.push(`/chat-with-doctor?room=${doctor.existing_chat_room}`)
        return
      }

      // Otherwise create a new chat room
      setLoading(true)
      const room = await ApiService.createChatRoom(doctor.id)
      router.push(`/chat-with-doctor?room=${room.id}`)
    } catch (error) {
      console.error("Error starting chat:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start chat. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const startVideoCall = async (doctor: Doctor) => {
    try {
      setLoading(true)
      const room = await ApiService.createVideoRoom(doctor.id)
      router.push(`/video-call?room=${room.room_id}`)
    } catch (error) {
      console.error("Error starting video call:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start video call. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredDoctors = doctors.filter((doctor) => doctor.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find a Doctor</CardTitle>
          <CardDescription>Connect with healthcare professionals for consultations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="General Medicine">General Medicine</SelectItem>
                <SelectItem value="Cardiology">Cardiology</SelectItem>
                <SelectItem value="Dermatology">Dermatology</SelectItem>
                <SelectItem value="Neurology">Neurology</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="availableOnly"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="availableOnly" className="text-sm">
                Available now
              </label>
            </div>
            <Button type="submit" className="md:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.name} />
                      <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                        doctor.status === "online" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                  </div>
                  <div>
                    <h3 className="font-medium">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={doctor.availability ? "success" : "secondary"}>
                    {doctor.availability ? "Available Now" : "Unavailable"}
                  </Badge>
                  <Badge variant="outline">{doctor.specialty}</Badge>
                </div>
                <div className="flex justify-between mt-4">
                  <Button size="sm" variant="outline" onClick={() => startChat(doctor)} className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => startVideoCall(doctor)}
                    disabled={!doctor.availability}
                    className="flex items-center"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Video Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No doctors found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search criteria or check back later for more healthcare professionals.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
