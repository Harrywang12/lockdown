import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Shield, Filter, Search } from 'lucide-react'
import { getVulnerabilities } from '../services/api'
import { Vulnerability } from '../types'
import { cn } from '../utils/cn'

const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

const Vulnerabilities: React.FC = () => {
  const { data: vulnerabilities = [], isLoading } = useQuery(
    'vulnerabilities',
    () => getVulnerabilities()
  )

  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<null | typeof severityOrder[number]>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (vulnerabilities as Vulnerability[])
      .filter(v => (severity ? v.severity === severity : true))
      .filter(v => {
        if (!q) return true
        const hay = `${v.title} ${v.description} ${v.cve_id} ${(v.affected_component || '')}`.toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => severityOrder.indexOf(a.severity as any) - severityOrder.indexOf(b.severity as any))
  }, [vulnerabilities, query, severity])

  const getSeverityBadge = (sev: Vulnerability['severity']) => cn(
    'badge',
    sev === 'CRITICAL' && 'badge-critical',
    sev === 'HIGH' && 'badge-high',
    sev === 'MEDIUM' && 'badge-medium',
    sev === 'LOW' && 'badge-low'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vulnerabilities</h1>
          <p className="text-gray-600">Browse and drill into detected issues</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, component, CVE..."
                  className="input pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {[null, ...severityOrder].map((opt) => (
                  <button
                    key={String(opt)}
                    className={cn(
                      'px-3 py-1 rounded-lg border text-sm transition-colors',
                      opt === severity
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    )}
                    onClick={() => setSeverity(opt as any)}
                  >
                    {opt ? opt : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No vulnerabilities found</h3>
              <p className="text-gray-500">Try adjusting your filters or run a new scan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map((v) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-lg border border-gray-200 card-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={getSeverityBadge(v.severity)}>{v.severity}</div>
                          <p className="text-sm text-gray-500 truncate">{v.cve_id || 'No CVE'}</p>
                        </div>
                        <Link to={`/vulnerability/${v.id}`} className="block">
                          <h4 className="font-medium text-gray-900 truncate">
                            {v.title}
                          </h4>
                        </Link>
                        <p className="text-sm text-gray-600 line-clamp-2">{v.description}</p>
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{v.vulnerability_type}</span>
                          <span>•</span>
                          <span>Component: {v.affected_component || 'Unknown'}</span>
                          {v.cvss_score && (
                            <>
                              <span>•</span>
                              <span>CVSS: {v.cvss_score}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/vulnerability/${v.id}`} className="btn-secondary">View</Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Vulnerabilities


