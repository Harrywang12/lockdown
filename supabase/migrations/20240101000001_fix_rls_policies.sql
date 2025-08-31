-- Fix RLS policies to allow user creation during authentication
-- This migration updates the existing RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies that allow user creation
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (
        auth.uid()::text = id::text OR 
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        auth.uid()::text = id::text OR 
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        auth.uid()::text = id::text OR 
        github_id::text = (auth.jwt() ->> 'sub')::text
    );

-- Also ensure the auth function can access the users table
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON repositories TO authenticated;
GRANT ALL ON scan_sessions TO authenticated;
GRANT ALL ON vulnerabilities TO authenticated;
GRANT ALL ON ai_explanations TO authenticated;
