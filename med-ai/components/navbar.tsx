"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { Menu, X, Activity } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Activity className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold">MediScan AI</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-foreground hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/diagnosis"
                className="border-transparent text-foreground hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Diagnosis
              </Link>
              <Link
                href="/symptom-checker"
                className="border-transparent text-foreground hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Symptom Checker
              </Link>
              <Link
                href="/chat"
                className="border-transparent text-foreground hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                AI Chat
              </Link>
              <Link
                href="/reports"
                className="border-transparent text-foreground hover:text-primary hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Reports
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <ModeToggle />
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="text-foreground hover:bg-primary hover:text-white block pl-3 pr-4 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/diagnosis"
              className="text-foreground hover:bg-primary hover:text-white block pl-3 pr-4 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Diagnosis
            </Link>
            <Link
              href="/symptom-checker"
              className="text-foreground hover:bg-primary hover:text-white block pl-3 pr-4 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Symptom Checker
            </Link>
            <Link
              href="/chat"
              className="text-foreground hover:bg-primary hover:text-white block pl-3 pr-4 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              AI Chat
            </Link>
            <Link
              href="/reports"
              className="text-foreground hover:bg-primary hover:text-white block pl-3 pr-4 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Reports
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <ModeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

