/**
 * LockDown AI Vulnerability Explanation Service
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
  vulnerabilityId?: string
  vulnerability?: {
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
}

interface AIExplanation {
  explanation: string
  suggestedFix: string
  riskAssessment: string
  mitigationSteps: string[]
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

// Security-focused prompt template for vulnerability explanation
const VULNERABILITY_PROMPT_TEMPLATE = `You are a cybersecurity expert specializing in software vulnerability analysis and remediation. 

Please analyze the following security vulnerability and provide:

1. **Clear Explanation**: Explain what this vulnerability is, how it works, and why it's dangerous in simple terms that a student developer can understand.

2. **Suggested Fix**: Provide specific, actionable code examples or configuration changes to fix this vulnerability.

3. **Risk Assessment**: Explain the potential impact and risk level of this vulnerability.

4. **Mitigation Steps**: List 3-5 specific steps to address this vulnerability, including any immediate actions needed.

**Vulnerability Details:**
- Title: {title}
- Description: {description}
- Severity: {severity}
- Type: {vulnerability_type}
- Affected Component: {affected_component}
- CVE ID: {cve_id || 'Not specified'}
- GHSA ID: {ghsa_id || 'Not specified'}
- CVSS Score: {cvss_score || 'Not specified'}

**Context:**
- Repository: {repository || 'Not specified'}
- Language/Framework: {language || 'Not specified'}

Please format your response as JSON with the following structure:
{
  "explanation": "Clear explanation of the vulnerability",
  "suggestedFix": "Specific fix with code examples",
  "riskAssessment": "Risk level and potential impact",
  "mitigationSteps": ["Step 1", "Step 2", "Step 3"],
  "confidenceScore": 0.95
}

Focus on practical, actionable advice that helps developers understand and fix the issue quickly.`

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

    // Parse and validate request body
    const requestBody: ExplanationRequest = await request.json()

    // Load vulnerability either by ID or from provided data
    const supabase = createSupabaseClient()
    let vulnerabilityRecord: any | null = null
    if (requestBody.vulnerabilityId) {
      const { data: vrec, error: verr } = await supabase
        .from('vulnerabilities')
        .select('*')
        .eq('id', requestBody.vulnerabilityId)
        .single()
      if (verr || !vrec) {
        return new Response(
          JSON.stringify({ error: 'Vulnerability not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      vulnerabilityRecord = vrec
    } else if (requestBody.vulnerability) {
      if (!validateInput(requestBody.vulnerability.title) || !validateInput(requestBody.vulnerability.description)) {
        return new Response(
          JSON.stringify({ error: 'Invalid vulnerability data provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      vulnerabilityRecord = requestBody.vulnerability
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing vulnerabilityId or vulnerability data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // After we have a concrete vulnerability record, enforce rate limiting (per-vulnerability key)
    const ghsaFromRaw = (vulnerabilityRecord as any)?.raw_data?.aliases?.find?.((a: string) => typeof a === 'string' && a.startsWith('GHSA-'))
    const rateLimitKey = requestBody.vulnerabilityId
      ? `explain:${requestBody.vulnerabilityId}`
      : (vulnerabilityRecord.cve_id ? `explain:${vulnerabilityRecord.cve_id}` : (ghsaFromRaw ? `explain:${ghsaFromRaw}` : 'explain'))
    const rateLimitOk = await checkRateLimit(user.id, rateLimitKey, 50, 60000)
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before making another explanation request.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log explanation request using resolved record
    logSecurityEvent('explanation_requested', user.id, {
      vulnerabilityTitle: vulnerabilityRecord.title,
      severity: vulnerabilityRecord.severity,
      cveId: vulnerabilityRecord.cve_id,
      ghsaId: ghsaFromRaw
    })

    // Generate AI explanation
    const explanationResult = await generateAIExplanation(
      {
        cve_id: vulnerabilityRecord.cve_id,
        ghsa_id: ghsaFromRaw,
        severity: vulnerabilityRecord.severity,
        title: vulnerabilityRecord.title,
        description: vulnerabilityRecord.description,
        vulnerability_type: vulnerabilityRecord.vulnerability_type,
        affected_component: vulnerabilityRecord.affected_component,
        affected_version: vulnerabilityRecord.affected_version,
        fixed_version: vulnerabilityRecord.fixed_version,
        cvss_score: vulnerabilityRecord.cvss_score
      },
      requestBody.context,
      requestBody.vulnerabilityId || undefined
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
    if (requestBody.vulnerabilityId) {
      await storeExplanationForExistingVuln(user.id, requestBody.vulnerabilityId, explanationResult.explanation!)
    }

    // Convert explanation to frontend snake_case structure
    const e = explanationResult.explanation!
    const uiExplanation = {
      id: crypto.randomUUID?.() || undefined,
      vulnerability_id: requestBody.vulnerabilityId,
      explanation: e.explanation,
      suggested_fix: e.suggestedFix,
      risk_assessment: e.riskAssessment,
      mitigation_steps: e.mitigationSteps,
      ai_model: 'gemini-pro',
      confidence_score: e.confidenceScore,
      tokens_used: e.tokensUsed,
      processing_time_ms: e.processingTime,
      created_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify({
        success: true,
        explanation: uiExplanation,
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
 * Generate AI explanation using Google Gemini API
 */
