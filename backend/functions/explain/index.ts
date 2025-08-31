/**
 * LockDown AI Vulnerability Explanation Service (Enhanced)
 * 
 * This Edge Function provides AI-powered explanations of security vulnerabilities by:
 * 1. Receiving vulnerability data from the frontend
 * 2. Calling Google Gemini API for intelligent analysis
 * 3. Generating human-readable explanations and suggested fixes
 * 4. Storing explanations in database for future reference
 * 5. Providing actionable security guidance
 * 
 * Technical Features:
 * - Integration with Google Gemini Pro AI model
 * - Structured prompt engineering for consistent outputs
 * - Caching of AI responses to reduce API costs
 * - Comprehensive error handling and fallbacks
 * - Security-conscious input validation
 */

// Ambient declaration for Deno in TypeScript tooling
declare const Deno: any

import { 
  verifyAuth, 
  checkRateLimit, 
  validateInput,
  logSecurityEvent,
  createSupabaseClient,
  type AuthenticatedUser
} from '../auth/utils.ts'

// Types for AI explanation service
interface ExplanationRequest {
  vulnerability: {
    cve_id?: string
    ghsa_id?: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    title: string
    description: string
    vulnerability_type?: string
    affected_component?: string
    affected_version?: string
    fixed_version?: string
    cvss_score?: number
  }
  context?: {
    repository?: string
    language?: string
    framework?: string
  }
  options?: {
    include_code_examples?: boolean
    include_detection_methods?: boolean
    include_best_practices?: boolean
    detailed_explanation?: boolean
  }
}

interface AIExplanation {
  explanation: string
  suggestedFix: string
  riskAssessment: string
  mitigationSteps: string[]
  detectionMethods?: string
  securityBestPractices?: string
  confidenceScore: number
  tokensUsed: number
  processingTime: number
}

interface ExplanationResponse {
  success: boolean
  explanation?: AIExplanation
  error?: string
  statusCode?: number
}

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

// Enhanced security-focused prompt template for improved vulnerability explanation
const VULNERABILITY_PROMPT_TEMPLATE = `You are a highly experienced cybersecurity expert specializing in software vulnerability analysis, remediation, and security architecture. Your task is to provide a comprehensive analysis of the security vulnerability described below.

IMPORTANT: You are analyzing a real security vulnerability. Provide specific, actionable, and accurate information. Do not give generic responses. If you have detailed information about the vulnerability, use it to provide concrete guidance.

Please analyze the following security vulnerability and provide a detailed, actionable response with:

1. **Clear Explanation**: Explain what this vulnerability is, how it works, and why it's dangerous. Be specific about:
   - The exact mechanism of the vulnerability
   - How attackers could exploit it
   - What systems or data could be compromised
   - Real-world examples if available

2. **Suggested Fix**: Provide specific, actionable code examples or configuration changes to fix this vulnerability. Include:
   - Exact code changes needed
   - Version updates required
   - Configuration modifications
   - Before/after examples with comments

3. **Risk Assessment**: Provide a detailed risk analysis including:
   - Specific attack scenarios and their likelihood
   - Potential data exposure or system compromise
   - Business impact (data loss, service disruption, compliance issues)
   - Whether this could be part of a larger attack chain
   - Exploitation complexity and prerequisites

4. **Mitigation Steps**: List 5-7 specific, prioritized steps:
   - Immediate actions (within 24 hours)
   - Short-term fixes (within a week)
   - Long-term preventive measures
   - Monitoring and detection steps

5. **Detection Methods**: Explain how to:
   - Identify if this vulnerability exists in your codebase
   - Detect if it has been exploited
   - Monitor for future exploitation attempts
   - Set up automated scanning and alerts

6. **Security Best Practices**: Provide specific best practices to prevent similar vulnerabilities, including:
   - Code review guidelines
   - Testing strategies
   - Dependency management practices
   - Security scanning tools and configurations

**Vulnerability Details:**
- Title: {title}
- Description: {description}
- Severity: {severity}
- Type: {vulnerability_type}
- Affected Component: {affected_component}
- CVE ID: {cve_id || 'Not specified'}
- GHSA ID: {ghsa_id || 'Not specified'}
- CVSS Score: {cvss_score || 'Not specified'}

**GHSA Details (if available):**
{ghsa_details}

**Context:**
- Repository: {repository || 'Not specified'}
- Language/Framework: {language || 'Not specified'}

SPECIAL INSTRUCTIONS:
- If this is a GHSA vulnerability, use the detailed GHSA information to provide specific guidance about affected versions, patched versions, and exact remediation steps.
- If this is a dependency vulnerability, provide exact version numbers and update commands.
- If this is a code vulnerability, provide specific code examples and patterns to avoid.
- If this is a configuration issue, provide exact configuration changes needed.
- Always prioritize actionable, specific advice over generic statements.

Please format your response as JSON with the following structure:
{
  "explanation": "Detailed explanation of the vulnerability with specific attack vectors and mechanisms",
  "suggestedFix": "Specific fix with exact code examples, version updates, or configuration changes",
  "riskAssessment": "Comprehensive risk analysis with specific attack scenarios and business impact",
  "mitigationSteps": ["Immediate action 1", "Short-term fix 2", "Long-term measure 3", "Monitoring step 4", "Prevention step 5"],
  "detectionMethods": "Specific ways to detect this vulnerability and monitor for exploitation",
  "securityBestPractices": "Specific best practices to prevent similar vulnerabilities",
  "confidenceScore": 0.95
}

Provide the most thorough, accurate, and actionable guidance possible. Be specific and avoid generic statements.`

