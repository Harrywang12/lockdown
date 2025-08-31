import React, { useState } from 'react'
import { Shield, Github, Zap, CheckCircle, Lock, AlertTriangle, ExternalLink, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../utils/cn'

const Login: React.FC = () => {
  const { signInWithGitHub, loading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [hoverFeature, setHoverFeature] = useState<number | null>(null)

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
      description: 'Advanced vulnerability detection using machine learning and cloud APIs',
      color: 'bg-primary-100 text-primary-700'
    },
    {
      icon: Zap,
      title: 'Real-time Analysis',
      description: 'Instant security insights with comprehensive dependency and code analysis',
      color: 'bg-accent-amber/10 text-accent-amber'
    },
    {
      icon: CheckCircle,
      title: 'Actionable Fixes',
      description: 'Get specific recommendations and code examples to resolve vulnerabilities',
      color: 'bg-security-safe/10 text-security-safe'
    },
    {
      icon: AlertTriangle,
      title: 'Vulnerability Prevention',
      description: 'Proactive security scanning with detailed risk assessment before deployment',
      color: 'bg-security-high/10 text-security-high'
    },
    {
      icon: Lock,
      title: 'Secure by Design',
      description: 'Enterprise-grade security with encrypted token storage and rate limiting',
      color: 'bg-accent-purple/10 text-accent-purple'
    }
  ]

  const securityStats = [
    { label: 'Vulnerabilities Detected', value: '10K+', color: 'text-security-critical', animDelay: 0 },
    { label: 'Repositories Scanned', value: '5K+', color: 'text-primary-500', animDelay: 0.1 },
    { label: 'Security Score Improved', value: '85%', color: 'text-security-safe', animDelay: 0.2 },
    { label: 'False Positive Rate', value: '<2%', color: 'text-accent-purple', animDelay: 0.3 }
  ]

  const benefits = [
    { text: 'Zero false positives with AI validation', animDelay: 0 },
    { text: 'Real-time vulnerability updates', animDelay: 0.1 },
    { text: 'Comprehensive dependency analysis', animDelay: 0.2 },
    { text: 'Actionable security recommendations', animDelay: 0.3 },
    { text: 'Integration with CI/CD pipelines', animDelay: 0.4 }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-primary-200/20 to-transparent rounded-full opacity-70 transform translate-x-1/3 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-primary-300/10 to-transparent rounded-full opacity-70 transform -translate-x-1/3 translate-y-1/3" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-300 rounded-full"
          style={{ boxShadow: '0 0 20px 2px rgba(16, 133, 243, 0.3)' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute top-3/4 right-1/3 w-3 h-3 bg-security-safe rounded-full"
          style={{ boxShadow: '0 0 20px 2px rgba(42, 176, 93, 0.3)' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1.5, delay: 0.8 }}
          className="absolute bottom-1/4 left-2/3 w-1.5 h-1.5 bg-security-high rounded-full"
          style={{ boxShadow: '0 0 20px 2px rgba(244, 110, 55, 0.3)' }}
        />
      </div>
      
      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Login form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-28">
          <div className="mx-auto w-full max-w-md lg:w-96">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    duration: 0.6
                  }}
                  className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg shadow-primary-500/20"
                  whileHover={{ 
                    scale: 1.05,
                    rotate: [0, -3, 3, -2, 2, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ 
                      duration: 3, 
                      ease: "easeInOut", 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <Shield className="h-10 w-10 text-white" />
                  </motion.div>
                </motion.div>
              </div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h1 className="text-4xl font-bold text-slate-900 mb-3">Welcome to LockDown</h1>
                <p className="text-lg text-slate-600 max-w-md mx-auto">
                  Secure your code with AI-powered vulnerability detection
                </p>
              </motion.div>
            </div>

            {/* Login form */}
            <motion.div 
              className="card glass shadow-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ boxShadow: "0 12px 32px rgba(16, 133, 243, 0.15)" }}
            >
              <div className="card-body">
                <div className="space-y-6">
                  {/* GitHub OAuth button */}
                  <motion.button
                    onClick={handleGitHubSignIn}
                    disabled={isSigningIn || loading}
                    className={cn(
                      "w-full flex items-center justify-center px-5 py-3.5 rounded-lg shadow-sm bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden relative",
                      isSigningIn && "animate-pulse"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSigningIn ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Connecting to GitHub...</span>
                      </div>
                    ) : (
                      <>
                        <Github className="h-5 w-5 mr-3" />
                        <span className="font-medium">Continue with GitHub</span>
                        <motion.div 
                          className="absolute inset-0 bg-white/10"
                          initial={{ x: "-100%", opacity: 0 }}
                          whileHover={{ x: "100%", opacity: 0.4 }}
                          transition={{ duration: 0.8 }}
                        />
                      </>
                    )}
                  </motion.button>

                  {/* Security notice */}
                  <motion.div 
                    className="rounded-lg glass p-4 border-l-4 border-primary-500"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0 pt-0.5">
                        <Shield className="h-5 w-5 text-primary-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-slate-700">
                          <strong>Security First:</strong> We only request read access to your repositories and never store your code. Your GitHub tokens are encrypted and secure.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Features preview */}
                  <div className="space-y-4">
                    <motion.h3 
                      className="text-sm font-medium text-slate-900"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      What you'll get:
                    </motion.h3>
                    <motion.div 
                      className="space-y-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {features.map((feature, index) => (
                        <motion.div 
                          key={index} 
                          className={cn(
                            "flex items-start p-3 rounded-lg transition-all duration-300",
                            hoverFeature === index ? `${feature.color} shadow-sm` : "hover:bg-slate-50"
                          )}
                          variants={itemVariants}
                          onMouseEnter={() => setHoverFeature(index)}
                          onMouseLeave={() => setHoverFeature(null)}
                        >
                          <div className={cn(
                            "flex-shrink-0 p-1.5 rounded-md transition-colors duration-300",
                            hoverFeature === index ? "bg-white/80" : feature.color
                          )}>
                            <feature.icon className={cn(
                              "h-5 w-5 transition-colors duration-300",
                              hoverFeature === index ? feature.color.split(' ')[1] : "text-white"
                            )} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900">{feature.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <p className="text-xs text-slate-500">
                By continuing, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 hover:underline transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 hover:underline transition-colors">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right side - Features and stats */}
        <div className="hidden lg:block relative flex-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
            <div className="absolute inset-0 bg-slate-900 bg-opacity-20 backdrop-blur-sm"></div>
            {/* Mesh gradient effect */}
            <div className="absolute inset-0 opacity-30">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridGradient)" />
              </svg>
            </div>
          </div>
          
          {/* Animated blobs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute -top-40 -left-24 h-96 w-96 rounded-full bg-accent-indigo/30 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1.1 }}
            transition={{ duration: 3, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-accent-teal/30 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1.2 }}
            transition={{ duration: 4, delay: 1, repeat: Infinity, repeatType: "reverse" }}
            className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-security-high/20 blur-3xl"
          />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-white/[0.03]"></div>

          <div className="relative h-full flex flex-col justify-center px-12 py-12 text-white">
            {/* Hero content */}
            <motion.div 
              className="max-w-2xl space-y-8" 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight text-white">
                  <span className="text-gradient">Secure Your Code</span> with AI-Powered Intelligence
                </h2>
                <p className="text-xl text-primary-100 mb-12 leading-relaxed max-w-xl">
                  LockDown combines cutting-edge AI technology with comprehensive vulnerability databases to provide 
                  <motion.span 
                    className="font-semibold text-white ml-1"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >enterprise-grade security</motion.span> scanning capabilities.
                </p>
              </motion.div>

              {/* Security statistics */}
              <div className="grid grid-cols-2 gap-6 mb-14">
                {securityStats.map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: stat.animDelay + 0.5, duration: 0.6 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)" }}
                  >
                    <div className={cn("text-3xl font-bold mb-2", stat.color)}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-primary-100">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Key benefits */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-white text-lg font-semibold mb-3">Key Benefits</h3>
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: benefit.animDelay + 1, duration: 0.5 }}
                    whileHover={{ x: 5 }}
                  >
                    <CheckCircle className="h-5 w-5 text-security-safe" />
                    <span>{benefit.text}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Call to action */}
              <motion.div 
                className="mt-12 flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <motion.a
                  href="#"
                  className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-primary-800 bg-white hover:bg-primary-50 transition-all duration-300 hover:shadow-lg hover:shadow-primary-800/10"
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Learn more about our technology</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Bottom decoration */}
            <div className="absolute bottom-8 left-12 right-12">
              <motion.div 
                className="flex items-center justify-between text-primary-200 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                <span className="flex items-center">
                  Powered by <span className="bg-white/10 rounded-md px-2 py-0.5 ml-2">Google Gemini AI</span>
                </span>
                <motion.a 
                  href="#"
                  className="text-white/70 hover:text-white flex items-center transition-colors"
                  whileHover={{ x: 3 }}
                >
                  <span>Documentation</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