async function generateAIExplanation(
  vulnerability: NonNullable<ExplanationRequest['vulnerability']>,
  context?: ExplanationRequest['context'],
  vulnerabilityIdForCache?: string
): Promise<ExplanationResponse> {
  
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Falling back to heuristic explanation.')
    const start = Date.now()
    const fallback: AIExplanation = {
      explanation: `This appears to be a ${vulnerability.severity.toLowerCase()} severity vulnerability affecting ${vulnerability.affected_component || 'an unspecified component'}. ${vulnerability.description}`,
      suggestedFix: 'Update to a fixed version if available, validate and sanitize inputs, and apply vendor-recommended mitigations.',
      riskAssessment: `Potential impact aligns with ${vulnerability.severity.toLowerCase()} severity. Prioritize remediation accordingly.`,
      mitigationSteps: [
        'Identify all affected components/versions in your codebase',
        vulnerability.fixed_version ? `Upgrade ${vulnerability.affected_component || 'the package'} to ${vulnerability.fixed_version}` : 'Check for a patched/fixed version and upgrade promptly',
        'Add input validation and output encoding where applicable',
        'Add regression tests and monitor after deployment'
      ],
      confidenceScore: 0.6,
      tokensUsed: 0,
      processingTime: Date.now() - start
    }
    if (vulnerabilityIdForCache) {
      await cacheExplanationById(vulnerabilityIdForCache, fallback)
    }
    return { success: true, explanation: fallback }
  }

  const startTime = Date.now()
  
  try {
    // Check if we have a cached explanation first (by vulnerability ID if available)
    const cachedExplanation = vulnerabilityIdForCache ? await getCachedExplanationById(vulnerabilityIdForCache) : null
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
          temperature: 0.3, // Lower temperature for more consistent, focused responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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
      // Fallback to heuristic explanation on API failure
      const fallback: AIExplanation = {
        explanation: `This appears to be a ${vulnerability.severity.toLowerCase()} severity vulnerability affecting ${vulnerability.affected_component || 'an unspecified component'}. ${vulnerability.description}`,
        suggestedFix: 'Update to a fixed version if available, validate and sanitize inputs, and apply vendor-recommended mitigations.',
        riskAssessment: `Potential impact aligns with ${vulnerability.severity.toLowerCase()} severity. Prioritize remediation accordingly.`,
        mitigationSteps: [
          'Identify all affected components/versions in your codebase',
          vulnerability.fixed_version ? `Upgrade ${vulnerability.affected_component || 'the package'} to ${vulnerability.fixed_version}` : 'Check for a patched/fixed version and upgrade promptly',
          'Add input validation and output encoding where applicable',
          'Add regression tests and monitor after deployment'
        ],
        confidenceScore: 0.55,
        tokensUsed: 0,
        processingTime: Date.now() - startTime
      }
      if (vulnerabilityIdForCache) {
        await cacheExplanationById(vulnerabilityIdForCache, fallback)
      }
      return { success: true, explanation: fallback }
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
      confidenceScore: parsedExplanation.confidenceScore || 0.8,
      tokensUsed: responseData.usageMetadata?.totalTokenCount || 0,
      processingTime: Date.now() - startTime
    }

    // Cache the explanation for future use if we have a concrete vulnerability id
    if (vulnerabilityIdForCache) {
      await cacheExplanationById(vulnerabilityIdForCache, explanation)
    }

    return {
      success: true,
      explanation
    }

  } catch (error) {
    console.error('Error generating AI explanation:', error)
    // Last-resort fallback if anything throws
    const fallback: AIExplanation = {
      explanation: `This appears to be a ${vulnerability.severity.toLowerCase()} severity vulnerability affecting ${vulnerability.affected_component || 'an unspecified component'}. ${vulnerability.description}`,
      suggestedFix: 'Update to a fixed version if available, validate and sanitize inputs, and apply vendor-recommended mitigations.',
      riskAssessment: `Potential impact aligns with ${vulnerability.severity.toLowerCase()} severity. Prioritize remediation accordingly.`,
      mitigationSteps: [
        'Identify all affected components/versions in your codebase',
        vulnerability.fixed_version ? `Upgrade ${vulnerability.affected_component || 'the package'} to ${vulnerability.fixed_version}` : 'Check for a patched/fixed version and upgrade promptly',
        'Add input validation and output encoding where applicable',
        'Add regression tests and monitor after deployment'
      ],
      confidenceScore: 0.5,
      tokensUsed: 0,
      processingTime: Date.now() - startTime
    }
    if (vulnerabilityIdForCache) {
      await cacheExplanationById(vulnerabilityIdForCache, fallback)
    }
    return { success: true, explanation: fallback }
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
    ]
  }
}

