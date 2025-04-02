"use client"

import type React from "react"

import { useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { checkSymptoms, type SymptomCheckerResult } from "@/lib/api"
import { AlertCircle, Stethoscope, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [medicalHistory, setMedicalHistory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SymptomCheckerResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms) {
      setError("Please describe your symptoms.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const checkerResult = await checkSymptoms(symptoms, age, gender, medicalHistory)
      setResult(checkerResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during symptom analysis.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">AI Symptom Checker</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Symptom Input */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Describe Your Symptoms</CardTitle>
                <CardDescription>
                  Provide details about your symptoms and medical history for AI analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="symptoms" className="text-sm font-medium">
                      Symptoms *
                    </label>
                    <Textarea
                      id="symptoms"
                      placeholder="Describe your symptoms in detail (e.g., fever, cough, headache, etc.)"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="age" className="text-sm font-medium">
                        Age
                      </label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="gender" className="text-sm font-medium">
                        Gender
                      </label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="medical-history" className="text-sm font-medium">
                      Medical History
                    </label>
                    <Textarea
                      id="medical-history"
                      placeholder="Any relevant medical history, conditions, or medications"
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={!symptoms || loading}>
                    {loading ? "Analyzing..." : "Analyze Symptoms"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div>
            {loading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Analyzing Symptoms</CardTitle>
                  <CardDescription>Please wait while our AI analyzes your symptoms...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ) : result ? (
              <Card>
                <CardHeader>
                  <CardTitle>Symptom Analysis</CardTitle>
                  <CardDescription>AI-generated analysis based on your symptoms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: result.analysis.replace(/\n\n/g, "<br /><br />"),
                      }}
                    />
                  </div>

                  {result.recommended_models.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Recommended Diagnostic Tests</h3>
                      <div className="space-y-3">
                        {result.recommended_models.map((model) => (
                          <Card key={model.key}>
                            <CardContent className="p-4 flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{model.name}</h4>
                                <p className="text-sm text-muted-foreground">{model.description}</p>
                              </div>
                              <Link href={`/diagnosis?model=${model.key}`} passHref>
                                <Button size="sm" variant="outline">
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Use Test
                                </Button>
                              </Link>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">
                    <p className="italic">
                      DISCLAIMER: This analysis is AI-generated and should not replace professional medical advice.
                      Please consult with a healthcare provider for proper diagnosis and treatment.
                    </p>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>Our AI symptom checker helps identify potential conditions</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-primary/10 p-6 mb-4">
                    <Stethoscope className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Your analysis will appear here</h3>
                  <p className="text-muted-foreground max-w-md">
                    Describe your symptoms in detail on the left panel to receive AI-powered analysis and
                    recommendations for appropriate diagnostic tests.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

