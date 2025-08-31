/**
 * Enhanced API Key and Secret Detection Module
 * 
 * This module focuses on detecting exposed API keys, tokens and secrets in code.
 * It uses a combination of pattern matching, entropy analysis, and known API key formats
 * to identify potentially exposed sensitive credentials.
 */

// Patterns for common API keys and tokens
const API_KEY_PATTERNS = [
  // Basic key names (allow camelCase and quoted/unquoted) with a quoted value
  /(api[_-]?key|apikey|apiToken|api_token|auth[_-]?token|access[_-]?token|secretKey|apiSecret|secret)(["'])?\s*[:=]\s*['"][A-Za-z0-9_\-\.]{16,}['"]/i,
  
  // Environment variable patterns for keys
  /(API_KEY|APIKEY|API_SECRET|API_TOKEN|AUTH_TOKEN|ACCESS_TOKEN)\s*=\s*["'][A-Za-z0-9_\-\.]{16,}["']/i,
  
  // Common service-specific API keys (named)
  /\b(github(?:Access)?Token|github[_-]?token)\b\s*[:=]\s*['"]ghp_[A-Za-z0-9]{36}['"]/i,
  /\b(stripe(?:Api|Secret)?Key|stripe[_-]?(api|secret)[_-]?key)\b\s*[:=]\s*['"]sk_[A-Za-z0-9]{24,}['"]/i,
  /(['"])?aws[_-]?(access|secret)[_-]?key(['"])?.*[:=].*['"][A-Za-z0-9\/+]{20,}['"]/i,
  /(['"])?azure[_-]?(api|access)[_-]?key(['"])?.*[:=].*['"][A-Za-z0-9\/+]{40,}['"]/i,
  /(['"])?google[_-]?api[_-]?key(['"])?.*[:=].*['"][A-Za-z0-9\-_]{30,}['"]/i,
  /(['"])?twilio[_-]?(api|auth)[_-]?token(['"])?.*[:=].*['"][A-Za-z0-9]{32,}['"]/i,
  
  // URL patterns with API keys
  /https?:\/\/[^\/\s]+\/[^\s]*[?&](api_?key|access_?token|auth_?token)=([A-Za-z0-9_\-\.]{16,})/i,
  
  // JWT/OAuth in assignment
  /(['"])?jwt[_-]?token(['"])?\s*[:=]\s*['"][A-Za-z0-9\-_\.]{30,500}['"]/i,
  /(['"])?oauth[_-]?token(['"])?\s*[:=]\s*['"][A-Za-z0-9\-_]{30,100}['"]/i,
  
  // Database connection strings
  /(['"])?connection[_-]?string(['"])?\s*[:=]\s*(['"]).*password=.+\3/i,
  
  // Bearer token in header definition
  /(['"])?Authorization(['"])?\s*[:=]\s*['"]Bearer\s+[A-Za-z0-9\-_\.]{30,500}['"]/i,
  
  // Generic secret patterns
  /(['"])?secret(['"])?\s*[:=]\s*['"][A-Za-z0-9\-_\.]{8,100}['"]/i,
]

// Value-only patterns (no key name required)
const VALUE_ONLY_PATTERNS = [
  /['"]sk_[A-Za-z0-9]{24,}['"]/i,           // Stripe secret-like
  /['"]ghp_[A-Za-z0-9]{36}['"]/i,           // GitHub PAT
  /['"]eyJ[A-Za-z0-9\-_\.]{20,}['"]/i,    // JWT-like (starts with base64 header)
]

// High entropy string detector thresholds
const ENTROPY_THRESHOLD = 4.5;  // Higher values = more specific detection

/**
 * Calculate Shannon entropy of a string to detect random-looking strings
 * that might be keys or tokens
 */
function calculateEntropy(str: string): number {
  const len = str.length;
  const frequencies = new Map<string, number>();
  
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  
  return Array.from(frequencies.values()).reduce((entropy, freq) => {
    const probability = freq / len;
    return entropy - probability * Math.log2(probability);
  }, 0);
}

/**
 * Check if a file contains sensitive API keys or tokens
 */
export function detectAPIKeys(fileContent: string, filePath: string): Array<{
  type: string;
  value: string;
  line: number;
  context: string;
}> {
  const findings: Array<{
    type: string;
    value: string;
    line: number;
    context: string;
  }> = [];
  
  // Skip certain file types that commonly have false positives
  if (
    filePath.includes('node_modules/') ||
    filePath.includes('dist/') ||
    filePath.endsWith('.min.js') ||
    filePath.endsWith('.svg') ||
    filePath.endsWith('.map')
  ) {
    return [];
  }
  
  const lines = fileContent.split('\n');
  
  lines.forEach((line, index) => {
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*')) {
      return;
    }
    
    // Check against both key+value and value-only patterns
    for (const pattern of [...API_KEY_PATTERNS, ...VALUE_ONLY_PATTERNS]) {
      const match = line.match(pattern);
      if (match) {
        // Extract the actual key value
        let keyValue = match[0];
        
        // Try to extract just the key/token value
        const valueMatch = keyValue.match(/['":]([a-zA-Z0-9\-_\.\/+]{8,100})['"]/);
        if (valueMatch && valueMatch[1]) {
          keyValue = valueMatch[1];
        }
        
        // Determine the type of key/token
        let keyType = 'API Key/Token';
        if (match[0].toLowerCase().includes('aws')) keyType = 'AWS Key';
        else if (match[0].toLowerCase().includes('google')) keyType = 'Google API Key';
        else if (match[0].toLowerCase().includes('github') || /ghp_/.test(match[0])) keyType = 'GitHub Token';
        else if (match[0].toLowerCase().includes('stripe') || /sk_/.test(match[0])) keyType = 'Stripe Key';
        else if (match[0].toLowerCase().includes('jwt') || /eyJ/.test(match[0])) keyType = 'JWT Token';
        else if (match[0].toLowerCase().includes('oauth')) keyType = 'OAuth Token';
        else if (match[0].toLowerCase().includes('bearer')) keyType = 'Bearer Token';
        
        findings.push({
          type: keyType,
          value: keyValue,
          line: index + 1,
          context: line.trim()
        });
        
        // Don't check for more patterns on this line
        return;
      }
    }
    
    // Check for high entropy strings that might be keys/tokens
    const words = line.split(/[\s=:;"'`]/g).filter(w => w.length >= 16 && w.length <= 100);
    
    for (const word of words) {
      // Skip common non-key strings
      if (
        word.startsWith('import ') ||
        word.startsWith('from ') ||
        word.includes('</') ||
        word.includes('http') ||
        word.includes('console.') ||
        word.includes('.js')
      ) {
        continue;
      }
      
      // Check string entropy
      const entropy = calculateEntropy(word);
      if (entropy > ENTROPY_THRESHOLD) {
        findings.push({
          type: 'Possible Secret (High Entropy)',
          value: word,
          line: index + 1,
          context: line.trim()
        });
      }
    }
  });
  
  return findings;
}

/**
 * Check for hardcoded URLs with potential credentials
 */
export function detectCredentialURLs(fileContent: string): Array<{
  type: string;
  value: string;
  line: number;
  context: string;
}> {
  const findings: Array<{
    type: string;
    value: string;
    line: number;
    context: string;
  }> = [];
  
  const lines = fileContent.split('\n');
  
  // Patterns for URLs with embedded credentials
  const urlCredentialPatterns = [
    // http(s)://username:password@host
    /https?:\/\/[a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+/i,
    
    // Database connection strings with passwords
    /(['"])?(jdbc|mongodb|mysql|postgresql|redis):.*password=([^&\s]+)/i,
    
    // Connection strings with credentials
    /(['"])?Data Source=.*;User ID=.*;Password=.*;/i,
  ];
  
  lines.forEach((line, index) => {
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*')) {
      return;
    }
    
    for (const pattern of urlCredentialPatterns) {
      const match = line.match(pattern);
      if (match) {
        findings.push({
          type: 'Credential in URL',
          value: match[0],
          line: index + 1,
          context: line.trim()
        });
      }
    }
  });
  
  return findings;
}

/**
 * Check for potentially insecure API configurations
 */
export function detectInsecureAPIConfigs(fileContent: string): Array<{
  type: string;
  issue: string;
  line: number;
  context: string;
}> {
  const findings: Array<{
    type: string;
    issue: string;
    line: number;
    context: string;
  }> = [];
  
  const lines = fileContent.split('\n');
  
  // Patterns for insecure API configurations
  const configPatterns = [
    {
      pattern: /((['"])?(cors|CORS)(['"])?.*[:=].*(['"])\*\5|\*\s*\})/i,
      issue: 'Overly permissive CORS configuration (*)',
      type: 'Insecure API Config'
    },
    {
      pattern: /(['"])?(authentication|auth)(['"])?.*[:=].*(['")]?(false|disabled|off|no)(['"])*/i,
      issue: 'Authentication disabled',
      type: 'Insecure API Config'
    },
    {
      pattern: /(['"])?(ssl|tls)(['"])?.*[:=].*(['")]?(false|disabled|off|no)(['"])*/i,
      issue: 'SSL/TLS disabled',
      type: 'Insecure API Config'
    },
    {
      pattern: /(['"])?(verify|certificate_verification)(['"])?.*[:=].*(['")]?(false|disabled|off|no)(['"])*/i,
      issue: 'Certificate verification disabled',
      type: 'Insecure API Config'
    },
    {
      pattern: /(['"])?(rate_?limit)(['"])?.*[:=].*(false|disabled|off|no|0)/i,
      issue: 'Rate limiting disabled',
      type: 'Insecure API Config'
    },
  ];
  
  lines.forEach((line, index) => {
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*')) {
      return;
    }
    
    for (const {pattern, issue, type} of configPatterns) {
      const match = line.match(pattern);
      if (match) {
        findings.push({
          type,
          issue,
          line: index + 1,
          context: line.trim()
        });
      }
    }
  });
  
  return findings;
}

/**
 * Main function to detect API-related vulnerabilities in code
 */
export function analyzeAPISecurityIssues(fileContent: string, filePath: string): Array<{
  id: string;
  vulnerability_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affected_component: string;
  raw_data: Record<string, any>;
}> {
  const apiKeys = detectAPIKeys(fileContent, filePath);
  const credentialURLs = detectCredentialURLs(fileContent);
  const insecureConfigs = detectInsecureAPIConfigs(fileContent);
  
  const vulnerabilities: Array<{
    id: string;
    vulnerability_type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    affected_component: string;
    raw_data: Record<string, any>;
  }> = [];
  
  // Process API keys
  for (const finding of apiKeys) {
    vulnerabilities.push({
      id: crypto.randomUUID(),
      vulnerability_type: 'exposed_api_key',
      severity: 'CRITICAL',
      title: `Exposed ${finding.type}`,
      description: `An ${finding.type} appears to be hardcoded in the source code. This exposes sensitive credentials that could be used to gain unauthorized access to services or data.`,
      affected_component: filePath,
      raw_data: {
        line: finding.line,
        context: finding.context,
        // Mask part of the value to avoid further exposure
        value: finding.value.length > 6 
          ? `${finding.value.substring(0, 3)}...${finding.value.substring(finding.value.length - 3)}`
          : '******'
      }
    });
  }
  
  // Process credential URLs
  for (const finding of credentialURLs) {
    vulnerabilities.push({
      id: crypto.randomUUID(),
      vulnerability_type: 'exposed_credentials',
      severity: 'CRITICAL',
      title: 'Credentials in URL',
      description: 'Username and password credentials appear to be hardcoded in a URL or connection string. This exposes sensitive authentication information.',
      affected_component: filePath,
      raw_data: {
        line: finding.line,
        context: finding.context,
        // Mask the value to avoid further exposure
        value: finding.value.replace(/:[^:@]+@/, ':******@')
      }
    });
  }
  
  // Process insecure configurations
  for (const finding of insecureConfigs) {
    vulnerabilities.push({
      id: crypto.randomUUID(),
      vulnerability_type: 'insecure_api_config',
      severity: 'HIGH',
      title: `Insecure API Configuration: ${finding.issue}`,
      description: `An insecure API configuration was detected: ${finding.issue}. This could lead to unauthorized access or data exposure.`,
      affected_component: filePath,
      raw_data: {
        line: finding.line,
        context: finding.context,
        issue: finding.issue
      }
    });
  }
  
  return vulnerabilities;
}
