"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Download, Calendar, Clock } from "lucide-react"

interface Report {
  id: string
  filename: string
  date: string
  model: string
  prediction: string
  url: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // Simulate fetching reports
  useEffect(() => {
    const fetchReports = async () => {
      // In a real app, this would be an API call
      setTimeout(() => {
        // Mock data
        setReports([
          {
            id: "1",
            filename: "report_skin_sample.pdf",
            date: "2023-04-15T14:30:00",
            model: "Skin Cancer Classification",
            prediction: "Benign",
            url: "#",
          },
          {
            id: "2",
            filename: "report_xray_pneumonia.pdf",
            date: "2023-04-10T09:15:00",
            model: "Pneumonia Detection",
            prediction: "Pneumonia",
            url: "#",
          },
          {
            id: "3",
            filename: "report_covid_test.pdf",
            date: "2023-04-05T16:45:00",
            model: "COVID-19 Analysis",
            prediction: "Normal",
            url: "#",
          },
        ])
        setLoading(false)
      }, 1500)
    }

    fetchReports()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <PageLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Medical Reports</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your Medical Reports</CardTitle>
            <CardDescription>Access and download your previous diagnostic reports</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{report.filename}</h3>
                        <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(report.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(report.date)}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">{report.model}</span>
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
                        </div>
                      </div>
                    </div>
                    <a href={report.url} download>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </a>
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
                  You haven't generated any diagnostic reports yet. Use our diagnosis tools to analyze medical images
                  and generate reports.
                </p>
                <Button className="mt-4" asChild>
                  <a href="/diagnosis">Go to Diagnosis</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

