"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { type Models, type PredictionResult, getModels, predictImage } from "@/lib/api"
import { AlertCircle, FileUp, Check } from "lucide-react"

export default function DiagnosisPage() {
  const [models, setModels] = useState<Models | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loadingModels, setLoadingModels] = useState<boolean>(true)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelData = await getModels()
        setModels(modelData)
        if (Object.keys(modelData).length > 0) {
          setSelectedModel(Object.keys(modelData)[0])
        }
      } catch (err) {
        setError("Failed to load models. Please try again later.")
      } finally {
        setLoadingModels(false)
      }
    }

    fetchModels()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setResult(null)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedModel) {
      setError("Please select a model and upload an image.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const predictionResult = await predictImage(file, selectedModel)
      setResult(predictionResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during prediction.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Medical Image Diagnosis</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Model Selection & Upload */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Medical Image</CardTitle>
                <CardDescription>Select a diagnostic model and upload your medical image for analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="model-select" className="text-sm font-medium">
                      Select Diagnostic Model
                    </label>
                    {loadingModels ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger id="model-select">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models &&
                            Object.entries(models).map(([key, model]) => (
                              <SelectItem key={key} value={key}>
                                {model.display_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="image-upload" className="text-sm font-medium">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                        <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                        <span className="text-xs text-muted-foreground mt-1">PNG, JPG or JPEG (max 16MB)</span>
                      </label>
                    </div>
                  </div>

                  {preview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Image Preview</p>
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                        <img src={preview || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={!file || !selectedModel || loading}>
                    {loading ? "Analyzing..." : "Analyze Image"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="md:col-span-2">
            {loading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Analyzing Image</CardTitle>
                  <CardDescription>Please wait while we analyze your medical image...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={45} className="w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ) : result ? (
              <Tabs defaultValue="results">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="probabilities">Probabilities</TabsTrigger>
                  <TabsTrigger value="report">Detailed Report</TabsTrigger>
                </TabsList>

                <TabsContent value="results">
                  <Card>
                    <CardHeader>
                      <CardTitle>Diagnosis Results</CardTitle>
                      <CardDescription>Analysis from {result.display_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">Detected Condition</p>
                          <p className="text-2xl font-bold">{result.prediction}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Confidence</p>
                          <p className="text-2xl font-bold">{result.confidence.toFixed(2)}%</p>
                        </div>
                      </div>

                      <Alert
                        variant={result.confidence > 85 ? "destructive" : "default"}
                        className={
                          result.confidence > 85
                            ? "border-red-500 bg-red-500/10"
                            : result.confidence > 50
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-green-500 bg-green-500/10"
                        }
                      >
                        <AlertTitle>
                          {result.confidence > 85 ? "High Risk" : result.confidence > 50 ? "Moderate Risk" : "Low Risk"}
                        </AlertTitle>
                        <AlertDescription>
                          {result.confidence > 85
                            ? "Immediate medical attention recommended."
                            : result.confidence > 50
                              ? "Follow-up with a healthcare provider advised."
                              : "Monitor and consult with a healthcare provider if symptoms persist."}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                    <CardFooter>
                      <a href={result.report_url} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="outline" className="w-full">
                          Download Full Report
                        </Button>
                      </a>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="probabilities">
                  <Card>
                    <CardHeader>
                      <CardTitle>Probability Distribution</CardTitle>
                      <CardDescription>Confidence scores for each possible condition</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(result.probabilities).map(([condition, probability]) => (
                          <div key={condition} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{condition}</span>
                              <span className="text-sm text-muted-foreground">{probability.toFixed(2)}%</span>
                            </div>
                            <Progress
                              value={probability}
                              className="h-2"
                              indicatorClassName={
                                condition === result.prediction ? "bg-primary" : "bg-muted-foreground"
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="report">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Medical Report</CardTitle>
                      <CardDescription>AI-generated analysis and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: result.report_content.replace(/\*\*(.*?):\*\*/g, "<h3>$1:</h3>"),
                        }}
                      />
                    </CardContent>
                    <CardFooter>
                      <div className="text-sm text-muted-foreground">
                        <p className="italic">
                          DISCLAIMER: This report is AI-generated and should not replace professional medical advice.
                          Please consult with a healthcare provider for proper diagnosis and treatment.
                        </p>
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Ready for Analysis</CardTitle>
                  <CardDescription>Upload a medical image and select a model to begin analysis.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-primary/10 p-6 mb-4">
                    <Check className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Your results will appear here</h3>
                  <p className="text-muted-foreground max-w-md">
                    Select a diagnostic model from the left panel and upload a medical image to receive AI-powered
                    analysis and recommendations.
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

