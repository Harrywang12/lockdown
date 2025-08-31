-- Simplify RLS policies to allow user creation during authentication
-- This migration creates simpler, more permissive policies

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create simple policies that allow authenticated users to manage their own data
CREATE POLICY "Users can manage own data" ON users
    FOR ALL USING (
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

-- Allow authenticated users to insert their own data (for first-time login)
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON repositories TO authenticated;
GRANT ALL ON scan_sessions TO authenticated;
GRANT ALL ON vulnerabilities TO authenticated;
GRANT ALL ON ai_explanations TO authenticated;

-- Also grant permissions to anon for initial auth
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON users TO anon;
