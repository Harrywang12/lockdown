import React, { useState } from 'react'
import { 
  User, 
  Shield, 
  Bell, 
  Settings, 
  Download, 
  Key, 
  Eye, 
  EyeOff,
  Save,
  Edit3,
  Trash2,
  Github
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { cn } from '../utils/cn'

const Profile: React.FC = () => {
  const { user, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data'>('profile')

  // Form state
  const [formData, setFormData] = useState({
    username: user?.github_username || '',
    email: user?.github_email || '',
    notifications: {
      email: true,
      browser: true,
      critical: true,
      high: true,
      medium: true,
      low: false
    },
    scanPreferences: {
      defaultScanType: 'full' as const,
      autoScan: false,
      scanFrequency: 'weekly' as const
    },
    privacy: {
      shareData: false,
      anonymousUsage: false
    }
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Save settings logic would go here
      toast.success('Settings saved successfully!')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle nested object changes
  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value
      }
    }))
  }

  // Tabs configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: Settings }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-gray-600">Manage your account, security preferences, and data settings</p>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    activeTab === tab.id
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      activeTab === tab.id
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>
              <div className="card-body space-y-6">
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-6">
                  <img
                    className="h-20 w-20 rounded-full"
                    src={user?.github_avatar_url || '/default-avatar.png'}
                    alt={user?.github_username || 'User'}
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user?.github_username || 'Username'}
                    </h3>
                    <p className="text-gray-600">{user?.github_email || 'email@example.com'}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Github className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Connected to GitHub</span>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <p className="text-sm text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Login
                    </label>
                    <p className="text-sm text-gray-900">
                      {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                </div>
                <div className="card-body space-y-6">
                  {/* GitHub OAuth */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Github className="h-6 w-6 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">GitHub OAuth</h3>
                        <p className="text-sm text-gray-500">Connected via GitHub OAuth</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                      <span className="text-sm text-gray-600">Connected</span>
                    </div>
                  </div>

                  {/* API Keys */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">API Keys</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">LockDown API Key</p>
                          <p className="text-sm text-gray-500">Used for programmatic access</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value="sk_live_1234567890abcdef"
                            readOnly
                            className="px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Preferences */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Security Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.scanPreferences.autoScan}
                          onChange={(e) => handleNestedChange('scanPreferences', 'autoScan', e.target.checked)}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable automatic security scanning</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.privacy.shareData}
                          onChange={(e) => handleNestedChange('privacy', 'shareData', e.target.checked)}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Share anonymized data for research</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan History */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Recent Security Activity</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Repository scan completed</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">Score: 85</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Vulnerability detected</p>
                          <p className="text-xs text-gray-500">1 day ago</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">Medium severity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
              </div>
              <div className="card-body space-y-6">
                {/* Notification Channels */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Notification Channels</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.email}
                        onChange={(e) => handleNestedChange('notifications', 'email', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.browser}
                        onChange={(e) => handleNestedChange('notifications', 'browser', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Browser notifications</span>
                    </label>
                  </div>
                </div>

                {/* Vulnerability Alerts */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Vulnerability Alerts</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.critical}
                        onChange={(e) => handleNestedChange('notifications', 'critical', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Critical vulnerabilities</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.high}
                        onChange={(e) => handleNestedChange('notifications', 'high', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">High severity vulnerabilities</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.medium}
                        onChange={(e) => handleNestedChange('notifications', 'medium', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Medium severity vulnerabilities</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.low}
                        onChange={(e) => handleNestedChange('notifications', 'low', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Low severity vulnerabilities</span>
                    </label>
                  </div>
                </div>

                {/* Scan Preferences */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Scan Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Scan Type
                      </label>
                      <select
                        value={formData.scanPreferences.defaultScanType}
                        onChange={(e) => handleNestedChange('scanPreferences', 'defaultScanType', e.target.value)}
                        disabled={!isEditing}
                        className="input"
                      >
                        <option value="full">Full Scan</option>
                        <option value="dependencies">Dependencies Only</option>
                        <option value="quick">Quick Scan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scan Frequency
                      </label>
                      <select
                        value={formData.scanPreferences.scanFrequency}
                        onChange={(e) => handleNestedChange('scanPreferences', 'scanFrequency', e.target.value)}
                        disabled={!isEditing}
                        className="input"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Data & Privacy</h2>
                </div>
                <div className="card-body space-y-6">
                  {/* Privacy Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.privacy.shareData}
                          onChange={(e) => handleNestedChange('privacy', 'shareData', e.target.checked)}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Share anonymized data for research and improvement</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.privacy.anonymousUsage}
                          onChange={(e) => handleNestedChange('privacy', 'anonymousUsage', e.target.checked)}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Allow anonymous usage analytics</span>
                      </label>
                    </div>
                  </div>

                  {/* Data Export */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Data Export</h3>
                    <div className="space-y-3">
                      <button className="btn-secondary w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export My Data
                      </button>
                      <p className="text-xs text-gray-500">
                        Download all your data including scan results, vulnerability reports, and settings
                      </p>
                    </div>
                  </div>

                  {/* Account Deletion */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-red-900 mb-3">Danger Zone</h3>
                    <div className="space-y-3">
                      <button className="btn-danger w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </button>
                      <p className="text-xs text-gray-500">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
