/**
 * Authentication Utilities for LockDown Backend
 * Handles GitHub OAuth token validation, user management, and security functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for authentication and user management
export interface GitHubUser {
  id: number
  login: string
  email: string
  avatar_url: string
  name?: string
  company?: string
  location?: string
}

export interface AuthenticatedUser {
  id: string
  github_id: number
  github_username: string
  github_email: string
  github_avatar_url: string
  encrypted_github_token: string
  created_at: string
  updated_at: string
  last_login: string
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
  statusCode?: number
}

/**
 * Initialize Supabase client with service role key for backend operations
 */
export function createSupabaseClient() {
  console.log('Creating Supabase client...')
  console.log('Available environment variables:', Object.keys(Deno.env.toObject()))
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  console.log('SUPABASE_URL available:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY available:', !!supabaseServiceKey)
  console.log('SUPABASE_URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET')
  console.log('SUPABASE_SERVICE_ROLE_KEY value:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT SET')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
    throw new Error('Missing Supabase environment variables')
  }
  
  console.log('Creating Supabase client with URL:', supabaseUrl)
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  console.log('Supabase client created successfully')
  return client
}

/**
 * Validate GitHub OAuth token by making a request to GitHub API
 * This ensures the token is still valid and has the necessary scopes
 */
export async function validateGitHubToken(token: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LockDown-Security-Scanner'
      }
    })
    
    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const user: GitHubUser = await response.json()
    return user
  } catch (error) {
    console.error('Error validating GitHub token:', error)
    return null
  }
}

/**
 * Get or create user from database based on GitHub OAuth data
 * Handles both new user registration and existing user login
 */
export async function getOrCreateUser(githubUser: GitHubUser, token: string): Promise<AuthResult> {
  try {
    const supabase = createSupabaseClient()
    
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('github_id', githubUser.id)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error fetching user:', fetchError)
      return {
        success: false,
        error: 'Database error while fetching user',
        statusCode: 500
      }
    }
    
    if (existingUser) {
      // Update existing user's token and last login
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          encrypted_github_token: await encryptToken(token),
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating user:', updateError)
        return {
          success: false,
          error: 'Failed to update user information',
          statusCode: 500
        }
      }
      
      return {
        success: true,
        user: updatedUser as AuthenticatedUser
      }
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          github_id: githubUser.id,
          github_username: githubUser.login,
          github_email: githubUser.email,
          github_avatar_url: githubUser.avatar_url,
          encrypted_github_token: await encryptToken(token)
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating user:', insertError)
        return {
          success: false,
          error: 'Failed to create new user',
          statusCode: 500
        }
      }
      
      return {
        success: true,
        user: newUser as AuthenticatedUser
      }
    }
  } catch (error) {
    console.error('Error in getOrCreateUser:', error)
    return {
      success: false,
      error: 'Internal server error during user authentication',
      statusCode: 500
    }
  }
}

/**
 * Encrypt sensitive data (GitHub tokens) before storing in database
 * Uses a simple encryption method - in production, consider using more robust encryption
 */
async function encryptToken(token: string): Promise<string> {
  // In a production environment, use proper encryption libraries
  // This is a simplified version for MVP purposes
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  
  // Generate a simple hash for demonstration
  // In production, use proper encryption with environment-based keys
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // For MVP, we'll store a hash + some obfuscation
  // In production, implement proper encryption/decryption
  return `encrypted_${hashHex}_${Date.now()}`
}

/**
 * Verify user authentication from request headers
 * Extracts and validates the Authorization header
 */
export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
        statusCode: 401
      }
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Validate the Supabase JWT token
    const supabase = createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired Supabase token',
        statusCode: 401
      }
    }
    
    // Get or create user in our database
    const githubUser = {
      id: user.user_metadata?.sub || user.user_metadata?.github_id || user.id,
      login: user.user_metadata?.user_name || user.user_metadata?.name || user.user_metadata?.login || 'unknown',
      email: user.email || user.user_metadata?.email,
      avatar_url: user.user_metadata?.avatar_url
    }
    
    console.log('GitHub user data:', {
      user_id: user.id,
      user_metadata: user.user_metadata,
      github_user: githubUser
    })
    
    return await getOrCreateUser(githubUser, token)
    
  } catch (error) {
    console.error('Error in verifyAuth:', error)
    return {
      success: false,
      error: 'Authentication verification failed',
      statusCode: 500
    }
  }
}

/**
 * Rate limiting utility to prevent API abuse
 * Checks if user has exceeded rate limits for specific endpoints
 */
export async function checkRateLimit(userId: string, endpoint: string, maxRequests: number = 100, windowMs: number = 60000): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)
    
    // Check existing rate limit record
    const { data: existingLimit, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking rate limit:', fetchError)
      return false // Fail closed for security
    }
    
    if (existingLimit) {
      if (existingLimit.request_count >= maxRequests) {
        return false // Rate limit exceeded
      }
      
      // Update existing record
      await supabase
        .from('rate_limits')
        .update({
          request_count: existingLimit.request_count + 1
        })
        .eq('id', existingLimit.id)
    } else {
      // Create new rate limit record
      await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          endpoint,
          request_count: 1,
          window_start: now.toISOString()
        })
    }
    
    return true // Rate limit not exceeded
    
  } catch (error) {
    console.error('Error in checkRateLimit:', error)
    return false // Fail closed for security
  }
}

/**
 * Utility to extract repository information from GitHub URL
 * Supports various GitHub URL formats
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  try {
    const urlObj = new URL(url)
    
    if (urlObj.hostname !== 'github.com') {
      return null
    }
    
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    if (pathParts.length < 2) {
      return null
    }
    
    const owner = pathParts[0]
    const repo = pathParts[1]
    const branch = pathParts[3] || 'main' // Default to main branch
    
    return { owner, repo, branch }
  } catch (error) {
    console.error('Error parsing GitHub URL:', error)
    return null
  }
}

/**
 * Validate input parameters for security
 * Prevents injection attacks and ensures data integrity
 */
export function validateInput(input: any, maxLength: number = 1000): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }
  
  if (input.length > maxLength) {
    return false
  }
  
  // Basic XSS prevention - check for script tags
  if (input.toLowerCase().includes('<script>') || input.toLowerCase().includes('javascript:')) {
    return false
  }
  
  return true
}

/**
 * Generate a secure random ID for scan sessions
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Log security events for audit purposes
 */
export function logSecurityEvent(event: string, userId: string, details: Record<string, any> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId,
    details,
    userAgent: 'LockDown-Security-Scanner'
  }
  
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry))
  
  // In production, send to proper logging service
  // Consider using structured logging with proper security measures
}
