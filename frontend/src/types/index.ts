// Core user types
export interface User {
  id: string
  github_id: number
  github_username: string
  github_email: string
  github_avatar_url: string
  created_at: string
  updated_at: string
  last_login: string
}

// Repository types
export interface Repository {
  id: string
  user_id: string
  github_repo_id: string
  repo_name: string
  repo_full_name: string
  repo_url: string
  default_branch: string
  language?: string
  is_private: boolean
  last_scan_at?: string
  scan_count: number
  created_at: string
  updated_at: string
}

// Vulnerability types
export interface Vulnerability {
  id: string
  cve_id?: string
  vulnerability_type: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  affected_component?: string
  affected_version?: string
  fixed_version?: string
  cvss_score?: number
  reference_urls?: string[]
  raw_data: Record<string, any>
  related_vulnerabilities?: Vulnerability[]
  created_at: string
}

// AI Explanation types
export interface AIExplanation {
  id: string
  vulnerability_id: string
  explanation: string
  suggested_fix: string
  risk_assessment?: string
  mitigation_steps: string[]
  detection_methods?: string
  security_best_practices?: string
  ai_model: string
  confidence_score: number
  tokens_used: number
  processing_time_ms: number
  created_at: string
}

// GHSA Details types
export interface GHSADetails {
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

export interface AffectedPackage {
  name: string
  ecosystem: string
  affected_versions: string
  patched_versions?: string
}

// Scan Session types
export interface ScanSession {
  id: string
  repository_id: string
  user_id: string
  scan_status: 'pending' | 'scanning' | 'completed' | 'failed'
  security_score: number
  total_vulnerabilities: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  scan_started_at: string
  scan_completed_at?: string
  scan_duration_ms?: number
  error_message?: string
  created_at: string
}

// Dependency types
export interface Dependency {
  id: string
  repository_id: string
  scan_session_id: string
  package_name: string
  package_manager?: string
  current_version: string
  latest_version?: string
  is_outdated: boolean
  vulnerability_count: number
  license?: string
  last_updated?: string
  created_at: string
}

// Security Score types
export interface SecurityScore {
  score: number
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE'
  color: string
  description: string
}

// API Request/Response types
export interface ScanRequest {
  repoUrl: string
  branch?: string
  scanType?: 'full' | 'dependencies' | 'quick'
  githubToken?: string
}

export interface ScanResponse {
  success: boolean
  scanId: string
  repositoryId?: string
  securityScore: number
  totalVulnerabilities: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  scanDuration: number
  scanTimestamp: string
  message: string
  warning?: string
}

export interface ExplanationRequest {
  vulnerabilityId?: string
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
}

export interface ExplanationResponse {
  success: boolean
  explanation?: AIExplanation
  error?: string
  statusCode?: number
  message: string
}

export interface GHSARequest {
  ghsaId: string
}

export interface GHSAResponse {
  success: boolean
  details?: GHSADetails
  error?: string
  statusCode?: number
  message?: string
}

// GitHub API types
export interface GitHubUser {
  id: number
  login: string
  email: string
  avatar_url: string
  name?: string
  company?: string
  location?: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  description?: string
  fork: boolean
  language?: string
  default_branch: string
  updated_at: string
  pushed_at: string
  size: number
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  permissions?: {
    admin: boolean
    push: boolean
    pull: boolean
  }
}

// Chart and visualization types
export interface VulnerabilityChartData {
  name: string
  value: number
  color: string
}

export interface SecurityTrendData {
  date: string
  score: number
  vulnerabilities: number
}

// Form and UI types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'url' | 'select' | 'textarea'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: {
    pattern?: RegExp
    minLength?: number
    maxLength?: number
    message?: string
  }
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Filter and search types
export interface VulnerabilityFilter {
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  type?: string
  component?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface SearchParams {
  query: string
  filters: VulnerabilityFilter
  sortBy: 'severity' | 'date' | 'title' | 'component'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

// Error types
export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: Record<string, any>
}

// Loading and state types
export interface LoadingState {
  isLoading: boolean
  error?: string
  progress?: number
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

// Security badge types
export interface SecurityBadge {
  score: number
  level: string
  color: string
  text: string
  svg: string
}

// Export and report types
export interface ScanReport {
  id: string
  repository: Repository
  scanSession: ScanSession
  vulnerabilities: Vulnerability[]
  explanations: AIExplanation[]
  dependencies: Dependency[]
  generatedAt: string
  format: 'pdf' | 'json' | 'csv'
}

// Settings and configuration types
export interface UserSettings {
  notifications: {
    email: boolean
    browser: boolean
    critical: boolean
    high: boolean
    medium: boolean
    low: boolean
  }
  scanPreferences: {
    defaultScanType: 'full' | 'dependencies' | 'quick'
    autoScan: boolean
    scanFrequency: 'daily' | 'weekly' | 'monthly'
  }
  privacy: {
    shareData: boolean
    anonymousUsage: boolean
  }
}