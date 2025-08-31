import React, { useState, useEffect } from 'react'
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
  Lock,
  FileWarning,
  Layers,
  ArrowRight
} from 'lucide-react'
import { useQuery } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

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

// Import new UI components
import AnimatedCard from './ui/AnimatedCard'
import AnimatedContainer from './ui/AnimatedContainer'
import AnimatedIcon from './ui/AnimatedIcon'
import GlowingBadge from './ui/GlowingBadge'

const Dashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const { user } = useAuth()
  
  // Fetch data
  const { data: repositories = [], isLoading: reposLoading } = useQuery(
    'repositories',
    getRepositories
  )

  const { data: scanSessions = [], isLoading: scansLoading } = useQuery(
    'scanSessions',
    () => getScanSessions()
  )

  const { data: vulnerabilities = [], isLoading: vulnsLoading } = useQuery(
    'vulnerabilities',
    () => getVulnerabilities()
  )

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
  
  // Use intersection observer for scroll animations
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const scoreBadgeVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        duration: 0.8
      }
    },
    hover: {
      scale: 1.1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    }
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 }
    }
  }

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Header Section */}
      <AnimatedContainer className="flex items-center justify-between">
        <div>
          <motion.h1 
            className="text-3xl font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Security Dashboard
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Monitor your repositories' security status and recent activity
          </motion.p>
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/scan"
            className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Search className="h-4 w-4" />
            <span>New Scan</span>
            <motion.div
              animate={{
                x: [0, 5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </Link>
        </motion.div>
      </AnimatedContainer>

      {/* Security Overview Cards */}
      <AnimatedContainer 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        staggerChildren={true}
        staggerDelay={0.1}
      >
        {/* Overall Security Score */}
        <AnimatedCard index={0}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Security Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentScore.score}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentScore.description}</p>
              </div>
              <motion.div 
                className={cn("security-score", currentScore.color, "flex items-center justify-center h-16 w-16 rounded-full text-2xl font-bold text-white")}
                variants={scoreBadgeVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                {currentScore.score}
              </motion.div>
            </div>
          </div>
        </AnimatedCard>

        {/* Total Repositories */}
        <AnimatedCard index={1}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Repositories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{repositories.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total scanned</p>
              </div>
              <AnimatedIcon color="info" size="lg">
                <Shield className="h-6 w-6" />
              </AnimatedIcon>
            </div>
          </div>
        </AnimatedCard>

        {/* Total Vulnerabilities */}
        <AnimatedCard index={2}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Vulnerabilities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{securityMetrics.totalVulnerabilities}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Found in scans</p>
              </div>
              <AnimatedIcon color="danger" size="lg">
                <AlertTriangle className="h-6 w-6" />
              </AnimatedIcon>
            </div>
          </div>
        </AnimatedCard>

        {/* Recent Scans */}
        <AnimatedCard index={3}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Recent Scans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentScans.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last 5 scans</p>
              </div>
              <AnimatedIcon color="success" size="lg">
                <CheckCircle className="h-6 w-6" />
              </AnimatedIcon>
            </div>
          </div>
        </AnimatedCard>
      </AnimatedContainer>

      {/* Vulnerability Severity Breakdown */}
      <div ref={ref}>
        <AnimatedContainer 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          staggerChildren={true}
          staggerDelay={0.1}
        >
        {/* Severity Chart */}
        <AnimatedCard index={0}>
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vulnerability Severity</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {Object.entries(securityMetrics.severityBreakdown).map(([severity, count], index) => (
                <motion.div 
                  key={severity} 
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <div className="flex items-center space-x-3">
                    <GlowingBadge severity={severity as any} size="sm" glow={true}>
                      {severity.toLowerCase()}
                    </GlowingBadge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({((count / securityMetrics.totalVulnerabilities || 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedCard>

        {/* Security Trend */}
        <AnimatedCard index={1}>
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Trend</h3>
            <div className="flex items-center space-x-2">
              {securityMetrics.trend > 0 ? (
                <motion.div
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{
                    y: [0, 4, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </motion.div>
              )}
              <span className={cn(
                "text-sm font-medium",
                securityMetrics.trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {securityMetrics.trend > 0 ? '+' : ''}{securityMetrics.trend}%
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Last scan</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {securityMetrics.lastScanScore || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Previous scan</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {securityMetrics.previousScanScore || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Change</span>
                <span className={cn(
                  "font-medium",
                  securityMetrics.trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {securityMetrics.trend > 0 ? 'Improved' : 'Declined'}
                </span>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </AnimatedContainer>

      {/* Recent Activity */}
      <AnimatedContainer 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        staggerChildren={true}
        staggerDelay={0.1}
      >
        {/* Recent Scans */}
        <AnimatedCard index={0}>
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Scans</h3>
            <Link to="/scan" className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              View all
            </Link>
          </div>
          <div className="card-body">
            {recentScans.length === 0 ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                >
                  <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                </motion.div>
                <p className="text-gray-500 dark:text-gray-400">No scans yet</p>
                <Link to="/scan" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm">
                  Start your first scan
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {recentScans.map((scan, index) => (
                    <motion.div
                      key={scan.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className={cn(
                            "h-2 w-2 rounded-full",
                            scan.scan_status === 'completed' && "bg-green-400",
                            scan.scan_status === 'scanning' && "bg-yellow-400",
                            scan.scan_status === 'failed' && "bg-red-400"
                          )}
                          animate={scan.scan_status === 'scanning' ? {
                            scale: [1, 1.5, 1],
                            opacity: [1, 0.7, 1]
                          } : {}}
                          transition={{
                            duration: 2,
                            repeat: scan.scan_status === 'scanning' ? Infinity : 0
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {scan.scan_status === 'completed' ? 'Scan completed' : 'Scan in progress'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(scan.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{scan.security_score}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Top Vulnerabilities */}
        <AnimatedCard index={1}>
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Vulnerabilities</h3>
            <Link to="/vulnerabilities" className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              View all
            </Link>
          </div>
          <div className="card-body">
            {topVulnerabilities.length === 0 ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
                >
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-gray-500 dark:text-gray-400">No vulnerabilities found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Great job keeping your code secure!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {topVulnerabilities.map((vuln, index) => (
                    <motion.div
                      key={vuln.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <GlowingBadge severity={vuln.severity} size="sm" glow={true}>
                          {vuln.severity}
                        </GlowingBadge>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {vuln.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vuln.affected_component || 'Unknown component'}
                          </p>
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}>
                        <Link
                          to={`/vulnerability/${vuln.id}`}
                          className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </AnimatedCard>
      </AnimatedContainer>
      </div>

      {/* Quick Actions */}
      <AnimatedCard 
        className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-none shadow-xl"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={fadeInUp}
      >
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/scan"
                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <AnimatedIcon color="primary" size="md" className="mr-3 group-hover:rotate-12 transition-all duration-300">
                  <Search className="h-5 w-5" />
                </AnimatedIcon>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Scan Repository</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check for new vulnerabilities</p>
                </div>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}>
              <button
                onClick={() => downloadSecurityBadge(currentScore.score, 'overall')}
                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 shadow-sm hover:shadow-md w-full text-left group"
              >
                <AnimatedIcon color="info" size="md" className="mr-3 group-hover:rotate-12 transition-all duration-300">
                  <Download className="h-5 w-5" />
                </AnimatedIcon>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Download Badge</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get your security score badge</p>
                </div>
              </button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/vulnerabilities"
                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <AnimatedIcon color="warning" size="md" className="mr-3 group-hover:rotate-12 transition-all duration-300">
                  <BarChart3 className="h-5 w-5" />
                </AnimatedIcon>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">View Reports</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detailed security analysis</p>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </AnimatedCard>
    </motion.div>
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