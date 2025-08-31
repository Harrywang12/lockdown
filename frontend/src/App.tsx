import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

import { AuthProvider, useAuth } from './hooks/useAuth'
import { SupabaseProvider } from './hooks/useSupabase'

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
      suspense: false, // We'll handle loading states manually for more control
    },
  },
})

// Loading spinner component with enhanced animation
const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50/30">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="relative h-24 w-24"
    >
      <div className="absolute inset-0 rounded-full border-t-4 border-primary-200 opacity-25"></div>
      <div className="absolute inset-0 rounded-full border-t-4 border-l-4 border-primary-600"></div>
    </motion.div>
    <motion.div 
      className="mt-6 font-medium text-primary-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      Loading LockDown...
    </motion.div>
    <motion.div 
      className="mt-2 text-sm text-slate-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      Preparing your security dashboard
    </motion.div>
  </div>
)

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
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
    return <LoadingSpinner />
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Page transition container
const PageTransitionContainer = () => {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Login />
            </motion.div>
          </PublicRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="scan" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ScanRepository />
            </Suspense>
          } />
          <Route path="vulnerabilities" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Vulnerabilities />
            </Suspense>
          } />
          <Route path="vulnerability/:id" element={
            <Suspense fallback={<LoadingSpinner />}>
              <VulnerabilityDetails />
            </Suspense>
          } />
          <Route path="profile" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Profile />
            </Suspense>
          } />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <PageTransitionContainer />
              
              {/* Global toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'bg-slate-900 text-white',
                  style: {
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    background: 'rgba(15, 23, 42, 0.9)',
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
        </AuthProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  )
}

export default App
