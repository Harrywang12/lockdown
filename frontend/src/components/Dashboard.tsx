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
  Zap,
  ArrowRight,
  ChevronRight
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
import { Skeleton, SkeletonCard, SkeletonText } from './ui/Skeleton'
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

  // Create a dashboard loading skeleton
  const DashboardSkeleton = () => (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="space-y-5 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
          <div className="flex justify-center py-6">
            <Skeleton variant="circular" className="h-32 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>
      </div>
      
      {/* Activity lists skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Show loading skeleton when data is loading
  if (reposLoading || scansLoading || vulnsLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Security Dashboard</h1>
          <p className="text-slate-600 max-w-2xl">
            Monitor your repositories' security status and real-time activity with our AI-powered security analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/scan"
              className="btn-primary flex items-center space-x-2 shadow-lg shadow-primary-500/20"
            >
              <Search className="h-4 w-4" />
              <span>New Scan</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Overall Security Score */}
        <motion.div 
          className="card card-hover bg-gradient-to-br from-white to-slate-50 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-body">
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary-50">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                </div>
                <div className={cn("security-score", currentScore.color)}>
                  {currentScore.score}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Security Score</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{currentScore.score}</p>
                <div className="flex items-center mt-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full mr-2",
                    currentScore.score >= 80 ? "bg-security-safe" : 
                    currentScore.score >= 60 ? "bg-security-low" : 
                    currentScore.score >= 40 ? "bg-security-medium" : 
                    currentScore.score >= 20 ? "bg-security-high" : "bg-security-critical"
                  )} />
                  <p className="text-xs text-slate-500">{currentScore.description}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Repositories */}
        <motion.div 
          className="card card-hover bg-gradient-to-br from-white to-slate-50 shadow-md" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-body">
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Shield className="h-5 w-5 text-primary-600" />
                </div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm"
                >
                  {repositories.length}
                </motion.div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Repositories</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <p className="text-2xl font-bold text-slate-900">{repositories.length}</p>
                  <p className="text-xs text-slate-500">/ total</p>
                </div>
                <div className="flex items-center mt-2">
                  <p className="text-xs text-slate-500">
                    {repositories.length > 0 
                      ? `Last scan: ${new Date().toLocaleDateString()}`
                      : 'No repositories scanned yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Vulnerabilities */}
        <motion.div 
          className="card card-hover bg-gradient-to-br from-white to-slate-50 shadow-md" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-body">
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-security-critical/10">
                  <AlertTriangle className="h-5 w-5 text-security-critical" />
                </div>
                <motion.div 
                  className="flex items-center justify-center rounded-full h-9 w-9 bg-security-critical/10 text-security-critical font-semibold text-sm"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {securityMetrics.totalVulnerabilities}
                </motion.div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Vulnerabilities</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <p className="text-2xl font-bold text-slate-900">{securityMetrics.totalVulnerabilities}</p>
                  <p className="text-xs text-slate-500">/ detected</p>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-security-critical" />
                  <p className="text-xs text-slate-500">
                    {securityMetrics.severityBreakdown.CRITICAL} critical
                  </p>
                  <div className="h-1.5 w-1.5 rounded-full bg-security-high" />
                  <p className="text-xs text-slate-500">
                    {securityMetrics.severityBreakdown.HIGH} high
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Scans */}
        <motion.div 
          className="card card-hover bg-gradient-to-br from-white to-slate-50 shadow-md" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-body">
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-security-safe/10">
                  <CheckCircle className="h-5 w-5 text-security-safe" />
                </div>
                <motion.div 
                  className="flex items-center justify-center rounded-full h-9 w-9 bg-security-safe/10 text-security-safe font-semibold text-sm"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {recentScans.length}
                </motion.div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Recent Scans</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <p className="text-2xl font-bold text-slate-900">{recentScans.length}</p>
                  <p className="text-xs text-slate-500">/ recent</p>
                </div>
                <div className="flex items-center mt-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                  <p className="text-xs text-slate-500">
                    {recentScans.length > 0 
                      ? `Last scan: ${new Date(recentScans[0]?.created_at || Date.now()).toLocaleTimeString()}`
                      : 'No recent scans'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vulnerability Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Severity Chart */}
        <motion.div 
          className="card shadow-md bg-white/90 backdrop-blur-sm overflow-hidden" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-header border-b border-slate-200/70 pb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-security-high mr-2" /> 
              Vulnerability Severity
            </h3>
            <Link to="/vulnerabilities" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              <span>Details</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-5 pt-2">
              {Object.entries(securityMetrics.severityBreakdown).map(([severity, count], index) => {
                const percentage = securityMetrics.totalVulnerabilities > 0 
                  ? (count / securityMetrics.totalVulnerabilities) * 100 
                  : 0;
                
                return (
                  <motion.div 
                    key={severity} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "h-3 w-3 rounded-full",
                          severity === 'CRITICAL' && "bg-security-critical",
                          severity === 'HIGH' && "bg-security-high",
                          severity === 'MEDIUM' && "bg-security-medium",
                          severity === 'LOW' && "bg-security-low"
                        )} />
                        <span className="text-sm font-medium text-slate-700 capitalize">{severity.toLowerCase()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{count}</span>
                        <span className="text-xs text-slate-500">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn(
                          "h-full rounded-full",
                          severity === 'CRITICAL' && "bg-security-critical",
                          severity === 'HIGH' && "bg-security-high",
                          severity === 'MEDIUM' && "bg-security-medium",
                          severity === 'LOW' && "bg-security-low"
                        )}
                        initial={{ width: "0%" }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Total Vulnerabilities</span>
                <motion.div
                  className="text-lg font-bold text-slate-900"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  {securityMetrics.totalVulnerabilities}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Trend */}
        <motion.div 
          className="card shadow-md bg-white/90 backdrop-blur-sm overflow-hidden" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-header border-b border-slate-200/70 pb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              {securityMetrics.trend > 0 ? (
                <TrendingUp className="h-5 w-5 text-security-safe mr-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-security-critical mr-2" />
              )}
              Security Trend
            </h3>
            <div className="flex items-center space-x-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.8,
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-white text-sm font-medium",
                  securityMetrics.trend > 0 ? "bg-security-safe" : "bg-security-critical"
                )}
              >
                {securityMetrics.trend > 0 ? '+' : ''}{securityMetrics.trend}%
              </motion.div>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4 mb-6">
              <div className="flex justify-center pt-4 pb-6">
                <motion.div 
                  className="relative h-32 w-32"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={cn(
                      "text-4xl font-bold",
                      securityMetrics.trend > 0 ? "text-security-safe" : "text-security-critical"
                    )}>
                      {securityMetrics.trend > 0 ? '+' : ''}{securityMetrics.trend}%
                    </div>
                  </div>
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <circle 
                      cx="18" cy="18" r="16" 
                      fill="none" 
                      stroke="#e2e8f0" 
                      strokeWidth="2"
                    />
                    <motion.circle
                      cx="18" cy="18" r="16"
                      fill="none"
                      stroke={securityMetrics.trend > 0 ? "#09b876" : "#ee2d4e"}
                      strokeWidth="2"
                      strokeDasharray="100"
                      strokeDashoffset="75"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: "100" }}
                      animate={{ strokeDashoffset: securityMetrics.trend > 0 ? "25" : "75" }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                </motion.div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500 mb-1">Last scan</div>
                  <div className="font-medium text-lg text-slate-900">
                    {securityMetrics.lastScanScore || 'N/A'}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500 mb-1">Previous scan</div>
                  <div className="font-medium text-lg text-slate-900">
                    {securityMetrics.previousScanScore || 'N/A'}
                  </div>
                </div>
              </div>

              <motion.div 
                className={cn(
                  "rounded-lg p-3",
                  securityMetrics.trend > 0 ? "bg-security-safe/10" : "bg-security-critical/10"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-700">Security Status</div>
                  <div className={cn(
                    "font-medium",
                    securityMetrics.trend > 0 ? "text-security-safe" : "text-security-critical"
                  )}>
                    {securityMetrics.trend > 0 ? 'Improving' : 'Needs Attention'}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Scans */}
        <motion.div 
          className="card shadow-md bg-white/90 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-header border-b border-slate-200/70 pb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Clock className="h-5 w-5 text-primary-600 mr-2" />
              Recent Scans
            </h3>
            <Link 
              to="/scan" 
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              <span>View all</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="card-body">
            {recentScans.length === 0 ? (
              <motion.div 
                className="text-center py-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <Clock className="h-14 w-14 text-slate-300 mx-auto mb-4" />
                </motion.div>
                <p className="text-slate-500 mb-2">No scans yet</p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/scan" className="btn-primary inline-flex items-center text-sm py-2">
                    <Search className="h-4 w-4 mr-2" />
                    Start your first scan
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <div className="space-y-4 pt-2">
                {recentScans.map((scan, index) => (
                  <motion.div 
                    key={scan.id} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                      scan.scan_status === 'completed' ? "border-security-safe/20 hover:border-security-safe/40 bg-security-safe/5" : 
                      scan.scan_status === 'scanning' ? "border-primary-200/30 hover:border-primary-300/50 bg-primary-50/30" : 
                      "border-security-critical/20 hover:border-security-critical/40 bg-security-critical/5"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                    whileHover={{ x: 5, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        scan.scan_status === 'completed' ? "bg-security-safe/10" : 
                        scan.scan_status === 'scanning' ? "bg-primary-100/50" : 
                        "bg-security-critical/10"
                      )}>
                        {scan.scan_status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-security-safe" />
                        ) : scan.scan_status === 'scanning' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Search className="h-5 w-5 text-primary-600" />
                          </motion.div>
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-security-critical" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {scan.scan_status === 'completed' ? 'Scan completed' : 
                           scan.scan_status === 'scanning' ? 'Scan in progress' : 'Scan failed'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-slate-500">
                            {new Date(scan.created_at).toLocaleDateString()}
                          </p>
                          <span className="text-slate-300">•</span>
                          <p className="text-xs text-slate-500">
                            {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={cn(
                        "text-sm font-bold px-3 py-1 rounded-full",
                        scan.security_score >= 80 ? "bg-security-safe/10 text-security-safe" :
                        scan.security_score >= 60 ? "bg-security-low/10 text-security-low" :
                        scan.security_score >= 40 ? "bg-security-medium/10 text-security-medium" :
                        scan.security_score >= 20 ? "bg-security-high/10 text-security-high" :
                        "bg-security-critical/10 text-security-critical"
                      )}>
                        {scan.security_score}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Security Score</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Vulnerabilities */}
        <motion.div 
          className="card shadow-md bg-white/90 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          whileHover={{ boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        >
          <div className="card-header border-b border-slate-200/70 pb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-security-high mr-2" />
              Top Vulnerabilities
            </h3>
            <Link 
              to="/vulnerabilities" 
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              <span>View all</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="card-body">
            {topVulnerabilities.length === 0 ? (
              <motion.div 
                className="text-center py-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 10, 0] }}
                  transition={{ delay: 0.6, duration: 1, type: "spring" }}
                >
                  <CheckCircle className="h-14 w-14 text-security-safe mx-auto mb-4" />
                </motion.div>
                <p className="text-slate-700 font-medium mb-1">No vulnerabilities found</p>
                <p className="text-slate-500 max-w-xs mx-auto">Great job keeping your code secure!</p>
              </motion.div>
            ) : (
              <div className="space-y-4 pt-2">
                {topVulnerabilities.map((vuln, index) => (
                  <motion.div 
                    key={vuln.id} 
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-slate-50 transition-all duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                    whileHover={{ x: 5, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "badge",
                        vuln.severity === 'CRITICAL' && "badge-critical",
                        vuln.severity === 'HIGH' && "badge-high",
                        vuln.severity === 'MEDIUM' && "badge-medium",
                        vuln.severity === 'LOW' && "badge-low"
                      )}>
                        {vuln.severity}
                      </div>
                      <div className="max-w-[220px]">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {vuln.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {vuln.affected_component || 'Unknown component'}
                          </p>
                          {vuln.cve_id && (
                            <>
                              <span className="text-slate-300">•</span>
                              <p className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                                {vuln.cve_id}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Link
                        to={`/vulnerability/${vuln.id}`}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-primary-50 text-slate-600 hover:text-primary-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="card shadow-md bg-white/90 backdrop-blur-sm overflow-hidden mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        whileHover={{ boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      >
        <div className="card-header border-b border-slate-200/70 pb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Zap className="h-5 w-5 text-primary-600 mr-2" />
            Quick Actions
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/scan"
                className="flex h-full flex-col justify-between p-5 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group hover:shadow-md"
              >
                <div className="mb-6">
                  <div className="bg-primary-100/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                    <Search className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="font-medium text-slate-900 mb-1 text-lg">Scan Repository</p>
                  <p className="text-sm text-slate-600">Check for new vulnerabilities in your code repositories</p>
                </div>
                <div className="flex items-center text-primary-600 text-sm font-medium">
                  <span>Start scan</span>
                  <motion.div 
                    initial={{ x: 0 }} 
                    whileHover={{ x: 3 }}
                    className="ml-1.5"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
              <button
                onClick={() => downloadSecurityBadge(currentScore.score, 'overall')}
                className="flex h-full w-full flex-col justify-between p-5 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group hover:shadow-md text-left"
              >
                <div className="mb-6">
                  <div className="bg-primary-100/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                    <Download className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="font-medium text-slate-900 mb-1 text-lg">Download Badge</p>
                  <p className="text-sm text-slate-600">Get your security score badge for your repository README</p>
                </div>
                <div className="flex items-center text-primary-600 text-sm font-medium">
                  <span>Get badge</span>
                  <motion.div 
                    initial={{ y: 0 }} 
                    whileHover={{ y: -3 }}
                    className="ml-1.5"
                  >
                    <Download className="h-4 w-4" />
                  </motion.div>
                </div>
              </button>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/profile"
                className="flex h-full flex-col justify-between p-5 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group hover:shadow-md"
              >
                <div className="mb-6">
                  <div className="bg-primary-100/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                    <BarChart3 className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="font-medium text-slate-900 mb-1 text-lg">View Reports</p>
                  <p className="text-sm text-slate-600">Access detailed security analysis and vulnerability reports</p>
                </div>
                <div className="flex items-center text-primary-600 text-sm font-medium">
                  <span>View reports</span>
                  <motion.div 
                    initial={{ x: 0 }} 
                    whileHover={{ x: 3 }}
                    className="ml-1.5"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
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
