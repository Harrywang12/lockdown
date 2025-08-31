-- LockDown Database Schema
-- Comprehensive vulnerability scanning and AI explanation storage

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table - stores GitHub OAuth information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id BIGINT UNIQUE NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    github_email VARCHAR(255),
    github_avatar_url TEXT,
    encrypted_github_token TEXT NOT NULL, -- Encrypted GitHub access token
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repositories table - tracks scanned repositories
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id BIGINT NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    repo_full_name VARCHAR(255) NOT NULL,
    repo_url TEXT NOT NULL,
    default_branch VARCHAR(100) DEFAULT 'main',
    language VARCHAR(100),
    is_private BOOLEAN DEFAULT false,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique repos per user
    UNIQUE(user_id, github_repo_id)
);

-- Scan sessions table - tracks individual scan operations
CREATE TABLE scan_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scan_status VARCHAR(50) DEFAULT 'pending', -- pending, scanning, completed, failed
    security_score INTEGER DEFAULT 100, -- 0-100 scale
    total_vulnerabilities INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    scan_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scan_completed_at TIMESTAMP WITH TIME ZONE,
    scan_duration_ms INTEGER, -- Duration in milliseconds
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerabilities table - stores individual vulnerability findings
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    cve_id VARCHAR(50), -- CVE identifier if available
    vulnerability_type VARCHAR(100) NOT NULL, -- dependency, code, config, etc.
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    affected_component VARCHAR(255), -- file path, package name, etc.
    affected_version VARCHAR(100),
    fixed_version VARCHAR(100),
    cvss_score DECIMAL(3,1), -- CVSS score if available
    reference_urls TEXT[], -- Array of reference URLs
    raw_data JSONB, -- Store original API response data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI explanations table - stores AI-generated explanations for vulnerabilities
CREATE TABLE ai_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    explanation TEXT NOT NULL,
    suggested_fix TEXT NOT NULL,
    risk_assessment TEXT,
    mitigation_steps TEXT[],
    ai_model VARCHAR(100) DEFAULT 'gemini-pro',
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    tokens_used INTEGER,
    processing_time_ms INTEGER,
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

-- Rate limiting table - prevents API abuse
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX idx_scan_sessions_repository_id ON scan_sessions(repository_id);
CREATE INDEX idx_scan_sessions_user_id ON scan_sessions(user_id);
CREATE INDEX idx_scan_sessions_status ON scan_sessions(scan_status);
CREATE INDEX idx_vulnerabilities_scan_session_id ON vulnerabilities(scan_session_id);
CREATE INDEX idx_vulnerabilities_repository_id ON vulnerabilities(repository_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_cve_id ON vulnerabilities(cve_id);
CREATE INDEX idx_ai_explanations_vulnerability_id ON ai_explanations(vulnerability_id);
CREATE INDEX idx_dependencies_repository_id ON dependencies(repository_id);
CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);

-- Create composite indexes for common query patterns
CREATE INDEX idx_scan_sessions_user_status ON scan_sessions(user_id, scan_status);
CREATE INDEX idx_vulnerabilities_repo_severity ON vulnerabilities(repository_id, severity);
CREATE INDEX idx_repositories_user_updated ON repositories(user_id, updated_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate security score
CREATE OR REPLACE FUNCTION calculate_security_score(
    critical_count INTEGER,
    high_count INTEGER,
    medium_count INTEGER,
    low_count INTEGER
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 100;
BEGIN
    score := score - (critical_count * 25);
    score := score - (high_count * 15);
    score := score - (medium_count * 7);
    score := score - (low_count * 3);
    
    -- Ensure score doesn't go below 0
    RETURN GREATEST(score, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's security summary
CREATE OR REPLACE FUNCTION get_user_security_summary(user_uuid UUID)
RETURNS TABLE(
    total_repos INTEGER,
    total_scans INTEGER,
    avg_security_score DECIMAL(5,2),
    total_vulnerabilities INTEGER,
    critical_count INTEGER,
    high_count INTEGER,
    medium_count INTEGER,
    low_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT r.id)::INTEGER as total_repos,
        COUNT(s.id)::INTEGER as total_scans,
        AVG(s.security_score)::DECIMAL(5,2) as avg_security_score,
        SUM(s.total_vulnerabilities)::INTEGER as total_vulnerabilities,
        SUM(s.critical_count)::INTEGER as critical_count,
        SUM(s.high_count)::INTEGER as high_count,
        SUM(s.medium_count)::INTEGER as medium_count,
        SUM(s.low_count)::INTEGER as low_count
    FROM users u
    LEFT JOIN repositories r ON u.id = r.user_id
    LEFT JOIN scan_sessions s ON r.id = s.repository_id
    WHERE u.id = user_uuid
    GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for development/testing
INSERT INTO users (github_id, github_username, github_email, encrypted_github_token) VALUES
(12345, 'testuser', 'test@example.com', crypt('sample_token', gen_salt('bf')));

-- Create views for common queries
CREATE VIEW vulnerability_summary AS
SELECT 
    r.repo_name,
    r.repo_full_name,
    s.security_score,
    s.total_vulnerabilities,
    s.critical_count,
    s.high_count,
    s.medium_count,
    s.low_count,
    s.scan_completed_at,
    u.github_username
FROM scan_sessions s
JOIN repositories r ON s.repository_id = r.id
JOIN users u ON r.user_id = u.id
WHERE s.scan_status = 'completed'
ORDER BY s.scan_completed_at DESC;

-- Grant necessary permissions (adjust based on your Supabase setup)
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
