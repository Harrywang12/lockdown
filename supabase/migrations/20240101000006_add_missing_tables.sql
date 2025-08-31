-- Add missing tables that are referenced in the schema but not created
-- This migration adds the rate_limits and dependencies tables

-- Rate limiting table - prevents API abuse
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dependency health table - tracks package dependencies and their status
CREATE TABLE dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    scan_session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    package_manager VARCHAR(50), -- npm, pip, maven, etc.
    current_version VARCHAR(100),
    latest_version VARCHAR(100),
    is_outdated BOOLEAN DEFAULT false,
    vulnerability_count INTEGER DEFAULT 0,
    license VARCHAR(100),
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for the new tables
CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX idx_dependencies_repository_id ON dependencies(repository_id);
CREATE INDEX idx_dependencies_scan_session_id ON dependencies(scan_session_id);
