# LockDown Deployment Guide

This guide provides step-by-step instructions for deploying the LockDown application to production environments.

## 🚀 Deployment Overview

LockDown uses a **hybrid serverless architecture**:
- **Frontend**: React app deployed on Vercel
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Authentication**: GitHub OAuth via Supabase Auth

## 📋 Prerequisites

Before deployment, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] GitHub account with OAuth app configured
- [ ] Google Gemini API key
- [ ] Snyk API token (optional)

## 🔧 Environment Setup

### 1. GitHub OAuth Configuration

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Application name**: LockDown Security Scanner
   - **Homepage URL**: `https://your-domain.vercel.app`
   - **Authorization callback URL**: `https://your-supabase-project.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**

### 2. Google Gemini API Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key for backend configuration

### 3. Snyk API Setup (Optional)

1. Go to [Snyk Account Settings](https://app.snyk.io/account)
2. Navigate to API tokens
3. Create a new token with appropriate permissions

## 🗄️ Supabase Backend Deployment

### 1. Create Supabase Project

```bash
# Login to Supabase
supabase login

# Create new project
supabase projects create lockdown-security

# Link local project to remote
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Configure Environment Variables

Create `.env` file in the `backend/` directory:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
SNYK_API_TOKEN=your_snyk_token
```

### 3. Deploy Database Schema

```bash
cd backend

# Push schema to remote database
supabase db push

# Verify deployment
supabase db diff
```

### 4. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy scan
supabase functions deploy explain
```

### 5. Configure GitHub OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable GitHub provider
4. Enter your GitHub OAuth credentials:
   - **Client ID**: Your GitHub OAuth app client ID
   - **Client Secret**: Your GitHub OAuth app client secret

### 6. Set RLS Policies

Run the following SQL in your Supabase SQL editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can view own repositories" ON repositories
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own repositories" ON repositories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Add similar policies for other tables
```

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend Build

```bash
cd frontend

# Install dependencies
npm install

# Create production environment file
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

### 3. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Or use Vercel dashboard
vercel
```

### 4. Configure Vercel Environment Variables

In your Vercel dashboard:

1. Go to Project Settings > Environment Variables
2. Add the same variables from `.env.local`
3. Redeploy if needed

### 5. Configure Custom Domain (Optional)

1. In Vercel dashboard, go to Domains
2. Add your custom domain
3. Update GitHub OAuth callback URLs
4. Update Supabase redirect URLs

## 🔒 Security Configuration

### 1. CORS Settings

Update your Supabase project settings:

```sql
-- Allow your frontend domain
INSERT INTO auth.config (key, value) 
VALUES ('site_url', 'https://your-domain.vercel.app');

-- Update redirect URLs
UPDATE auth.config 
SET value = '["https://your-domain.vercel.app"]' 
WHERE key = 'additional_redirect_urls';
```

### 2. Rate Limiting

The Edge Functions include built-in rate limiting:
- **Scan endpoint**: 10 requests per minute per user
- **Explain endpoint**: 50 requests per minute per user

### 3. API Key Security

- Store all API keys in environment variables
- Never commit `.env` files to version control
- Use Supabase's built-in secret management

## 📊 Monitoring & Analytics

### 1. Supabase Dashboard

Monitor your backend:
- **Edge Functions**: View logs and performance
- **Database**: Monitor queries and performance
- **Auth**: Track user signups and sessions

### 2. Vercel Analytics

Enable in your Vercel dashboard:
- **Web Analytics**: Track frontend performance
- **Speed Insights**: Monitor Core Web Vitals

### 3. Error Tracking

Consider integrating:
- **Sentry**: For error monitoring
- **LogRocket**: For session replay
- **Google Analytics**: For user behavior

## 🧪 Testing Deployment

### 1. Health Check

Test your deployed endpoints:

```bash
# Test scan endpoint
curl -X POST https://your-project-ref.supabase.co/functions/v1/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/test/repo"}'

# Test explain endpoint
curl -X POST https://your-project-ref.supabase.co/functions/v1/explain \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vulnerability": {"severity": "HIGH", "title": "Test", "description": "Test"}}'
```

### 2. Frontend Testing

1. Visit your deployed frontend URL
2. Test GitHub OAuth login
3. Test repository scanning
4. Test AI explanations
5. Verify all components render correctly

## 🔄 CI/CD Pipeline

### 1. GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy LockDown

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 2. Environment Variables in CI/CD

Set these secrets in your GitHub repository:
- `SUPABASE_PROJECT_REF`
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify Supabase CORS settings
   - Check frontend domain in Supabase config

2. **Authentication Failures**
   - Verify GitHub OAuth credentials
   - Check redirect URLs match exactly

3. **Edge Function Errors**
   - Check function logs in Supabase dashboard
   - Verify environment variables are set

4. **Database Connection Issues**
   - Verify database is running
   - Check connection string format

### Debug Commands

```bash
# Check Supabase status
supabase status

# View function logs
supabase functions logs scan --follow

# Test local functions
supabase functions serve

# Check database connection
supabase db ping
```

## 📈 Performance Optimization

### 1. Frontend

- Enable Vercel's Edge Network
- Use React Query for efficient data fetching
- Implement proper code splitting

### 2. Backend

- Monitor Edge Function cold starts
- Use connection pooling for database
- Implement proper caching strategies

### 3. Database

- Add appropriate indexes
- Monitor query performance
- Use read replicas if needed

## 🔐 Production Security Checklist

- [ ] All API keys are in environment variables
- [ ] GitHub OAuth is properly configured
- [ ] CORS settings are restricted to your domain
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Database RLS policies are active
- [ ] Error messages don't expose sensitive information
- [ ] Logging is configured appropriately
- [ ] Monitoring and alerting are set up

## 📞 Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review [Vercel deployment docs](https://vercel.com/docs)
3. Check GitHub Issues for common problems
4. Contact the LockDown team for assistance

---

**Happy Deploying! 🚀**

Your LockDown application should now be running securely in production with AI-powered vulnerability scanning capabilities.