/**
 * Main handler for the explain endpoint
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
    const rateLimitOk = await checkRateLimit(user.id, 'explain', 50, 60000) // 50 explanations per minute
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before making another explanation request.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const requestBody: ExplanationRequest = await request.json()
    
    if (!requestBody.vulnerability || !validateInput(requestBody.vulnerability.title) || !validateInput(requestBody.vulnerability.description)) {
      return new Response(
        JSON.stringify({ error: 'Invalid vulnerability data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log explanation request
    logSecurityEvent('explanation_requested', user.id, {
      vulnerabilityTitle: requestBody.vulnerability.title,
      severity: requestBody.vulnerability.severity,
      cveId: requestBody.vulnerability.cve_id,
      ghsaId: requestBody.vulnerability.ghsa_id
    })

    // Fetch GHSA details if a GHSA ID is provided
    let ghsaDetails = null
    if (requestBody.vulnerability.ghsa_id && requestBody.vulnerability.ghsa_id.startsWith('GHSA-')) {
      try {
        console.log(`Fetching GHSA details for ${requestBody.vulnerability.ghsa_id}`)
        ghsaDetails = await fetchGHSADetails(requestBody.vulnerability.ghsa_id)
        console.log('GHSA details fetched successfully')
      } catch (error) {
        console.error('Failed to fetch GHSA details:', error)
        // Continue without GHSA details
      }
    }

    // Generate AI explanation
    const explanationResult = await generateAIExplanation(
      requestBody.vulnerability, 
      requestBody.context,
      requestBody.options,
      ghsaDetails
    )

    if (!explanationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: explanationResult.error || 'Failed to generate explanation',
          statusCode: explanationResult.statusCode || 500
        }),
        { 
          status: explanationResult.statusCode || 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store explanation in database for future reference
    await storeExplanation(user.id, requestBody.vulnerability, explanationResult.explanation!)

    return new Response(
      JSON.stringify({
        success: true,
        explanation: explanationResult.explanation,
        message: 'AI explanation generated successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Explain endpoint error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during explanation generation',
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
 * Fetch GHSA details from GitHub API
 */
async function fetchGHSADetails(ghsaId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.github.com/advisories/${ghsaId}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LockDown-Security-Scanner'
      }
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    const data = await response.json()
    return {
      summary: data.summary,
      description: data.description,
      severity: data.severity,
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
  } catch (error) {
    console.error('Error fetching GHSA details:', error)
    throw error
  }
}

/**
 * Generate AI explanation using Google Gemini API
 */
