import React, { useState } from 'react'
import { Shield, Github, Zap, CheckCircle, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../utils/cn'

const Login: React.FC = () => {
  const { signInWithGitHub, loading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleGitHubSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signInWithGitHub()
    } catch (error) {
      console.error('Sign in error:', error)
      setIsSigningIn(false)
    }
  }

  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Scanning',
      description: 'Advanced vulnerability detection using machine learning and cloud APIs'
    },
    {
      icon: Zap,
      title: 'Real-time Analysis',
      description: 'Instant security insights with comprehensive dependency and code analysis'
    },
    {
      icon: CheckCircle,
      title: 'Actionable Fixes',
      description: 'Get specific recommendations and code examples to resolve vulnerabilities'
    },
    {
      icon: Lock,
      title: 'Secure by Design',
      description: 'Enterprise-grade security with encrypted token storage and rate limiting'
    }
  ]

  const securityStats = [
    { label: 'Vulnerabilities Detected', value: '10K+', color: 'text-red-600' },
    { label: 'Repositories Scanned', value: '5K+', color: 'text-blue-600' },
    { label: 'Security Score Improved', value: '85%', color: 'text-green-600' },
    { label: 'False Positive Rate', value: '<2%', color: 'text-purple-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left side - Login form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-lg"
                >
                  <Shield className="h-8 w-8 text-white" />
                </motion.div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to LockDown</h1>
              <p className="text-lg text-gray-600">Secure your code with AI-powered vulnerability detection</p>
            </div>

            {/* Login form */}
            <div className="card">
              <div className="card-body">
                <div className="space-y-6">
                  {/* GitHub OAuth button */}
                  <button
                    onClick={handleGitHubSignIn}
                    disabled={isSigningIn || loading}
                    className={cn(
                      "w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
                      isSigningIn && "animate-pulse"
                    )}
                  >
                    {isSigningIn ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        <span>Connecting to GitHub...</span>
                      </div>
                    ) : (
                      <>
                        <Github className="h-5 w-5 mr-3" />
                        <span className="font-medium">Continue with GitHub</span>
                      </>
                    )}
                  </button>

                  {/* Security notice */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <strong>Security First:</strong> We only request read access to your repositories and never store your code. Your GitHub tokens are encrypted and secure.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Features preview */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">What you'll get:</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <feature.icon className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{feature.title}</p>
                            <p className="text-xs text-gray-500">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Features and stats */}
        <div className="hidden lg:block relative flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          </div>
          {/* Animated blobs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative h-full flex flex-col justify-center px-12 py-12 text-white">
            {/* Hero content */}
            <motion.div className="max-w-2xl" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
              <h2 className="text-4xl font-bold mb-6">Secure Your Code with AI-Powered Intelligence</h2>
              <p className="text-xl text-primary-100 mb-12 leading-relaxed">
                LockDown combines cutting-edge AI technology with comprehensive vulnerability databases to provide student developers with enterprise-grade security scanning capabilities.
              </p>

              {/* Security statistics */}
              <div className="grid grid-cols-2 gap-6 mb-12">
                {securityStats.map((stat, index) => (
                  <motion.div key={index} className="text-center" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <div className={cn("text-3xl font-bold mb-2", stat.color)}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-primary-200">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Key benefits */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Zero false positives with AI validation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Real-time vulnerability updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Comprehensive dependency analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Actionable security recommendations</span>
                </div>
              </div>
            </motion.div>

            {/* Bottom decoration */}
            <div className="absolute bottom-8 left-12 right-12">
              <div className="flex items-center justify-between text-primary-200 text-sm">
                <span>Powered by Google Gemini AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
