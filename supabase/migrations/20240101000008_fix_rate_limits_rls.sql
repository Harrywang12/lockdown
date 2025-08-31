-- Fix RLS for rate_limits table
-- Enable RLS and add appropriate policies for the rate_limits table

-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rate_limits table
-- Users can only see their own rate limit data
CREATE POLICY "Users can view own rate limits" ON rate_limits
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Users can insert their own rate limit data
CREATE POLICY "Users can insert own rate limits" ON rate_limits
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Users can update their own rate limit data
CREATE POLICY "Users can update own rate limits" ON rate_limits
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Users can delete their own rate limit data
CREATE POLICY "Users can delete own rate limits" ON rate_limits
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE github_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- Grant permissions for rate_limits table
GRANT ALL ON rate_limits TO authenticated;
GRANT ALL ON rate_limits TO anon;

-- Also ensure dependencies table has RLS enabled (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dependencies') THEN
        ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for dependencies table
        CREATE POLICY "Users can view own dependencies" ON dependencies
            FOR SELECT USING (
                repository_id IN (
                    SELECT r.id FROM repositories r
                    JOIN users u ON r.user_id = u.id
                    WHERE u.github_id::text = (auth.jwt() ->> 'sub')::text
                )
            );

        CREATE POLICY "Users can insert own dependencies" ON dependencies
            FOR INSERT WITH CHECK (
                repository_id IN (
                    SELECT r.id FROM repositories r
                    JOIN users u ON r.user_id = u.id
                    WHERE u.github_id::text = (auth.jwt() ->> 'sub')::text
                )
            );

        CREATE POLICY "Users can update own dependencies" ON dependencies
            FOR UPDATE USING (
                repository_id IN (
                    SELECT r.id FROM repositories r
                    JOIN users u ON r.user_id = u.id
                    WHERE u.github_id::text = (auth.jwt() ->> 'sub')::text
                )
            );

        CREATE POLICY "Users can delete own dependencies" ON dependencies
            FOR DELETE USING (
                repository_id IN (
                    SELECT r.id FROM repositories r
                    JOIN users u ON r.user_id = u.id
                    WHERE u.github_id::text = (auth.jwt() ->> 'sub')::text
                )
            );

        GRANT ALL ON dependencies TO authenticated;
        GRANT ALL ON dependencies TO anon;
    END IF;
END $$;