async function generateAIExplanation(
  vulnerability: ExplanationRequest['vulnerability'],
  context?: ExplanationRequest['context'],
  options?: ExplanationRequest['options'],
  ghsaDetails?: any
): Promise<ExplanationResponse> {
  
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not configured')
    return {
      success: false,
      error: 'AI service not configured',
      statusCode: 503
    }
  }

  const startTime = Date.now()
  
  try {
    // Check if we have a cached explanation first (skip if options request detailed analysis)
    if (!options?.detailed_explanation) {
      const cachedExplanation = await getCachedExplanation(vulnerability)
      if (cachedExplanation) {
        return {
          success: true,
          explanation: {
            ...cachedExplanation,
            processingTime: Date.now() - startTime,
            tokensUsed: 0 // Cached response, no new tokens used
          }
        }
      }
    }

    // Format GHSA details for the prompt
    let ghsaDetailsText = 'Not available'
    if (ghsaDetails) {
      ghsaDetailsText = `
Summary: ${ghsaDetails.summary || 'Not provided'}
Description: ${ghsaDetails.description || 'Not provided'}
Severity: ${ghsaDetails.severity || 'Not provided'}
CVSS Score: ${ghsaDetails.cvss_score || 'Not provided'}
CVSS Vector: ${ghsaDetails.cvss_vector || 'Not provided'}
Published: ${ghsaDetails.published_at || 'Not provided'}
Updated: ${ghsaDetails.updated_at || 'Not provided'}
CVE IDs: ${ghsaDetails.cve_ids?.join(', ') || 'None'}
References: ${ghsaDetails.references?.join(', ') || 'None'}
Affected Packages: ${ghsaDetails.affected_packages?.map((pkg: any) => 
  `${pkg.name} (${pkg.ecosystem}): ${pkg.affected_versions} -> ${pkg.patched_versions || 'No patch available'}`
).join('; ') || 'None'}
Vulnerable Functions: ${ghsaDetails.vulnerable_functions?.join(', ') || 'None'}
Patched Versions: ${ghsaDetails.patched_versions?.join(', ') || 'None'}`
    }

    // Prepare the prompt with vulnerability details
    const prompt = VULNERABILITY_PROMPT_TEMPLATE
      .replace('{title}', vulnerability.title)
      .replace('{description}', vulnerability.description)
      .replace('{severity}', vulnerability.severity)
      .replace('{vulnerability_type}', vulnerability.vulnerability_type || 'Unknown')
      .replace('{affected_component}', vulnerability.affected_component || 'Unknown')
      .replace('{cve_id}', vulnerability.cve_id || 'Not specified')
      .replace('{ghsa_id}', vulnerability.ghsa_id || 'Not specified')
      .replace('{cvss_score}', vulnerability.cvss_score?.toString() || 'Not specified')
      .replace('{ghsa_details}', ghsaDetailsText)
      .replace('{repository}', context?.repository || 'Not specified')
      .replace('{language}', context?.language || 'Not specified')

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent, focused responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096, // Increased for more detailed explanations
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorText)
      
      return {
        success: false,
        error: `AI service error: ${response.status}`,
        statusCode: response.status
      }
    }

    const responseData = await response.json()
    
    // Extract the generated text from Gemini response
    const generatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!generatedText) {
      console.error('Invalid response format from Gemini API:', responseData)
      return {
        success: false,
        error: 'Invalid response from AI service',
        statusCode: 500
      }
    }

    // Parse the JSON response from Gemini
    let parsedExplanation: Partial<AIExplanation>
    try {
      // Extract JSON from the response (Gemini might wrap it in markdown)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedExplanation = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError)
      console.log('Raw response:', generatedText)
      
      // Fallback: create a structured response from the raw text
      parsedExplanation = createFallbackExplanation(generatedText, vulnerability)
    }

    // Validate and structure the explanation
    const explanation: AIExplanation = {
      explanation: parsedExplanation.explanation || 'AI explanation generated successfully',
      suggestedFix: parsedExplanation.suggestedFix || 'Please review the vulnerability details and apply appropriate security measures',
      riskAssessment: parsedExplanation.riskAssessment || `This is a ${vulnerability.severity.toLowerCase()} severity vulnerability that requires attention`,
      mitigationSteps: parsedExplanation.mitigationSteps || [
        'Review the vulnerability details',
        'Apply the suggested fix',
        'Test the fix thoroughly',
        'Monitor for similar issues'
      ],
      detectionMethods: parsedExplanation.detectionMethods,
      securityBestPractices: parsedExplanation.securityBestPractices,
      confidenceScore: parsedExplanation.confidenceScore || 0.8,
      tokensUsed: responseData.usageMetadata?.totalTokenCount || 0,
      processingTime: Date.now() - startTime
    }

    // Cache the explanation for future use
    await cacheExplanation(vulnerability, explanation)

    return {
      success: true,
      explanation
    }

  } catch (error) {
    console.error('Error generating AI explanation:', error)
    
    return {
      success: false,
      error: 'Failed to generate AI explanation',
      statusCode: 500
    }
  }
}

