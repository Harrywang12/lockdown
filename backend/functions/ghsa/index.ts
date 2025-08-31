/**
 * LockDown GHSA Information Provider
 * 
 * This Edge Function retrieves detailed GitHub Security Advisory (GHSA) information:
 * 1. Receiving GHSA ID from the frontend
 * 2. Querying GitHub Advisory Database API
 * 3. Transforming and enriching the data
 * 4. Providing comprehensive vulnerability details
 * 
 * Technical Features:
 * - Direct integration with GitHub Advisory Database API
 * - Data enrichment from multiple vulnerability databases
 * - Caching of responses to reduce API costs
 * - Comprehensive error handling and fallbacks
 * - Security-conscious input validation
 */

import { 
  verifyAuth, 
  checkRateLimit, 
  validateInput,
  logSecurityEvent,
  createSupabaseClient,
  type AuthenticatedUser
} from '../auth/utils.ts'

// Types for GHSA details
interface GHSARequest {
  ghsaId: string
}

interface AffectedPackage {
  name: string
  ecosystem: string
  affected_versions: string
  patched_versions?: string
}

interface GHSADetails {
  id: string
  ghsa_id: string
  summary: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  classifications?: string[]
  cvss_score?: number
  cvss_vector?: string
  published_at?: string
  updated_at?: string
  references?: string[]
  affected_packages?: AffectedPackage[]
  cve_ids?: string[]
  vulnerable_functions?: string[]
  patched_versions?: string[]
}

interface GHSAResponse {
  success: boolean
  details?: GHSADetails
  error?: string
  statusCode?: number
  message?: string
}

// GitHub API configuration
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN') // Optional: for higher rate limits

/**
 * Main handler for the GHSA endpoint
 */
Deno.serve(async (request: Request) => {
  try {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Authentication failed' }),
        { status: authResult.statusCode || 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = authResult.user

    // Check rate limiting
    const rateLimitOk = await checkRateLimit(user.id, 'ghsa', 50, 60000) // 50 GHSA requests per minute
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before making another GHSA request.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const requestBody: GHSARequest = await request.json()
    
    if (!validateInput(requestBody.ghsaId) || !requestBody.ghsaId.startsWith('GHSA-')) {
      return new Response(
        JSON.stringify({ error: 'Invalid GHSA ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log GHSA request
    logSecurityEvent('ghsa_requested', user.id, {
      ghsaId: requestBody.ghsaId
    })

    // Check cache first
    const cachedDetails = await getGHSAFromCache(requestBody.ghsaId)
    if (cachedDetails) {
      return new Response(
        JSON.stringify({
          success: true,
          details: cachedDetails,
          message: 'GHSA details retrieved from cache'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get GHSA details from GitHub
    const ghsaDetails = await getGHSADetails(requestBody.ghsaId)

    // Store in cache
    await cacheGHSADetails(ghsaDetails)

    return new Response(
      JSON.stringify({
        success: true,
        details: ghsaDetails,
        message: 'GHSA details retrieved successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('GHSA endpoint error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Error retrieving GHSA details',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

/**
 * Retrieve GHSA details from GitHub Advisory Database
 */
async function getGHSADetails(ghsaId: string): Promise<GHSADetails> {
  try {
    // Build GitHub API request headers
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'LockDown-Security-Scanner'
    }
    
    // Add GitHub token if available
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`
    }

    // Fetch GHSA details from GitHub API
    const response = await fetch(`${GITHUB_API_URL}/advisories/${ghsaId}`, {
      headers
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform GitHub API response to our GHSADetails format
    const ghsaDetails: GHSADetails = {
      id: data.id,
      ghsa_id: data.ghsa_id,
      summary: data.summary,
      description: data.description,
      severity: data.severity.toUpperCase(),
      classifications: data.vulnerabilities?.map((v: any) => v.classification) || [],
      cvss_score: data.cvss?.score,
      cvss_vector: data.cvss?.vector_string,
      published_at: data.published_at,
      updated_at: data.updated_at,
      references: data.references?.map((ref: any) => ref.url) || [],
      affected_packages: data.affected?.map((pkg: any) => ({
        name: pkg.package.name,
        ecosystem: pkg.package.ecosystem,
        affected_versions: pkg.ranges?.map((r: any) => r.description).join(', ') || 'Unknown',
        patched_versions: pkg.ranges?.[0]?.fixed_version
      })) || [],
      cve_ids: data.cve_ids || [],
      vulnerable_functions: data.vulnerable_functions || [],
      patched_versions: data.patched_versions || []
    }

    // Enrich with additional data if available
    await enrichGHSADetails(ghsaDetails)

    return ghsaDetails
    
  } catch (error) {
    console.error('Error getting GHSA details:', error)
    throw error
  }
}

/**
 * Enrich GHSA details with additional data from other sources
 */
async function enrichGHSADetails(ghsaDetails: GHSADetails): Promise<void> {
  try {
    // If we have CVE IDs, try to get additional details from NVD
    if (ghsaDetails.cve_ids && ghsaDetails.cve_ids.length > 0) {
      const cveId = ghsaDetails.cve_ids[0]
      
      // Try to get CVSS score from NVD if not already available
      if (!ghsaDetails.cvss_score) {
        const nvdResponse = await fetch(`https://services.nvd.nist.gov/rest/json/cve/1.0/${cveId}`)
        
        if (nvdResponse.ok) {
          const nvdData = await nvdResponse.json()
          const nvdCvssData = nvdData?.result?.CVE_Items?.[0]?.impact?.baseMetricV3
          
          if (nvdCvssData) {
            ghsaDetails.cvss_score = nvdCvssData.cvssV3.baseScore
            ghsaDetails.cvss_vector = nvdCvssData.cvssV3.vectorString
          }
        }
      }
    }

    // Additional enrichment could be added here
    
  } catch (error) {
    console.error('Error enriching GHSA details:', error)
    // Continue with original GHSA details if enrichment fails
  }
}

/**
 * Check for cached GHSA details
 */
async function getGHSAFromCache(ghsaId: string): Promise<GHSADetails | null> {
  try {
    const supabase = createSupabaseClient()
    
    // Look for existing GHSA details in cache
    const { data, error } = await supabase
      .from('ghsa_cache')
      .select('*')
      .eq('ghsa_id', ghsaId)
      .single()
    
    if (error || !data) {
      return null
    }
    
    // Check if the cached data is still fresh (less than 24 hours old)
    const cacheAge = Date.now() - new Date(data.updated_at).getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (cacheAge > maxAge) {
      return null // Cache expired
    }
    
    return data.details as GHSADetails
    
  } catch (error) {
    console.error('Error checking GHSA cache:', error)
    return null
  }
}

/**
 * Cache GHSA details for future use
 */
async function cacheGHSADetails(details: GHSADetails): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    // Store or update the GHSA details in cache
    const { error } = await supabase
      .from('ghsa_cache')
      .upsert({
        ghsa_id: details.ghsa_id,
        details,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'ghsa_id'
      })
    
    if (error) {
      console.error('Error caching GHSA details:', error)
    }
    
  } catch (error) {
    console.error('Error caching GHSA details:', error)
    // Don't throw here as caching failure shouldn't break the main flow
  }
}
