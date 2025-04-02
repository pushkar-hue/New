import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Activity, Brain, Microscope, Stethoscope, MessageSquare, FileText } from "lucide-react"

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Advanced AI Medical Diagnosis
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Cutting-edge AI technology to assist medical professionals in diagnosing various conditions through
                image analysis.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/diagnosis">
                <Button size="lg" className="mt-4">
                  Start Diagnosis
                </Button>
              </Link>
              <Link href="/symptom-checker">
                <Button size="lg" variant="outline" className="mt-4">
                  Check Symptoms
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Microscope className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multiple Disease Models</CardTitle>
                <CardDescription>
                  Specialized AI models for various medical conditions including cancer, COVID-19, and more.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Advanced machine learning algorithms trained on extensive medical datasets.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Detailed Reports</CardTitle>
                <CardDescription>
                  Comprehensive medical reports with analysis, recommendations, and next steps.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Stethoscope className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Symptom Checker</CardTitle>
                <CardDescription>
                  Analyze symptoms and get recommendations for appropriate diagnostic tests.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Medical AI Chat</CardTitle>
                <CardDescription>
                  Ask medical questions and get informative responses from our AI assistant.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Activity className="h-10 w-10 text-primary mb-2" />
                <CardTitle>High Accuracy</CardTitle>
                <CardDescription>
                  State-of-the-art models with high diagnostic accuracy and confidence scores.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Ready to Experience AI-Powered Medical Diagnosis?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                Start using our advanced diagnostic tools today to assist in medical decision-making.
              </p>
            </div>
            <Link href="/diagnosis">
              <Button size="lg">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