/**
 * Create a fallback explanation when JSON parsing fails
 */
function createFallbackExplanation(rawText: string, vulnerability: ExplanationRequest['vulnerability']): Partial<AIExplanation> {
  // Extract meaningful parts from the raw text
  const lines = rawText.split('\n').filter(line => line.trim().length > 0)
  
  let explanation = ''
  let suggestedFix = ''
  let riskAssessment = ''
  let mitigationSteps: string[] = []
  let detectionMethods = ''
  let securityBestPractices = ''
  
  // Simple parsing logic to extract different sections
  let currentSection = ''
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    if (lowerLine.includes('explanation') || lowerLine.includes('what') || lowerLine.includes('vulnerability')) {
      currentSection = 'explanation'
    } else if (lowerLine.includes('fix') || lowerLine.includes('solution') || lowerLine.includes('remediation')) {
      currentSection = 'fix'
    } else if (lowerLine.includes('risk') || lowerLine.includes('impact') || lowerLine.includes('danger')) {
      currentSection = 'risk'
    } else if (lowerLine.includes('step') || lowerLine.includes('action') || lowerLine.includes('mitigation')) {
      currentSection = 'mitigation'
    } else if (lowerLine.includes('detect') || lowerLine.includes('monitor') || lowerLine.includes('identify')) {
      currentSection = 'detection'
    } else if (lowerLine.includes('practice') || lowerLine.includes('prevent') || lowerLine.includes('security best')) {
      currentSection = 'practices'
    }
    
    // Add content to appropriate section
    switch (currentSection) {
      case 'explanation':
        explanation += line + ' '
        break
      case 'fix':
        suggestedFix += line + ' '
        break
      case 'risk':
        riskAssessment += line + ' '
        break
      case 'mitigation':
        if (line.trim().length > 10) { // Only add substantial lines
          mitigationSteps.push(line.trim())
        }
        break
      case 'detection':
        detectionMethods += line + ' '
        break
      case 'practices':
        securityBestPractices += line + ' '
        break
    }
  }
  
  return {
    explanation: explanation.trim() || `This is a ${vulnerability.severity.toLowerCase()} severity vulnerability: ${vulnerability.description}`,
    suggestedFix: suggestedFix.trim() || 'Review the vulnerability and apply appropriate security measures',
    riskAssessment: riskAssessment.trim() || `This ${vulnerability.severity.toLowerCase()} vulnerability could pose significant security risks`,
    mitigationSteps: mitigationSteps.length > 0 ? mitigationSteps : [
      'Immediately review the affected code',
      'Apply security patches if available',
      'Implement proper input validation',
      'Test the fix thoroughly'
    ],
    detectionMethods: detectionMethods.trim() || 'Monitor logs for unusual access patterns and review code for similar vulnerabilities.',
    securityBestPractices: securityBestPractices.trim() || 'Follow the principle of least privilege and implement proper input validation and output encoding.'
  }
}

/**
 * Check for cached explanation to reduce API calls
 */
