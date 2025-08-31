-- LockDown Initial Database Schema Migration
-- This migration creates all necessary tables and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table - stores GitHub OAuth information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id BIGINT UNIQUE NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    github_email VARCHAR(255),
    github_avatar_url TEXT,
    encrypted_github_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repositories table - tracks scanned repositories
CREATE TABLE IF NOT EXISTS repositories (
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
    
    UNIQUE(user_id, github_repo_id)
);

-- Scan sessions table - tracks individual scan operations
CREATE TABLE IF NOT EXISTS scan_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scan_status VARCHAR(50) DEFAULT 'pending',
    security_score INTEGER DEFAULT 100,
    total_vulnerabilities INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    scan_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scan_completed_at TIMESTAMP WITH TIME ZONE,
    scan_duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerabilities table - stores individual vulnerability findings
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    cve_id VARCHAR(50),
    vulnerability_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    affected_component VARCHAR(255),
    affected_version VARCHAR(100),
    fixed_version VARCHAR(100),
    cvss_score DECIMAL(3,1),
    reference_urls TEXT[],
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI explanations table - stores AI-generated explanations
CREATE TABLE IF NOT EXISTS ai_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    explanation TEXT NOT NULL,
    suggested_fix TEXT NOT NULL,
    risk_assessment TEXT,
    mitigation_steps TEXT[],
    ai_model VARCHAR(100) DEFAULT 'gemini-pro',
    confidence_score DECIMAL(3,2),
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_repository_id ON scan_sessions(repository_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_scan_session_id ON vulnerabilities(scan_session_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repositories_updated_at ON repositories;
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
    
    RETURN GREATEST(score, 0);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own repositories" ON repositories
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own repositories" ON repositories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own scan sessions" ON scan_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own vulnerabilities" ON vulnerabilities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scan_sessions s 
            WHERE s.id = vulnerabilities.scan_session_id 
            AND s.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can view own AI explanations" ON ai_explanations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vulnerabilities v
            JOIN scan_sessions s ON v.scan_session_id = s.id
            WHERE v.id = ai_explanations.vulnerability_id
            AND s.user_id::text = auth.uid()::text
        )
    );
