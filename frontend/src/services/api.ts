import { supabase } from '../hooks/useSupabase'
import { 
  ScanRequest, 
  ScanResponse, 
  ExplanationRequest, 
  ExplanationResponse,
  GHSARequest,
  GHSADetails,
  Repository,
  Vulnerability,
  ScanSession
} from '../types'

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL
const API_ENDPOINTS = {
  scan: '/functions/v1/scan',
  explain: '/functions/v1/explain',
  ghsa: '/functions/v1/ghsa'
}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  // Try to refresh the session if it's expired
  if (session && session.expires_at && Date.now() / 1000 > session.expires_at) {
    console.log('Session expired, attempting refresh...')
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Failed to refresh session:', error)
      throw new Error('Session expired and refresh failed. Please sign in again.')
    }
    if (!refreshedSession?.access_token) {
      throw new Error('No authentication token available after refresh')
    }
    return {
      'Authorization': `Bearer ${refreshedSession.access_token}`,
      'Content-Type': 'application/json',
    }
  }
  
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API request failed with status ${response.status}`)
  }
  
  return response.json()
}

// Repository scanning API
export const scanRepository = async (request: ScanRequest): Promise<ScanResponse> => {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.scan}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })
    
    return handleApiResponse<ScanResponse>(response)
  } catch (error) {
    console.error('Scan repository error:', error)
    throw error
  }
}

// AI explanation API
export const getVulnerabilityExplanation = async (request: ExplanationRequest): Promise<ExplanationResponse> => {
  try {
    const headers = await getAuthHeaders()
    
    // Add enhanced request data for improved explanations
    const enhancedRequest = {
      ...request,
      options: {
        detailed: true,
        code_examples: true,
        include_references: true
      }
    }
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.explain}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhancedRequest)
    })
    
    return handleApiResponse<ExplanationResponse>(response)
  } catch (error) {
    console.error('Get explanation error:', error)
    throw error
  }
}

// GHSA details API
export const getGHSADetails = async (request: GHSARequest): Promise<GHSADetails> => {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ghsa}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })
    
    const responseData = await handleApiResponse<{success: boolean, details: GHSADetails}>(response)
    return responseData.details
  } catch (error) {
    console.error('Get GHSA details error:', error)
    
    // If our backend API fails, try to fetch from GitHub directly
    try {
      const ghsaId = request.ghsaId
      const githubResponse = await fetch(`https://api.github.com/advisories/${ghsaId}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'LockDown-Security-Scanner'
        }
      })
      
      if (!githubResponse.ok) {
        throw new Error(`GitHub API error: ${githubResponse.status}`)
      }
      
      const githubData = await githubResponse.json()
      
      // Transform GitHub API response to our GHSADetails format
      return {
        id: githubData.id,
        ghsa_id: githubData.ghsa_id,
        summary: githubData.summary,
        description: githubData.description,
        severity: githubData.severity.toUpperCase(),
        classifications: githubData.vulnerabilities?.map((v: any) => v.classification),
        cvss_score: githubData.cvss?.score,
        cvss_vector: githubData.cvss?.vector_string,
        published_at: githubData.published_at,
        updated_at: githubData.updated_at,
        references: githubData.references?.map((ref: any) => ref.url),
        affected_packages: githubData.affected?.map((pkg: any) => ({
          name: pkg.package.name,
          ecosystem: pkg.package.ecosystem,
          affected_versions: pkg.ranges?.map((r: any) => r.description).join(', ') || 'Unknown',
          patched_versions: pkg.ranges?.[0]?.fixed_version
        })),
        cve_ids: githubData.cve_ids,
        vulnerable_functions: githubData.vulnerable_functions,
        patched_versions: githubData.patched_versions
      }
    } catch (fallbackError) {
      console.error('GitHub API fallback error:', fallbackError)
      throw error // Throw the original error
    }
  }
}

// GitHub API functions
export const getGitHubUser = async (): Promise<any> => {
  try {
    // Try to get the GitHub token from the current session first
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No active session')
    }
    
    // Check if we have a provider token (GitHub access token)
    const providerToken = session.provider_token
    console.log('Provider token available for user:', !!providerToken)
    console.log('Session expires at:', session.expires_at)
    console.log('Current time:', Math.floor(Date.now() / 1000))
    console.log('Token expired:', session.expires_at ? Math.floor(Date.now() / 1000) > session.expires_at : 'Unknown')
    
    if (!providerToken) {
      // Fallback: try to get from our database
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('encrypted_github_token')
        .eq('github_id', user.user_metadata?.sub || user.id)
        .single()
      
      if (userError || !userData?.encrypted_github_token) {
        throw new Error('GitHub token not available')
      }
      
      const githubToken = userData.encrypted_github_token
      console.log('Using token from database for user')
      
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'LockDown-Security-Scanner'
        }
      })
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }
      
      return response.json()
    }
    
    // Use the provider token from the session
    console.log('Using provider token from session for user')
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${providerToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LockDown-Security-Scanner'
      }
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    console.error('Get GitHub user error:', error)
    throw error
  }
}

