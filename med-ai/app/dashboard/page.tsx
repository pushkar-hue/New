"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { ApiService } from "@/lib/api-service"
import Link from "next/link"
import {
  Activity,
  FileText,
  Calendar,
  MessageSquare,
  Video,
  Users,
  Clock,
  ChevronRight,
  BarChart3,
  Stethoscope,
  MapPin,
} from "lucide-react"

interface Report {
  id: string
  date: string
  model: string
  prediction: string
  confidence: number
  url: string
}

interface Appointment {
  id: string
  doctor: string
  date: string
  time: string
  status: "upcoming" | "completed" | "cancelled"
  type: "in-person" | "video"
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // Fetch reports from the API
        const reports = await ApiService.getUserReports()
        setRecentReports(
          reports.map((report) => ({
            id: report.id,
            date: report.date,
            model: report.filename.includes("skin")
              ? "Skin Cancer Classification"
              : report.filename.includes("covid")
                ? "COVID-19 Analysis"
                : report.filename.includes("pneumonia")
                  ? "Pneumonia Detection"
                  : "Medical Analysis",
            prediction: report.filename.includes("benign")
              ? "Benign"
              : report.filename.includes("normal")
                ? "Normal"
                : "Analysis Complete",
            confidence: Math.floor(Math.random() * 15) + 85, // Mock data
            url: report.url,
          })),
        )

        // In a real app, you would fetch appointments from the API
        // For now, we'll use mock data
        setAppointments([
          {
            id: "1",
            doctor: "Dr. Sarah Johnson",
            date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
            time: "10:00 AM",
            status: "upcoming",
            type: "video",
          },
          {
            id: "2",
            doctor: "Dr. Michael Chen",
            date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
            time: "2:30 PM",
            status: "upcoming",
            type: "in-person",
          },
          {
            id: "3",
            doctor: "Dr. Emily Rodriguez",
            date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            time: "11:15 AM",
            status: "completed",
            type: "video",
          },
        ])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleDownloadReport = (reportUrl: string) => {
    ApiService.downloadReport(reportUrl)
  }

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            {user?.role === "patient" ? (
              <>
                <Button asChild>
                  <Link href="/diagnosis">New Diagnosis</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/chat-with-doctor">Chat with Doctor</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/patients">View Patients</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/appointments">Manage Appointments</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {user?.role === "patient" ? (
          <PatientDashboard
            recentReports={recentReports}
            appointments={appointments}
            isLoading={isLoading}
            onDownloadReport={handleDownloadReport}
          />
        ) : (
          <DoctorDashboard appointments={appointments} isLoading={isLoading} />
        )}
      </div>
    </PageLayout>
  )
}

function PatientDashboard({
  recentReports,
  appointments,
  isLoading,
  onDownloadReport,
}: {
  recentReports: Report[]
  appointments: Appointment[]
  isLoading: boolean
  onDownloadReport: (url: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Quick Actions */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-4" asChild>
              <Link href="/diagnosis">
                <Activity className="h-8 w-8 mb-2 text-primary" />
                <span>New Diagnosis</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-4" asChild>
              <Link href="/symptom-checker">
                <Stethoscope className="h-8 w-8 mb-2 text-primary" />
                <span>Check Symptoms</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-4" asChild>
              <Link href="/chat">
                <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                <span>AI Chat</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-4" asChild>
              <Link href="/chat-with-doctor">
                <Video className="h-8 w-8 mb-2 text-primary" />
                <span>Video Consultation</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Your latest diagnostic reports</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports" className="flex items-center">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted rounded"></div>
                      <div className="h-4 w-24 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="h-9 w-24 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : recentReports.length > 0 ? (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{report.model}</h3>
                      <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            report.prediction.toLowerCase().includes("normal") ||
                            report.prediction.toLowerCase().includes("benign")
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          }`}
                        >
                          {report.prediction}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {report.confidence.toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onDownloadReport(report.url)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center rounded-full bg-muted p-6 mb-4">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No reports found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't generated any diagnostic reports yet. Use our diagnosis tools to analyze medical images and
                generate reports.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/diagnosis">Go to Diagnosis</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled consultations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : appointments.filter((a) => a.status === "upcoming").length > 0 ? (
            <div className="space-y-4">
              {appointments
                .filter((a) => a.status === "upcoming")
                .map((appointment) => (
                  <div key={appointment.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{appointment.doctor}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          appointment.type === "video"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                        }`}
                      >
                        {appointment.type === "video" ? "Video Call" : "In-person"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(appointment.date).toLocaleDateString()}</span>
                      <Clock className="h-3 w-3 ml-3 mr-1" />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="flex justify-between">
                      {appointment.type === "video" ? (
                        <Button size="sm" asChild>
                          <Link href="/video-call">
                            <Video className="h-4 w-4 mr-1" />
                            Join Call
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          <MapPin className="h-4 w-4 mr-1" />
                          Directions
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center rounded-full bg-muted p-4 mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium mb-2">No upcoming appointments</h3>
              <p className="text-sm text-muted-foreground mb-4">Schedule a consultation with a healthcare provider.</p>
              <Button size="sm" asChild>
                <Link href="/appointments">Schedule Appointment</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DoctorDashboard({
  appointments,
  isLoading,
}: {
  appointments: Appointment[]
  isLoading: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Overview */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Patients</h3>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-xs text-muted-foreground">+3 this week</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Appointments</h3>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Next: Today at 2:00 PM</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Reports</h3>
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">36</p>
              <p className="text-xs text-muted-foreground">8 pending review</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Messages</h3>
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">3 unread</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your appointments for today</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/appointments" className="flex items-center">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted rounded"></div>
                      <div className="h-4 w-24 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="h-9 w-24 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">John Smith</h3>
                      <p className="text-sm text-muted-foreground">Follow-up Consultation</p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-0.5 rounded">
                    Video Call
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>10:00 AM - 10:30 AM</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm">
                    <Video className="h-4 w-4 mr-1" />
                    Start Call
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Emily Johnson</h3>
                      <p className="text-sm text-muted-foreground">Initial Consultation</p>
                    </div>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-2 py-0.5 rounded">
                    In-person
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>2:00 PM - 2:45 PM</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    View Records
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Michael Brown</h3>
                      <p className="text-sm text-muted-foreground">Test Results Review</p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-0.5 rounded">
                    Video Call
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>4:30 PM - 5:00 PM</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm">
                    <Video className="h-4 w-4 mr-1" />
                    Start Call
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Statistics</CardTitle>
          <CardDescription>Overview of your patient data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Diagnosis Categories</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Skin Conditions</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "42%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Respiratory</span>
                    <span>28%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "28%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cardiovascular</span>
                    <span>15%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "15%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Other</span>
                    <span>15%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "15%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Age Distribution</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="bg-primary/10 rounded-lg p-2 mb-1">
                    <span className="text-lg font-bold">15%</span>
                  </div>
                  <span className="text-xs">0-18</span>
                </div>
                <div>
                  <div className="bg-primary/10 rounded-lg p-2 mb-1">
                    <span className="text-lg font-bold">32%</span>
                  </div>
                  <span className="text-xs">19-35</span>
                </div>
                <div>
                  <div className="bg-primary/10 rounded-lg p-2 mb-1">
                    <span className="text-lg font-bold">38%</span>
                  </div>
                  <span className="text-xs">36-65</span>
                </div>
                <div>
                  <div className="bg-primary/10 rounded-lg p-2 mb-1">
                    <span className="text-lg font-bold">15%</span>
                  </div>
                  <span className="text-xs">65+</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
