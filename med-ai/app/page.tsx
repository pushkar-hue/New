import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Brain, Microscope, Stethoscope, MessageSquare, FileText, Video, Users } from "lucide-react"

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-70"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Advanced <span className="gradient-heading">AI Medical Diagnosis</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl">
                Cutting-edge AI technology to assist medical professionals in diagnosing various conditions through
                image analysis.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/diagnosis">Start Diagnosis</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link href="/symptom-checker">Check Symptoms</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/30 rounded-full blur-xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Powerful AI Diagnostic Tools</h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Comprehensive suite of medical AI tools to enhance healthcare delivery
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-2 bg-primary"></div>
              <CardContent className="p-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Microscope className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Multiple Disease Models</h3>
                <p className="text-muted-foreground">
                  Specialized AI models for various medical conditions including cancer, COVID-19, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-2 bg-accent"></div>
              <CardContent className="p-6">
                <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced machine learning algorithms trained on extensive medical datasets.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-2 bg-primary"></div>
              <CardContent className="p-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Detailed Reports</h3>
                <p className="text-muted-foreground">
                  Comprehensive medical reports with analysis, recommendations, and next steps.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-2 bg-accent"></div>
              <CardContent className="p-6">
                <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Stethoscope className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Symptom Checker</h3>
                <p className="text-muted-foreground">
                  Analyze symptoms and get recommendations for appropriate diagnostic tests.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-2 bg-primary"></div>
              <CardContent className="p-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Medical AI Chat</h3>
                <p className="text-muted-foreground">
                  Ask medical questions and get informative responses from our AI assistant.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-2 bg-accent"></div>
              <CardContent className="p-6">
                <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Video Consultations</h3>
                <p className="text-muted-foreground">
                  Connect with healthcare professionals through secure video calls.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">How It Works</h2>
            <p className="mt-4 text-xl text-muted-foreground">Simple process, powerful results</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <div className="absolute top-0 right-0 -mr-2 -mt-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center md:block hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Medical Image</h3>
              <p className="text-muted-foreground">
                Upload your medical images securely to our platform for AI analysis.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <div className="absolute top-0 right-0 -mr-2 -mt-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center md:block hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our advanced AI models analyze the images to detect potential medical conditions.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Detailed Report</h3>
              <p className="text-muted-foreground">
                Receive a comprehensive report with diagnosis, confidence scores, and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold text-primary mb-2">99.2%</div>
              <p className="text-muted-foreground">Accuracy Rate</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <p className="text-muted-foreground">Diagnoses Performed</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold text-primary mb-2">6</div>
              <p className="text-muted-foreground">Disease Models</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">AI Availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">What Healthcare Professionals Say</h2>
            <p className="mt-4 text-xl text-muted-foreground">Trusted by medical professionals worldwide</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold">Dr. Sarah Johnson</h4>
                    <p className="text-sm text-muted-foreground">Radiologist</p>
                  </div>
                </div>
                <p className="italic text-muted-foreground">
                  "MediScan AI has revolutionized our diagnostic workflow. The accuracy and speed of the AI models have
                  helped us identify conditions earlier and with greater confidence."
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold">Dr. Michael Chen</h4>
                    <p className="text-sm text-muted-foreground">Oncologist</p>
                  </div>
                </div>
                <p className="italic text-muted-foreground">
                  "The detailed reports generated by MediScan AI provide valuable insights that help me make more
                  informed treatment decisions for my patients."
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold">Dr. Emily Rodriguez</h4>
                    <p className="text-sm text-muted-foreground">Dermatologist</p>
                  </div>
                </div>
                <p className="italic text-muted-foreground">
                  "The skin cancer detection model has been a game-changer in my practice. It helps me identify
                  suspicious lesions that might otherwise be missed."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/20 to-accent/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Ready to Experience AI-Powered Medical Diagnosis?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Start using our advanced diagnostic tools today to assist in medical decision-making.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

