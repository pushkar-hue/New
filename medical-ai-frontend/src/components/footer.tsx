import { Activity } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold">MediScan AI</span>
          </div>
        </div>
        <nav className="mt-8 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href="/" className="text-base text-foreground hover:text-primary">
              Home
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/diagnosis" className="text-base text-foreground hover:text-primary">
              Diagnosis
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/symptom-checker" className="text-base text-foreground hover:text-primary">
              Symptom Checker
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/chat" className="text-base text-foreground hover:text-primary">
              AI Chat
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/reports" className="text-base text-foreground hover:text-primary">
              Reports
            </Link>
          </div>
        </nav>
        <p className="mt-8 text-center text-base text-muted-foreground">
          &copy; {new Date().getFullYear()} MediScan AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

