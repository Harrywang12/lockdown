import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Shield, 
  Search, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Github,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Moon,
  Sun
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../utils/cn'
import ThemeToggle from './ui/ThemeToggle'

const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Scan Repository', href: '/scan', icon: Search },
    { name: 'Vulnerabilities', href: '/vulnerabilities', icon: AlertTriangle },
    { name: 'Settings', href: '/profile', icon: Settings },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  // Determine page title based on current route
  const pageTitle = (() => {
    const path = location.pathname
    if (path.startsWith('/dashboard') || path === '/') return 'Dashboard'
    if (path.startsWith('/scan')) return 'Scan Repository'
    if (path.startsWith('/vulnerabilities')) return 'Vulnerabilities'
    if (path.startsWith('/vulnerability/')) return 'Vulnerability Details'
    if (path.startsWith('/profile')) return 'Settings'
    return 'LockDown'
  })()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-300/30 dark:bg-primary-800/20 opacity-30 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -left-24 h-64 w-64 rounded-full bg-primary-200/40 dark:bg-primary-700/20 opacity-40 blur-3xl animate-pulse-slow" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-800/50 dark:bg-slate-900/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Shell */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 md:w-72 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md shadow-lg transform transition-transform duration-300 ease-in-out border-r border-slate-200/70 dark:border-dark-border lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo and header */}
            <div className="flex h-16 md:h-20 items-center justify-between px-4 sm:px-6 border-b border-slate-200/70 dark:border-dark-border">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-600/20">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600">LockDown</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden rounded-full p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-primary-100/70 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={cn(
                      "mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors",
                      isActive(item.href)
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                        : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-slate-200/70 dark:border-dark-border p-4">
              <div className="bg-gradient-to-r from-slate-50 to-primary-50/20 dark:from-slate-800/50 dark:to-primary-900/20 p-3 rounded-xl flex items-center space-x-3">
                <img
                  className="h-9 w-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                  src={user?.github_avatar_url || '/default-avatar.png'}
                  alt={user?.github_username || 'User'}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user?.github_username || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.github_email || 'No email'}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 shadow-sm transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content area */}
        <div className="flex-1 flex flex-col lg:ml-64 md:ml-72">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-sm border-b border-slate-200/70 dark:border-dark-border">
            <div className="flex h-16 md:h-20 items-center justify-between px-3 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden rounded-xl p-2 md:p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors mr-3"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
                  <div className="flex items-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    <span className="hidden sm:inline">Current location:</span>
                    <span className="ml-1 font-medium text-primary-600 dark:text-primary-400">{pageTitle}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                  <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50">
                    <div className="h-1.5 md:h-2 w-1.5 md:w-2 rounded-full bg-security-safe"></div>
                    <span>System Online</span>
                  </div>
                  <div className="hidden lg:flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50">
                    <Zap className="h-3 md:h-4 w-3 md:w-4 text-amber-500" />
                    <span>AI Ready</span>
                  </div>
                </div>
                <ThemeToggle variant="icon" size="sm" className="md:hidden" />
                <ThemeToggle variant="icon" size="md" className="hidden md:flex" />
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl p-2 md:p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors"
                  title="GitHub"
                >
                  <Github className="h-4 md:h-5 w-4 md:w-5" />
                </a>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 py-6">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
