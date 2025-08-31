import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  Home,
  Bell,
  HelpCircle,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../utils/cn'

const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [showNotificationBadge, setShowNotificationBadge] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pageTitle, setPageTitle] = useState('')
  const [scrolled, setScrolled] = useState(false)
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Security overview and stats' },
    { name: 'Scan Repository', href: '/scan', icon: Search, description: 'Analyze new repositories' },
    { name: 'Vulnerabilities', href: '/vulnerabilities', icon: AlertTriangle, description: 'View and manage issues' },
    { name: 'Settings', href: '/profile', icon: Settings, description: 'User preferences and account' },
  ]
  
  // Update page title based on the current route
  useEffect(() => {
    const path = location.pathname
    const routeMatch = navigation.find(item => item.href === path)
    if (routeMatch) {
      setPageTitle(routeMatch.name)
    } else {
      setPageTitle('Dashboard')
    }
    
    // Close sidebar on route change (mobile)
    if (sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [location.pathname])
  
  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Update the time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
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
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // Animation variants
  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      opacity: 0.5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }
  
  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-radial from-primary-300/20 via-primary-200/10 to-transparent opacity-60 animate-pulse-slow" />
        <div className="absolute top-1/2 -left-32 h-96 w-96 rounded-full bg-gradient-radial from-primary-200/10 via-primary-100/10 to-transparent opacity-40 animate-pulse-slow" />
      </div>
      
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 z-40 bg-slate-800/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        variants={sidebarVariants}
        initial="closed"
        animate={sidebarOpen ? "open" : "closed"}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transform: undefined }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white/80 shadow-xl backdrop-blur-md transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-slate-200/70",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo and header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200/70">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-400/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">LockDown</span>
            </motion.div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden rounded-full p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100/70 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User section - At the top for better UX */}
          <div className="p-4 border-b border-slate-200/70">
            <div className="bg-gradient-to-r from-primary-50 to-slate-50 p-3 rounded-xl flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  className="h-10 w-10 rounded-full object-cover border-2 border-primary-200 shadow-md"
                  src={user?.github_avatar_url || '/default-avatar.png'}
                  alt={user?.github_username || 'User'}
                  loading="lazy"
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {user?.github_username || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {user?.github_email || 'No email'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/profile')}
                  className="p-1.5 rounded-full bg-white/80 text-slate-500 hover:text-primary-600 shadow-sm transition-colors"
                  aria-label="User profile"
                >
                  <User className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSignOut}
                  className="p-1.5 rounded-full bg-white/80 text-slate-500 hover:text-red-600 shadow-sm transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <motion.nav 
            className="flex-1 overflow-y-auto custom-scrollbar"
            initial="hidden"
            animate="visible"
          >
            <div className="px-3 py-5 space-y-1.5">
              <div className="px-3 mb-4 text-sm font-medium text-slate-400 uppercase tracking-wider">
                Main Menu
              </div>
              {navigation.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.name}
                    custom={i}
                    variants={navItemVariants}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "nav-link py-3 group",
                        isActive(item.href)
                          ? "nav-link-active"
                          : "nav-link-inactive"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className={cn(
                        "mr-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive(item.href)
                          ? "bg-primary-100 text-primary-700"
                          : "bg-slate-100/50 text-slate-500 group-hover:bg-slate-200/50 group-hover:text-slate-700"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span>{item.name}</span>
                          {isActive(item.href) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                              <ChevronRight className="h-4 w-4 text-primary-600" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-700">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
            
            {/* Help and support section */}
            <div className="px-3 py-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/30 border border-primary-200/50">
                <div className="flex items-center space-x-2 mb-3">
                  <HelpCircle className="h-5 w-5 text-primary-600" />
                  <h3 className="font-medium text-primary-900">Need Help?</h3>
                </div>
                <p className="text-xs text-slate-700 mb-3">
                  Get support with setting up scans or interpreting vulnerability results.
                </p>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-outline text-xs flex items-center justify-center py-1.5 px-3 w-full"
                >
                  <span>View Documentation</span>
                  <ExternalLink className="ml-1.5 h-3 w-3" />
                </motion.a>
              </div>
            </div>
          </motion.nav>

          {/* Bottom decoration */}
          <div className="p-5 text-center border-t border-slate-200/70">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{formatTime(currentTime)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              System Status: <span className="text-security-safe">Online</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div 
          className={cn(
            "sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/70 transition-shadow duration-300",
            scrolled && "shadow-sm"
          )}
        >
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden rounded-xl p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-colors mr-3"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{pageTitle}</h1>
                <div className="flex items-center text-sm text-slate-500">
                  <span className="hidden sm:inline">Current location:</span>
                  <span className="ml-1 font-medium text-primary-600">{pageTitle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Status indicators */}
              <div className="hidden sm:flex items-center space-x-4">
                <motion.div 
                  className="flex items-center space-x-2 text-sm text-slate-600 px-3 py-1.5 rounded-full bg-slate-50"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="h-2 w-2 rounded-full bg-security-safe"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span>System Online</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-2 text-sm text-slate-600 px-3 py-1.5 rounded-full bg-slate-50"
                  whileHover={{ scale: 1.05 }}
                >
                  <Zap className="h-4 w-4 text-accent-amber" />
                  <span>AI Ready</span>
                </motion.div>
              </div>

              {/* Notification bell */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  className="rounded-xl p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
                  onClick={() => setShowNotificationBadge(false)}
                >
                  <Bell className="h-5 w-5" />
                </button>
                {showNotificationBadge && notifications > 0 && (
                  <motion.div 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-security-critical text-white text-xs font-medium"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    {notifications}
                  </motion.div>
                )}
              </motion.div>

              {/* GitHub link */}
              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                title="GitHub"
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="h-5 w-5" />
              </motion.a>
            </div>
          </div>
        </div>

        {/* Page content with motion transitions */}
        <motion.main 
          className="py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  )
}

export default Layout