export const getGitHubRepositories = async (): Promise<Repository[]> => {
  try {
    // Try to get the GitHub token from the current session first
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No active session')
    }
    
    // Check if we have a provider token (GitHub access token)
    const providerToken = session.provider_token
    console.log('Provider token available:', !!providerToken)
    
    if (!providerToken) {
      // Fallback: try to get from our database
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('encrypted_github_token')
        .eq('github_id', user.user_metadata?.sub || user.id)
        .single()
      
      if (userError || !userData?.encrypted_github_token) {
        throw new Error('GitHub token not available')
      }
      
      const githubToken = userData.encrypted_github_token
      console.log('Using token from database')
      
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'LockDown-Security-Scanner'
        }
      })
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }
      
      const repos = await response.json()
      
      // Transform GitHub repos to our Repository format
      return repos.map((repo: any) => ({
        id: repo.id.toString(),
        user_id: '', // Will be set by backend
        github_repo_id: repo.full_name,
        repo_name: repo.name,
        repo_full_name: repo.full_name,
        repo_url: repo.html_url,
        default_branch: repo.default_branch,
        language: repo.language,
        is_private: repo.private,
        last_scan_at: undefined,
        scan_count: 0,
        created_at: repo.created_at,
        updated_at: repo.updated_at
      }))
    }
    
    // Use the provider token from the session
    console.log('Using provider token from session')
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${providerToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LockDown-Security-Scanner'
      }
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    const repos = await response.json()
    
    // Transform GitHub repos to our Repository format
    return repos.map((repo: any) => ({
      id: repo.id.toString(),
      user_id: '', // Will be set by backend
      github_repo_id: repo.full_name,
      repo_name: repo.name,
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      default_branch: repo.default_branch,
      language: repo.language,
      is_private: repo.private,
      last_scan_at: undefined,
      scan_count: 0,
      created_at: repo.created_at,
      updated_at: repo.updated_at
    }))
  } catch (error) {
    console.error('Get GitHub repositories error:', error)
    throw error
  }
}

// Database operations
export const getRepositories = async (): Promise<Repository[]> => {
  try {
    console.log('=== GET REPOSITORIES DEBUG ===')
    console.log('Fetching repositories from database...')
    
    const { data, error } = await supabase
      .from('repositories')
      .select('*')
      .order('updated_at', { ascending: false })
    
    console.log('Repositories query result:', { data, error })
    
    if (error) {
      console.error('Repositories query error:', error)
      throw error
    }
    
    console.log('Returning repositories:', data || [])
    return data || []
  } catch (error) {
    console.error('Get repositories error:', error)
    throw error
  }
}

export const getScanSessions = async (repositoryId?: string): Promise<ScanSession[]> => {
  try {
    console.log('=== GET SCAN SESSIONS DEBUG ===')
    console.log('Fetching scan sessions from database...')
    console.log('Repository ID filter:', repositoryId)
    
    let query = supabase
      .from('scan_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (repositoryId) {
      query = query.eq('repository_id', repositoryId)
    }
    
    const { data, error } = await query
    
    console.log('Scan sessions query result:', { data, error })
    
    if (error) {
      console.error('Scan sessions query error:', error)
      throw error
    }
    
    console.log('Returning scan sessions:', data || [])
    return data || []
  } catch (error) {
    console.error('Get scan sessions error:', error)
    throw error
  }
}

export const getVulnerabilities = async (scanSessionId?: string): Promise<Vulnerability[]> => {
  try {
    console.log('=== GET VULNERABILITIES DEBUG ===')
    console.log('Fetching vulnerabilities from database...')
    console.log('Scan session ID filter:', scanSessionId)
    
    let query = supabase
      .from('vulnerabilities')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (scanSessionId) {
      query = query.eq('scan_session_id', scanSessionId)
    }
    
    const { data, error } = await query
    
    console.log('Vulnerabilities query result:', { data, error })
    
    if (error) {
      console.error('Vulnerabilities query error:', error)
      throw error
    }
    
    console.log('Returning vulnerabilities:', data || [])
    return data || []
  } catch (error) {
    console.error('Get vulnerabilities error:', error)
    throw error
  }
}

// Utility functions
export const downloadSecurityBadge = (score: number, repoName: string): void => {
  // Create SVG badge
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
      <rect width="120" height="20" fill="#555"/>
      <rect x="70" width="50" height="20" fill="${getScoreColor(score)}"/>
      <text x="10" y="14" fill="white" font-family="Arial" font-size="11">${repoName}</text>
      <text x="85" y="14" fill="white" font-family="Arial" font-size="11" font-weight="bold">${score}</text>
    </svg>
  `
  
  // Convert SVG to blob and download
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${repoName}-security-badge.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportScanReport = async (
  scanSession: ScanSession,
  repository: Repository,
  vulnerabilities: Vulnerability[],
  format: 'json' | 'csv' = 'json'
): Promise<void> => {
  const report = {
    id: scanSession.id,
    repository,
    scanSession,
    vulnerabilities,
    generatedAt: new Date().toISOString(),
    format
  }
  
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repository.repo_name}-security-report.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } else if (format === 'csv') {
    // Convert to CSV format
    const csvContent = convertToCSV(report)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repository.repo_name}-security-report.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Helper functions
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#16a34a' // Green
  if (score >= 60) return '#d97706' // Orange
  if (score >= 40) return '#ea580c' // Red-orange
  return '#dc2626' // Red
}

const convertToCSV = (report: any): string => {
  const headers = ['Vulnerability', 'Severity', 'Description', 'Component', 'CVE ID', 'GHSA ID']
  const rows = report.vulnerabilities.map((vuln: Vulnerability) => {
    // Extract GHSA ID if it exists
    const ghsaId = vuln.raw_data?.aliases?.find((a: string) => typeof a === 'string' && a.startsWith('GHSA-')) || 
                  (vuln.raw_data?.id && typeof vuln.raw_data.id === 'string' && vuln.raw_data.id.startsWith('GHSA-') 
                    ? vuln.raw_data.id : '')
    
    return [
      vuln.title,
      vuln.severity,
      vuln.description,
      vuln.affected_component || 'N/A',
      vuln.cve_id || 'N/A',
      ghsaId || 'N/A'
    ]
  })
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Retry logic for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError!
}