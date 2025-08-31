import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Context type
interface SupabaseContextType {
  supabase: SupabaseClient
  isInitialized: boolean
}

// Create context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

// Provider component
export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize Supabase client
    const initializeSupabase = async () => {
      try {
        // Test connection
        const { data, error } = await supabase.from('users').select('count').limit(1)
        
        if (error && error.code !== 'PGRST116') {
          console.error('Supabase connection error:', error)
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize Supabase:', error)
        setIsInitialized(true) // Still set to true to prevent infinite loading
      }
    }

    initializeSupabase()
  }, [])

  const value: SupabaseContextType = {
    supabase,
    isInitialized
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

// Hook to use Supabase context
export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext)
  
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  
  return context
}

// Export the client directly for use outside of React components
export { supabase }
