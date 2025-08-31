import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useSupabase } from './useSupabase'
import { User as AppUser } from '../types'

// Authentication context type
interface AuthContextType {
  user: AppUser | null
  session: Session | null
  loading: boolean
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSupabase()
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch or create user data from our database
  const fetchUserData = useCallback(async (supabaseUser: User): Promise<AppUser | null> => {
    try {
      const authUserId = supabaseUser.id
      const githubId = supabaseUser.user_metadata?.sub || supabaseUser.id
      
      // Try to fetch existing user by auth UID first
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle()

      // If not found by id, try by github_id
      if (!data) {
        const byGithub = await supabase
          .from('users')
          .select('*')
          .eq('github_id', parseInt(githubId))
          .maybeSingle()
        if (byGithub.data) {
          data = byGithub.data
          error = null as any
        }
      }

      // If still not found, create them
      if (!data) {
        console.log('Creating new user for GitHub ID:', githubId)
        console.log('User metadata:', supabaseUser.user_metadata)
        console.log('Available metadata keys:', Object.keys(supabaseUser.user_metadata || {}))
        
        // Get the GitHub access token from the OAuth session
        const githubToken = supabaseUser.user_metadata?.access_token || 'no_token_available'
        console.log('GitHub token found:', githubToken ? 'Yes' : 'No')
        
        const newUser = {
          id: authUserId,
          github_id: parseInt(githubId),
          github_username: supabaseUser.user_metadata?.user_name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.login || 'unknown',
          github_email: supabaseUser.email || supabaseUser.user_metadata?.email,
          github_avatar_url: supabaseUser.user_metadata?.avatar_url,
          encrypted_github_token: githubToken
        }
        
        console.log('Attempting to create user:', newUser)
        // Insert new user; if unique github_id exists, fall back to updating that row
        let createdUser = null as any
        let createError = null as any
        const insertRes = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .maybeSingle()
        createdUser = insertRes.data
        createError = insertRes.error
        
        if (createError) {
          console.error('Error creating user:', createError)
          console.error('Full error details:', createError)
          // If conflict on github_id, update that existing row (do not change id)
          const updateRes = await supabase
            .from('users')
            .update({
              github_username: newUser.github_username,
              github_email: newUser.github_email,
              github_avatar_url: newUser.github_avatar_url,
              encrypted_github_token: newUser.encrypted_github_token,
              updated_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            })
            .eq('github_id', newUser.github_id)
            .select()
            .maybeSingle()
          if (updateRes.data) {
            return updateRes.data as AppUser
          }
          return null
        }
        
        console.log('User created successfully:', createdUser)
        data = createdUser
      }

      return data as AppUser
    } catch (error) {
      console.error('Error in fetchUserData:', error)
      return null
    }
  }, [supabase])

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)

        if (initialSession?.user) {
          const userData = await fetchUserData(initialSession.user)
          if (userData) {
            setUser(userData)
          } else {
            // Fallback: minimal user from session so app can proceed
            const fallbackUser: AppUser = {
              id: initialSession.user.id,
              github_id: parseInt(initialSession.user.user_metadata?.sub || initialSession.user.id),
              github_username: initialSession.user.user_metadata?.user_name || initialSession.user.user_metadata?.name || initialSession.user.user_metadata?.login || 'unknown',
              github_email: initialSession.user.email || initialSession.user.user_metadata?.email,
              github_avatar_url: initialSession.user.user_metadata?.avatar_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            }
            setUser(fallbackUser)
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setSession(session)
            if (session?.user) {
              const userData = await fetchUserData(session.user)
              if (userData) {
                setUser(userData)
              } else {
                const fallbackUser: AppUser = {
                  id: session.user.id,
                  github_id: parseInt(session.user.user_metadata?.sub || session.user.id),
                  github_username: session.user.user_metadata?.user_name || session.user.user_metadata?.name || session.user.user_metadata?.login || 'unknown',
                  github_email: session.user.email || session.user.user_metadata?.email,
                  github_avatar_url: session.user.user_metadata?.avatar_url,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_login: new Date().toISOString()
                }
                setUser(fallbackUser)
              }
              // Update GitHub token if we have a fresh one
              if (session.provider_token && (userData || user)) {
                await updateGitHubToken((userData?.id || user?.id) as string, session.provider_token)
              }
            } else {
              setUser(null)
            }
            setLoading(false)
          }
        )

        setLoading(false)
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [supabase, fetchUserData])

  // Sign in with GitHub
  const signInWithGitHub = useCallback(async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}`,
          scopes: 'repo read:user user:email'
        }
      })

      if (error) {
        console.error('GitHub OAuth error:', error)
        throw error
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
      throw error
    }
  }, [supabase])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Update GitHub token in database
  const updateGitHubToken = useCallback(async (userId: string, newToken: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ encrypted_github_token: newToken })
        .eq('id', userId)
      
      if (error) {
        console.error('Error updating GitHub token:', error)
      } else {
        console.log('GitHub token updated successfully')
      }
    } catch (error) {
      console.error('Error updating GitHub token:', error)
    }
  }, [supabase])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (session?.user) {
      const userData = await fetchUserData(session.user)
      setUser(userData)
    }
  }, [session, fetchUserData])

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGitHub,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Hook to check if user has specific permissions
export const usePermissions = () => {
  const { user } = useAuth()
  
  return {
    canScanRepositories: !!user,
    canViewVulnerabilities: !!user,
    canExportReports: !!user,
    isAdmin: user?.github_username === 'admin' // Simple admin check for MVP
  }
}
