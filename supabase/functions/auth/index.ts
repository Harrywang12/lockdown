// Auth utility functions for Supabase Edge Functions
// This module provides authentication and security utilities

export * from './utils.ts'

// Default export for the module
export default {
  // Auth utilities are exported from utils.ts
  // This function can be called directly if needed
  health: () => ({ status: 'ok', message: 'Auth utilities loaded' })
}
