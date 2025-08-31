# LockDown 🔒

**AI-Powered Vulnerability Scanner for Student Developers**

A comprehensive web application that helps you identify and understand security vulnerabilities in your GitHub repositories. Get instant security insights with AI-powered explanations to make your code more secure.

## 🎯 How to Use LockDown

### For End Users (Students & Developers)

#### 1. **Get Started**
- Visit the LockDown web application
- Sign in with your GitHub account (OAuth authentication)
- You'll be redirected to the dashboard

#### 2. **Scan Your Repository**
- Click "Scan Repository" or "New Scan"
- Enter your GitHub repository URL (e.g., `https://github.com/username/my-project`)
- Optionally specify a branch (defaults to `main`)
- Click "Start Scan"

#### 3. **Review Results**
- **Security Score**: See your repository's overall security rating (0-100)
- **Vulnerability Count**: View breakdown by severity (Critical, High, Medium, Low)
- **Detailed Findings**: Click on any vulnerability for:
  - AI-powered explanation of the issue
  - Suggested fixes and mitigation steps
  - Risk assessment and impact analysis
  - Reference links for more information

#### 4. **Take Action**
- **Fix Vulnerabilities**: Follow the suggested fixes in your code
- **Export Reports**: Download security badges for your README
- **Track Progress**: Monitor security improvements over time
- **Share Results**: Collaborate with team members on security issues

### Key Features for Users

- **🔍 Instant Scanning**: Get results in seconds, not hours
- **🤖 AI Explanations**: Understand complex security issues in plain English
- **📊 Visual Dashboard**: Clear metrics and progress tracking
- **🔒 Secure**: Your code and tokens are encrypted and protected
- **📱 Responsive**: Works on desktop, tablet, and mobile
- **🔄 Real-time**: Live updates during scanning process

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│    │ Supabase Edge    │    │  Cloud APIs     │
│   (Vercel)      │◄──►│  Functions       │◄──►│  (Snyk/OSV)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Supabase DB    │             │
         │              │   (PostgreSQL)   │             │
         └──────────────┴──────────────────┴─────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Google Gemini   │
                       │     AI API       │
                       └──────────────────┘
```

## 🚀 Features

- **GitHub OAuth Authentication** - Secure login with GitHub
- **Repository Scanning** - Scan any GitHub repository for vulnerabilities
- **AI-Powered Explanations** - Get human-readable explanations of security issues
- **Security Scoring** - Quantitative assessment of repository security
- **Real-time Results** - Instant vulnerability detection and reporting
- **Exportable Reports** - Download security badges and detailed reports

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **Database**: Supabase PostgreSQL
- **Authentication**: GitHub OAuth
- **AI Integration**: Google Gemini API
- **Vulnerability Scanning**: Snyk API + OSV.dev API
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## 📁 Project Structure

```
lockdown/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Supabase Edge Functions
│   ├── functions/
│   │   ├── scan/           # Repository scanning endpoint
│   │   ├── explain/        # AI explanation endpoint
│   │   └── auth/           # Authentication utilities
│   └── supabase/
│       └── config.toml     # Supabase configuration
├── database/                # Database schema and migrations
├── docs/                    # Documentation and API specs
└── README.md               # This file
```

## 🚀 Quick Start (For Developers)

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI
- GitHub OAuth App
- Google Gemini API Key
- Snyk API Token (optional)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd lockdown
npm install
```

### 2. Environment Configuration

Create `.env.local` in the frontend directory:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

Create `.env` in the backend directory:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
SNYK_API_TOKEN=your_snyk_token
```

### 3. Database Setup

```bash
cd backend
supabase start
supabase db reset
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy scan
supabase functions deploy explain
```

### 5. Start Development

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend (if testing locally)
cd backend
supabase functions serve
```

## 🔧 Configuration

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/auth/callback`
4. Copy Client ID and Client Secret

### Supabase Setup

1. Create new Supabase project
2. Enable Edge Functions
3. Configure GitHub OAuth provider
4. Set up database tables (see `database/schema.sql`)

### API Keys

- **Google Gemini**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Snyk**: Get from [Snyk Account Settings](https://app.snyk.io/account)

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Supabase)

```bash
cd backend
supabase functions deploy --project-ref your_project_ref
```

## 🔒 Security Features

- **Token Encryption**: GitHub tokens stored encrypted in database
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All inputs sanitized and validated
- **CORS Protection**: Proper CORS headers for production
- **Secret Management**: Environment variables for sensitive data

## 📊 Security Scoring Algorithm

- **CRITICAL**: -25 points
- **HIGH**: -15 points  
- **MEDIUM**: -7 points
- **LOW**: -3 points
- **Starting Score**: 100 points
- **Minimum Score**: 0 points

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

## 📈 Performance Considerations

- **Async Processing**: Long-running scans handled asynchronously
- **Caching**: Scan results cached to avoid redundant API calls
- **Batch Processing**: Multiple vulnerabilities processed in batches
- **Connection Pooling**: Database connections optimized

## 🔮 Future Enhancements

- **Custom Vulnerability Detection**: Pattern-based code analysis
- **CI/CD Integration**: GitHub Actions for automated scanning
- **Team Collaboration**: Shared vulnerability reports
- **Advanced AI**: Custom-trained models for specific vulnerability types
- **Real-time Monitoring**: WebSocket-based live vulnerability updates

## 📚 API Documentation

### POST /functions/v1/scan
Scans a GitHub repository for vulnerabilities.

**Request:**
```json
{
  "repoUrl": "https://github.com/user/repo",
  "branch": "main"
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "uuid",
  "vulnerabilities": [...],
  "securityScore": 85,
  "scanTimestamp": "2024-01-01T00:00:00Z"
}
```

### POST /functions/v1/explain
Gets AI-powered explanation for a vulnerability.

**Request:**
```json
{
  "vulnerability": {
    "cve": "CVE-2024-0001",
    "severity": "HIGH",
    "description": "SQL injection vulnerability..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "explanation": "This vulnerability allows...",
  "suggestedFix": "Use parameterized queries...",
  "riskLevel": "HIGH",
  "mitigationSteps": [...]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---


