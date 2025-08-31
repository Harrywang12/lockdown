import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Download,
  Eye,
  Zap
} from 'lucide-react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { 
  getRepositories, 
  getScanSessions, 
  getVulnerabilities,
  downloadSecurityBadge 
} from '../services/api'
import { cn } from '../utils/cn'
import { 
  Repository, 
  ScanSession, 
  Vulnerability, 
  SecurityScore 
} from '../types'
import { useAuth } from '../hooks/useAuth'

const Dashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const { user } = useAuth()

  // Debug user context
  useEffect(() => {
    console.log('=== DASHBOARD USER CONTEXT ===')
    console.log('Current user:', user)
    console.log('User ID:', user?.id)
    console.log('GitHub ID:', user?.github_id)
  }, [user])

  // Fetch data
  const { data: repositories = [], isLoading: reposLoading, error: reposError } = useQuery(
    'repositories',
    getRepositories
  )

  const { data: scanSessions = [], isLoading: scansLoading, error: scansError } = useQuery(
    'scanSessions',
    () => getScanSessions() // Ensure no parameters are passed
  )

  const { data: vulnerabilities = [], isLoading: vulnsLoading, error: vulnsError } = useQuery(
    'vulnerabilities',
    () => getVulnerabilities()
  )

  // Debug logging
  useEffect(() => {
    console.log('=== DASHBOARD DATA DEBUG ===')
    console.log('Repositories:', repositories)
    console.log('Repositories error:', reposError)
    console.log('Scan sessions:', scanSessions)
    console.log('Scan sessions error:', scansError)
    console.log('Vulnerabilities:', vulnerabilities)
    console.log('Vulnerabilities error:', vulnsError)
    console.log('Repositories loading:', reposLoading)
    console.log('Scans loading:', scansLoading)
    console.log('Vulns loading:', vulnsLoading)
  }, [repositories, scanSessions, vulnerabilities, reposError, scansError, vulnsError, reposLoading, scansLoading, vulnsLoading])

  // Calculate security metrics
  const securityMetrics = calculateSecurityMetrics(scanSessions, vulnerabilities)
  const recentScans = scanSessions.slice(0, 5)
  const topVulnerabilities = vulnerabilities.slice(0, 5)

  // Get security score level and color
  const getSecurityScoreInfo = (score: number): SecurityScore => {
    if (score >= 80) return { score, level: 'SAFE', color: 'bg-security-safe', description: 'Excellent security posture' }
    if (score >= 60) return { score, level: 'LOW', color: 'bg-security-low', description: 'Minor security concerns' }
    if (score >= 40) return { score, level: 'MEDIUM', color: 'bg-security-medium', description: 'Moderate security risks' }
    if (score >= 20) return { score, level: 'HIGH', color: 'bg-security-high', description: 'High security risks' }
    return { score, level: 'CRITICAL', color: 'bg-security-critical', description: 'Critical security issues' }
  }

  const currentScore = getSecurityScoreInfo(securityMetrics.averageScore)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Monitor your repositories' security status and recent activity</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/scan"
            className="btn-primary flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Security Score */}
        <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className="text-2xl font-bold text-gray-900">{currentScore.score}</p>
                <p className="text-xs text-gray-500">{currentScore.description}</p>
              </div>
              <div className={cn("security-score", currentScore.color)}>
                {currentScore.score}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Repositories */}
        <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.03 }}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Repositories</p>
                <p className="text-2xl font-bold text-gray-900">{repositories.length}</p>
                <p className="text-xs text-gray-500">Total scanned</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Vulnerabilities */}
        <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.06 }}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vulnerabilities</p>
                <p className="text-2xl font-bold text-gray-900">{securityMetrics.totalVulnerabilities}</p>
                <p className="text-xs text-gray-500">Found in scans</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Scans */}
        <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.09 }}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Scans</p>
                <p className="text-2xl font-bold text-gray-900">{recentScans.length}</p>
                <p className="text-xs text-gray-500">Last 5 scans</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vulnerability Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Chart */}
        <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Vulnerability Severity</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {Object.entries(securityMetrics.severityBreakdown).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      severity === 'CRITICAL' && "bg-security-critical",
                      severity === 'HIGH' && "bg-security-high",
                      severity === 'MEDIUM' && "bg-security-medium",
                      severity === 'LOW' && "bg-security-low"
                    )} />
                    <span className="text-sm font-medium text-gray-700 capitalize">{severity}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500">
                      ({((count / securityMetrics.totalVulnerabilities) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Security Trend */}
        <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Security Trend</h3>
            <div className="flex items-center space-x-2">
              {securityMetrics.trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                securityMetrics.trend > 0 ? "text-green-600" : "text-red-600"
              )}>
                {securityMetrics.trend > 0 ? '+' : ''}{securityMetrics.trend}%
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last scan</span>
                <span className="font-medium text-gray-900">
                  {securityMetrics.lastScanScore || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Previous scan</span>
                <span className="font-medium text-gray-900">
                  {securityMetrics.previousScanScore || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Change</span>
                <span className={cn(
                  "font-medium",
                  securityMetrics.trend > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {securityMetrics.trend > 0 ? 'Improved' : 'Declined'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Scans</h3>
            <Link to="/scan" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-body">
            {recentScans.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No scans yet</p>
                <Link to="/scan" className="text-primary-600 hover:text-primary-500 text-sm">
                  Start your first scan
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        scan.scan_status === 'completed' && "bg-green-400",
                        scan.scan_status === 'scanning' && "bg-yellow-400",
                        scan.scan_status === 'failed' && "bg-red-400"
                      )} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {scan.scan_status === 'completed' ? 'Scan completed' : 'Scan in progress'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{scan.security_score}</p>
                      <p className="text-xs text-gray-500">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Vulnerabilities */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Vulnerabilities</h3>
            <Link to="/vulnerabilities" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-body">
            {topVulnerabilities.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No vulnerabilities found</p>
                <p className="text-sm text-gray-400">Great job keeping your code secure!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topVulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "badge",
                        vuln.severity === 'CRITICAL' && "badge-critical",
                        vuln.severity === 'HIGH' && "badge-high",
                        vuln.severity === 'MEDIUM' && "badge-medium",
                        vuln.severity === 'LOW' && "badge-low"
                      )}>
                        {vuln.severity}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {vuln.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {vuln.affected_component || 'Unknown component'}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/vulnerability/${vuln.id}`}
                      className="text-primary-600 hover:text-primary-500"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/scan"
              className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Search className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Scan Repository</p>
                <p className="text-sm text-gray-500">Check for new vulnerabilities</p>
              </div>
            </Link>

            <button
              onClick={() => downloadSecurityBadge(currentScore.score, 'overall')}
              className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
            >
              <Download className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Download Badge</p>
                <p className="text-sm text-gray-500">Get your security score badge</p>
              </div>
            </button>

            <Link
              to="/vulnerabilities"
              className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">View Reports</p>
                <p className="text-sm text-gray-500">Detailed security analysis</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate security metrics
function calculateSecurityMetrics(scanSessions: ScanSession[], vulnerabilities: Vulnerability[]) {
  const totalVulnerabilities = vulnerabilities.length
  
  const severityBreakdown = {
    CRITICAL: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    HIGH: vulnerabilities.filter(v => v.severity === 'HIGH').length,
    MEDIUM: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
    LOW: vulnerabilities.filter(v => v.severity === 'LOW').length
  }

  const completedScans = scanSessions.filter(s => s.scan_status === 'completed')
  const averageScore = completedScans.length > 0 
    ? Math.round(completedScans.reduce((sum, s) => sum + s.security_score, 0) / completedScans.length)
    : 100

  // Calculate trend (simplified for MVP)
  const recentScans = completedScans.slice(0, 2)
  const lastScanScore = recentScans[0]?.security_score
  const previousScanScore = recentScans[1]?.security_score
  
  let trend = 0
  if (lastScanScore && previousScanScore) {
    trend = Math.round(((lastScanScore - previousScanScore) / previousScanScore) * 100)
  }

  return {
    totalVulnerabilities,
    severityBreakdown,
    averageScore,
    trend,
    lastScanScore,
    previousScanScore
  }
}

export default Dashboard
