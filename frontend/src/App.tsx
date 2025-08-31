import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

import { AuthProvider, useAuth } from './hooks/useAuth'
import { SupabaseProvider } from './hooks/useSupabase'
import { ThemeProvider } from './hooks/useTheme'

import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ScanRepository from './components/ScanRepository'
import VulnerabilityDetails from './components/VulnerabilityDetails'
import Profile from './components/Profile'
import Vulnerabilities from './components/Vulnerabilities'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Public route component (redirects if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

const RouteContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <AuthProvider>
          <ThemeProvider>
            <Router>
              <div className="App">
                <RouteContainer>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } />
                    
                    {/* Protected routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="scan" element={<ScanRepository />} />
                      <Route path="vulnerabilities" element={<Vulnerabilities />} />
                      <Route path="vulnerability/:id" element={<VulnerabilityDetails />} />
                      <Route path="profile" element={<Profile />} />
                    </Route>
                    
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </RouteContainer>
                
                {/* Global toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    className: 'bg-slate-900 text-white dark:bg-slate-800',
                    style: {
                      borderRadius: '0.75rem',
                      padding: '12px 16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#09b876',
                        secondary: '#fff',
                      },
                      style: {
                        background: 'rgba(9, 184, 118, 0.05)',
                        border: '1px solid rgba(9, 184, 118, 0.2)',
                        color: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ee2d4e',
                        secondary: '#fff',
                      },
                      style: {
                        background: 'rgba(238, 45, 78, 0.05)',
                        border: '1px solid rgba(238, 45, 78, 0.2)',
                        color: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </ThemeProvider>
        </AuthProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  )
}

export default App
