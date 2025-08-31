-- Temporarily disable RLS on users table to allow user creation
-- This is a temporary fix to get authentication working

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Ensure proper permissions for all users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON repositories TO anon, authenticated;
GRANT ALL ON scan_sessions TO anon, authenticated;
GRANT ALL ON vulnerabilities TO anon, authenticated;
GRANT ALL ON ai_explanations TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
