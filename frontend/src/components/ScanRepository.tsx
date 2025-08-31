import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Github, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Shield,
  Download,
  Eye
} from 'lucide-react'
import { useQuery, useMutation } from 'react-query'
import { motion } from 'framer-motion'
import { scanRepository, getGitHubRepositories } from '../services/api'
import { toast } from 'react-hot-toast'
import { cn } from '../utils/cn'
import { Repository, ScanRequest } from '../types'
import { supabase } from '../hooks/useSupabase'

const ScanRepository: React.FC = () => {
  const navigate = useNavigate()
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  // Simplified: remove scan type selection
  const [customRepoUrl, setCustomRepoUrl] = useState('')
  const [isCustomRepo, setIsCustomRepo] = useState(false)

  // Fetch GitHub repositories
  const { data: githubRepos = [], isLoading: reposLoading } = useQuery(
    'githubRepositories',
    getGitHubRepositories,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  )

  // Scan mutation
  const scanMutation = useMutation(scanRepository, {
    onSuccess: (data) => {
      toast.success('Repository scan initiated successfully!')
      navigate('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to initiate scan')
    }
  })

  // Handle scan submission
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRepo && !customRepoUrl) {
      toast.error('Please select a repository or enter a custom URL')
      return
    }

    const repoUrl = isCustomRepo ? customRepoUrl : selectedRepo
    
    try {
      // Try to include GitHub provider token so backend can access private repos
      const { data: { session } } = await supabase.auth.getSession()
      const githubToken = session?.provider_token

      const scanRequest: ScanRequest = {
        repoUrl,
        branch: 'main',
        scanType: 'full',
        githubToken
      }
      
      await scanMutation.mutateAsync(scanRequest)
    } catch (error) {
      console.error('Scan submission error:', error)
    }
  }

  // Get scan type description
  const getScanTypeDescription = (type: string) => {
    switch (type) {
      case 'full':
        return 'Comprehensive scan including dependencies, code patterns, and configuration files'
      case 'dependencies':
        return 'Focus on package dependencies and known vulnerabilities'
      case 'quick':
        return 'Fast scan for critical security issues only'
      default:
        return ''
    }
  }

  // Get scan type icon
  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Shield className="h-5 w-5" />
      case 'dependencies':
        return <Download className="h-5 w-5" />
      case 'quick':
        return <Zap className="h-5 w-5" />
      default:
        return <Search className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Repository</h1>
        <p className="text-lg text-gray-600">
          Analyze your GitHub repository for security vulnerabilities using AI-powered scanning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scan Configuration */}
        <div className="lg:col-span-2">
          <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Scan Configuration</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleScanSubmit} className="space-y-6">
                {/* Repository Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsCustomRepo(false)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                        !isCustomRepo
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      )}
                    >
                      <Github className="h-4 w-4 inline mr-2" />
                      My Repositories
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomRepo(true)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                        isCustomRepo
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      )}
                    >
                      Custom URL
                    </button>
                  </div>

                  {!isCustomRepo ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Repository
                      </label>
                      {reposLoading ? (
                        <div className="animate-pulse">
                          <div className="h-10 bg-gray-200 rounded-lg"></div>
                        </div>
                      ) : (
                        <select
                          value={selectedRepo}
                          onChange={(e) => setSelectedRepo(e.target.value)}
                          className="input"
                          required
                        >
                          <option value="">Choose a repository...</option>
                          {githubRepos.map((repo) => (
                            <option key={repo.id} value={repo.repo_url}>
                              {repo.repo_full_name}
                              {repo.is_private && ' (Private)'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repository URL
                      </label>
                      <input
                        type="url"
                        value={customRepoUrl}
                        onChange={(e) => setCustomRepoUrl(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="input"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a valid GitHub repository URL
                      </p>
                    </div>
                  )}
                </div>

                {/* Removed scan type selection for simplified UX */}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={scanMutation.isLoading || (!selectedRepo && !customRepoUrl)}
                    className={cn(
                      "w-full btn-primary py-3 text-base font-medium",
                      scanMutation.isLoading && "animate-pulse"
                    )}
                  >
                    {scanMutation.isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Initiating Scan...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Search className="h-5 w-5" />
                        <span>Start Security Scan</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Scan Information */}
        <div className="space-y-6">
          {/* Removed detailed scan types info */}

          {/* What Gets Scanned */}
          <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.03 }}>
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">What Gets Scanned</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Dependency vulnerabilities</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Code security patterns</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Configuration files</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Known CVEs</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">AI-powered analysis</span>
              </div>
            </div>
          </motion.div>

          {/* Security Notice */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Privacy First:</strong> We only analyze your code for security issues. Your source code is never stored or shared.
                </p>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.06 }}>
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Estimated Time</p>
                  <p className="text-xs text-gray-500">
                    Typical scan completes within 5-15 minutes depending on repository size
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Scans Preview */}
      {githubRepos.length > 0 && (
        <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Your Repositories</h3>
            <p className="text-sm text-gray-500">Click on a repository to start scanning</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {githubRepos.slice(0, 6).map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => {
                    setSelectedRepo(repo.repo_url)
                    setIsCustomRepo(false)
                  }}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all duration-200 hover:border-primary-300 hover:bg-primary-50",
                    selectedRepo === repo.repo_url && "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {repo.repo_name}
                    </h4>
                    {repo.is_private && (
                      <span className="text-xs text-gray-500">Private</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {(repo as any).description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{repo.language || 'Unknown'}</span>
                    <span>{repo.default_branch}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ScanRepository
