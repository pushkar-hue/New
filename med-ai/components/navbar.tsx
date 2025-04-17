"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import {
  Menu,
  X,
  Activity,
  MessageSquare,
  FileText,
  User,
  LogOut,
  Settings,
  Video,
  Home,
  Stethoscope,
  Calendar,
  LayoutDashboard,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname, useRouter } from "next/navigation"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const navLinks = [{ href: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> }]

  // Links for authenticated users
  const authLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { href: "/diagnosis", label: "Diagnosis", icon: <Activity className="h-4 w-4 mr-2" /> },
    { href: "/symptom-checker", label: "Symptom Checker", icon: <Stethoscope className="h-4 w-4 mr-2" /> },
    { href: "/chat", label: "AI Chat", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { href: "/reports", label: "Reports", icon: <FileText className="h-4 w-4 mr-2" /> },
  ]

  // Additional links for authenticated users
  const communicationLinks = [
    { href: "/chat-with-doctor", label: "Doctor Chat", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { href: "/video-call", label: "Video Call", icon: <Video className="h-4 w-4 mr-2" /> },
    { href: "/appointments", label: "Appointments", icon: <Calendar className="h-4 w-4 mr-2" /> },
  ]

  // Determine which links to show based on authentication status
  const links = isAuthenticated ? [...navLinks, ...authLinks] : navLinks
  const extraLinks = isAuthenticated ? communicationLinks : []

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Activity className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold gradient-heading">MediScan AI</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && extraLinks.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center px-3 py-2 text-sm font-medium rounded-md">
                      <span className="mr-1">More</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {extraLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href} className="cursor-pointer flex items-center">
                          {link.icon}
                          <span>{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-2">
            <ModeToggle />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user?.name || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-primary capitalize">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <ModeToggle />
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
        <div className="sm:hidden bg-background/95 backdrop-blur-sm border-b">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-primary/5"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {isAuthenticated &&
              extraLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                    pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {isAuthenticated ? (
              <div className="px-4 space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user?.name || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium">{user?.name}</div>
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2 text-base font-medium rounded-md text-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 text-base font-medium rounded-md text-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="flex w-full items-center px-3 py-2 text-base font-medium rounded-md text-destructive hover:bg-destructive/5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 flex flex-col space-y-2">
                <Button variant="outline" asChild className="w-full justify-center">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    Sign up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