async function getCachedExplanation(vulnerability: ExplanationRequest['vulnerability']): Promise<AIExplanation | null> {
  try {
    const supabase = createSupabaseClient()
    
    // Use vulnerability identifier (CVE or GHSA) for cache lookup
    const vulnerabilityId = vulnerability.cve_id || vulnerability.ghsa_id || 'unknown'
    
    // Look for existing explanation with similar characteristics
    const { data: existingExplanation } = await supabase
      .from('ai_explanations')
      .select('*')
      .eq('vulnerability_id', vulnerabilityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (existingExplanation) {
      // Check if the explanation is recent (within 24 hours)
      const explanationAge = Date.now() - new Date(existingExplanation.created_at).getTime()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (explanationAge < maxAge) {
        return {
          explanation: existingExplanation.explanation,
          suggestedFix: existingExplanation.suggested_fix,
          riskAssessment: existingExplanation.risk_assessment || '',
          mitigationSteps: existingExplanation.mitigation_steps || [],
          detectionMethods: existingExplanation.detection_methods,
          securityBestPractices: existingExplanation.security_best_practices,
          confidenceScore: existingExplanation.confidence_score || 0.8,
          tokensUsed: existingExplanation.tokens_used || 0,
          processingTime: 0
        }
      }
    }
    
    return null
    
  } catch (error) {
    console.error('Error checking cached explanation:', error)
    return null
  }
}

/**
 * Cache explanation for future use
 */
async function cacheExplanation(
  vulnerability: ExplanationRequest['vulnerability'],
  explanation: AIExplanation
): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    // Use vulnerability identifier (CVE or GHSA) for cache
    const vulnerabilityId = vulnerability.cve_id || vulnerability.ghsa_id || 'unknown'
    
    // Store the explanation in the database
    await supabase
      .from('ai_explanations')
      .insert({
        vulnerability_id: vulnerabilityId,
        explanation: explanation.explanation,
        suggested_fix: explanation.suggestedFix,
        risk_assessment: explanation.riskAssessment,
        mitigation_steps: explanation.mitigationSteps,
        detection_methods: explanation.detectionMethods,
        security_best_practices: explanation.securityBestPractices,
        ai_model: 'gemini-pro',
        confidence_score: explanation.confidenceScore,
        tokens_used: explanation.tokensUsed,
        processing_time_ms: explanation.processingTime
      })
    
  } catch (error) {
    console.error('Error caching explanation:', error)
    // Don't throw here as caching failure shouldn't break the main flow
  }
}

/**
 * Store explanation in database for audit and future reference
 */
async function storeExplanation(
  userId: string,
  vulnerability: ExplanationRequest['vulnerability'],
  explanation: AIExplanation
): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    // Create a vulnerability record if it doesn't exist
    const { data: vulnRecord, error: vulnError } = await supabase
      .from('vulnerabilities')
      .insert({
        cve_id: vulnerability.cve_id,
        vulnerability_type: vulnerability.vulnerability_type || 'unknown',
        severity: vulnerability.severity,
        title: vulnerability.title,
        description: vulnerability.description,
        affected_component: vulnerability.affected_component,
        affected_version: vulnerability.affected_version,
        fixed_version: vulnerability.fixed_version,
        cvss_score: vulnerability.cvss_score,
        raw_data: { 
          source: 'ai_explanation_request', 
          user_id: userId,
          ghsa_id: vulnerability.ghsa_id
        }
      })
      .select('id')
      .single()
    
    if (vulnError && vulnError.code !== '23505') { // 23505 is unique constraint violation
      console.error('Error creating vulnerability record:', vulnError)
      return
    }
    
    const vulnerabilityId = vulnRecord?.id || 'unknown'
    
    // Store the AI explanation
    await supabase
      .from('ai_explanations')
      .insert({
        vulnerability_id: vulnerabilityId,
        explanation: explanation.explanation,
        suggested_fix: explanation.suggestedFix,
        risk_assessment: explanation.riskAssessment,
        mitigation_steps: explanation.mitigationSteps,
        detection_methods: explanation.detectionMethods,
        security_best_practices: explanation.securityBestPractices,
        ai_model: 'gemini-pro',
        confidence_score: explanation.confidenceScore,
        tokens_used: explanation.tokensUsed,
        processing_time_ms: explanation.processingTime
      })
    
  } catch (error) {
    console.error('Error storing explanation:', error)
    // Don't throw here as storage failure shouldn't break the main flow
  }
}