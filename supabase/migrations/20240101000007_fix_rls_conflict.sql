-- Fix RLS conflict by properly enabling RLS and setting up working policies
-- This resolves the "Policy Exists RLS Disabled" security warning

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can manage own data" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

DROP POLICY IF EXISTS "Users can view own repositories" ON repositories;
DROP POLICY IF EXISTS "Users can insert own repositories" ON repositories;
DROP POLICY IF EXISTS "Users can update own repositories" ON repositories;

DROP POLICY IF EXISTS "Users can view own scan sessions" ON scan_sessions;
DROP POLICY IF EXISTS "Users can insert own scan sessions" ON scan_sessions;
DROP POLICY IF EXISTS "Users can update own scan sessions" ON scan_sessions;

DROP POLICY IF EXISTS "Users can view own vulnerabilities" ON vulnerabilities;
DROP POLICY IF EXISTS "Users can insert own vulnerabilities" ON vulnerabilities;

DROP POLICY IF EXISTS "Users can view own explanations" ON ai_explanations;
DROP POLICY IF EXISTS "Users can insert own explanations" ON ai_explanations;

-- Now enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for users table
-- Users can only see their own data based on GitHub ID
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

-- Create RLS policies for repositories table
-- Users can only see repositories they own
CREATE POLICY "Users can view own repositories" ON repositories
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

CREATE POLICY "Users can insert own repositories" ON repositories
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

CREATE POLICY "Users can update own repositories" ON repositories
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Create RLS policies for scan_sessions table
-- Users can only see scan sessions for their repositories
CREATE POLICY "Users can view own scan sessions" ON scan_sessions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

CREATE POLICY "Users can insert own scan sessions" ON scan_sessions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

CREATE POLICY "Users can update own scan sessions" ON scan_sessions
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Create RLS policies for vulnerabilities table
-- Users can only see vulnerabilities from their scan sessions
CREATE POLICY "Users can view own vulnerabilities" ON vulnerabilities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scan_sessions ss
            JOIN users u ON ss.user_id = u.id
            WHERE ss.id = vulnerabilities.scan_session_id
            AND u.github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

CREATE POLICY "Users can insert own vulnerabilities" ON vulnerabilities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM scan_sessions ss
            JOIN users u ON ss.user_id = u.id
            WHERE ss.id = vulnerabilities.scan_session_id
            AND u.github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Create RLS policies for ai_explanations table
-- Users can only see explanations for their vulnerabilities
CREATE POLICY "Users can view own explanations" ON ai_explanations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vulnerabilities v
            JOIN scan_sessions ss ON v.scan_session_id = ss.id
            JOIN users u ON ss.user_id = u.id
            WHERE v.id = ai_explanations.vulnerability_id
            AND u.github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

CREATE POLICY "Users can insert own explanations" ON ai_explanations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vulnerabilities v
            JOIN scan_sessions ss ON v.scan_session_id = ss.id
            JOIN users u ON ss.user_id = u.id
            WHERE v.id = ai_explanations.vulnerability_id
            AND u.github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON repositories TO authenticated;
GRANT ALL ON scan_sessions TO authenticated;
GRANT ALL ON vulnerabilities TO authenticated;
GRANT ALL ON ai_explanations TO authenticated;

-- Grant permissions to anon for initial auth
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON users TO anon;