/**
 * Check for cached explanation to reduce API calls
 */
async function getCachedExplanationById(vulnerabilityId: string): Promise<AIExplanation | null> {
  try {
    const supabase = createSupabaseClient()
    const { data: existingExplanation } = await supabase
      .from('ai_explanations')
      .select('*')
      .eq('vulnerability_id', vulnerabilityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (existingExplanation) {
      const explanationAge = Date.now() - new Date(existingExplanation.created_at).getTime()
      const maxAge = 24 * 60 * 60 * 1000
      if (explanationAge < maxAge) {
        return {
          explanation: existingExplanation.explanation,
          suggestedFix: existingExplanation.suggested_fix,
          riskAssessment: existingExplanation.risk_assessment || '',
          mitigationSteps: existingExplanation.mitigation_steps || [],
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
async function cacheExplanationById(
  vulnerabilityId: string,
  explanation: AIExplanation
): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    await supabase
      .from('ai_explanations')
      .insert({
        vulnerability_id: vulnerabilityId,
        explanation: explanation.explanation,
        suggested_fix: explanation.suggestedFix,
        risk_assessment: explanation.riskAssessment,
        mitigation_steps: explanation.mitigationSteps,
        ai_model: 'gemini-pro',
        confidence_score: explanation.confidenceScore,
        tokens_used: explanation.tokensUsed,
        processing_time_ms: explanation.processingTime
      })
  } catch (error) {
    console.error('Error caching explanation:', error)
  }
}

/**
 * Store explanation in database for audit and future reference
 */
async function storeExplanationForExistingVuln(
  userId: string,
  vulnerabilityId: string,
  explanation: AIExplanation
): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    await supabase
      .from('ai_explanations')
      .insert({
        vulnerability_id: vulnerabilityId,
        explanation: explanation.explanation,
        suggested_fix: explanation.suggestedFix,
        risk_assessment: explanation.riskAssessment,
        mitigation_steps: explanation.mitigationSteps,
        ai_model: 'gemini-pro',
        confidence_score: explanation.confidenceScore,
        tokens_used: explanation.tokensUsed,
        processing_time_ms: explanation.processingTime
      })
  } catch (error) {
    console.error('Error storing explanation:', error)
  }
}
