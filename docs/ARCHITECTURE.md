# LockDown System Architecture

## 🏗️ Overview

LockDown is a **hybrid serverless application** that combines cloud-based vulnerability scanning with AI-powered explanations. The system is designed for scalability, security, and maintainability while providing enterprise-grade security scanning capabilities to student developers.

## 🎯 Architecture Goals

- **Scalability**: Handle multiple concurrent users and large repositories
- **Security**: Protect user data and prevent abuse
- **Performance**: Fast response times and efficient resource usage
- **Maintainability**: Clean code structure and comprehensive documentation
- **Cost Efficiency**: Serverless architecture with pay-per-use pricing

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Browser   │  │  Mobile Browser │  │   API Clients   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Layer                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                React SPA (Vercel)                          │ │
│  │  • Authentication UI                                       │ │
│  │  • Repository Management                                   │ │
│  │  • Vulnerability Dashboard                                 │ │
│  │  • AI Explanation Interface                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Gateway Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Vercel Edge   │  │  Supabase Auth  │  │   CORS Proxy    │ │
│  │     Network     │  │     Gateway     │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Supabase Edge Functions                        │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                  │ │
│  │  │   /scan         │  │   /explain      │                  │ │
│  │  │   Endpoint      │  │   Endpoint      │                  │ │
│  │  └─────────────────┘  └─────────────────┘                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   GitHub API    │  │  Google Gemini  │  │   Snyk API      │ │
│  │  (OAuth + Repo) │  │     AI API      │  │ (Vuln Scanner)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Supabase PostgreSQL                         │ │
│  │  • Users & Authentication                                  │ │
│  │  • Repositories & Scans                                    │ │
│  │  • Vulnerabilities & AI Explanations                       │ │
│  │  • Rate Limiting & Audit Logs                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Authentication & Authorization

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub OAuth  │───▶│  Supabase Auth  │───▶│  JWT Tokens     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Profile   │    │  Session Mgmt   │    │  API Access     │
│  & Permissions  │    │  & Refresh      │    │  Control        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Security Features:**
- **OAuth 2.0 Flow**: Secure GitHub authentication
- **JWT Tokens**: Stateless authentication with expiration
- **Row Level Security**: Database-level access control
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: XSS and injection protection

### Data Protection

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  GitHub Token   │───▶│   Encryption    │───▶│   Database      │
│  (Sensitive)    │    │   (pgcrypto)    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Protection Measures:**
- **Token Encryption**: GitHub tokens encrypted before storage
- **Secure Headers**: CORS, CSP, and security headers
- **Environment Variables**: API keys stored securely
- **Audit Logging**: Track all security events

## 🚀 Performance Architecture

### Caching Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Cache  │───▶│   Edge Cache    │───▶│   Database      │
│  (React Query)  │    │   (Vercel CDN)  │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Caching Layers:**
1. **Client-Side**: React Query for API responses
2. **Edge**: Vercel's global CDN
3. **Database**: Query result caching
4. **AI Responses**: Explanation caching to reduce API calls

### Scalability Patterns

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │───▶│  Edge Functions │───▶│   Database      │
│   (Vercel)      │    │  (Auto-scaling) │    │   (Connection   │
└─────────────────┘    └─────────────────┘    │   Pooling)      │
                                              └─────────────────┘
```

**Scalability Features:**
- **Serverless**: Auto-scaling based on demand
- **Connection Pooling**: Efficient database connections
- **Async Processing**: Non-blocking operations
- **Horizontal Scaling**: Multiple function instances

## 🗄️ Database Architecture

### Schema Design

```sql
-- Core entities with proper relationships
users (1) ──── (N) repositories (1) ──── (N) scan_sessions
  │                                              │
  │                                              ▼
  └─── (N) vulnerabilities (1) ──── (N) ai_explanations
```

**Database Features:**
- **Normalized Design**: Efficient data storage
- **Indexing Strategy**: Optimized query performance
- **Constraints**: Data integrity enforcement
- **Triggers**: Automated data updates

### Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Request   │───▶│  Validation     │───▶│   Database      │
│                 │    │  & Processing   │    │   Operation     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Response      │    │   Error         │    │   Audit Log     │
│   Generation    │    │   Handling      │    │   Recording     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔌 API Architecture

### RESTful Endpoints

```
POST /functions/v1/scan
├── Authentication: Bearer token required
├── Rate limiting: 10 requests/minute
├── Input validation: URL format, length limits
└── Response: Scan results with security score

POST /functions/v1/explain
├── Authentication: Bearer token required
├── Rate limiting: 50 requests/minute
├── Input validation: Vulnerability data
└── Response: AI-generated explanation
```

### Error Handling

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Request   │───▶│   Validation    │───▶│   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Success       │    │   Client Error  │    │   Server Error  │
│   Response      │    │   (4xx)         │    │   (5xx)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Error Categories:**
- **4xx Errors**: Client-side issues (validation, auth)
- **5xx Errors**: Server-side issues (processing, external APIs)
- **Rate Limiting**: 429 status with retry headers
- **Validation**: Detailed error messages for debugging

## 🤖 AI Integration Architecture

### Gemini API Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Vulnerability  │───▶│  Prompt         │───▶│  Gemini API     │
│     Data        │    │  Engineering    │    │   Request       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Response   │    │   Response      │    │   Cached        │
│   Processing    │    │   Validation    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**AI Features:**
- **Structured Prompts**: Consistent output format
- **Fallback Handling**: Graceful degradation on API failures
- **Response Caching**: Reduce API costs and improve performance
- **Confidence Scoring**: Quality assessment of AI outputs

### Prompt Engineering

```
Vulnerability Analysis Prompt:
├── Context: Repository, language, framework
├── Vulnerability: CVE, severity, description
├── Output Format: JSON with specific fields
└── Safety Settings: Content filtering and moderation
```

## 🔄 State Management

### Frontend State

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Query   │───▶│   Local State   │───▶│   UI Components │
│   (Server State)│    │   (Form Data)   │    │   (Rendering)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**State Management:**
- **React Query**: Server state and caching
- **React Context**: Authentication and user data
- **Local State**: Form inputs and UI interactions
- **Optimistic Updates**: Immediate UI feedback

### Backend State

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Request       │───▶│   Processing    │───▶│   Database      │
│   State         │    │   State         │    │   State         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**State Handling:**
- **Stateless Functions**: No persistent state between requests
- **Database Transactions**: ACID compliance for data integrity
- **Session Management**: User authentication state
- **Rate Limiting**: Request counting and window management

## 📊 Monitoring & Observability

### Logging Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Structured    │───▶│   Centralized   │
│     Logs        │    │   Logging       │    │   Log Storage   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Logging Levels:**
- **DEBUG**: Detailed development information
- **INFO**: General application flow
- **WARN**: Potential issues
- **ERROR**: Application errors
- **SECURITY**: Authentication and security events

### Metrics & Monitoring

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Performance   │───▶│   Business      │───▶│   Security      │
│   Metrics       │    │   Metrics       │    │   Metrics       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Key Metrics:**
- **Performance**: Response times, throughput, error rates
- **Business**: User engagement, scan completion rates
- **Security**: Authentication failures, rate limit violations
- **Infrastructure**: Function execution times, database performance

## 🚀 Deployment Architecture

### Environment Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───▶│   Staging       │───▶│   Production    │
│   (Local)       │    │   (Preview)     │    │   (Live)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Environment Features:**
- **Development**: Local Supabase and development tools
- **Staging**: Production-like environment for testing
- **Production**: Live environment with monitoring

### CI/CD Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Push     │───▶│   Automated     │───▶│   Deployment    │
│   (GitHub)      │    │   Testing       │    │   (Vercel +     │
└─────────────────┘    └─────────────────┘    │   Supabase)     │
                                              └─────────────────┘
```

**Pipeline Stages:**
1. **Code Quality**: Linting, formatting, type checking
2. **Testing**: Unit tests, integration tests
3. **Security**: Dependency scanning, code analysis
4. **Deployment**: Automated deployment to staging/production

## 🔮 Future Enhancements

### Scalability Improvements

- **Microservices**: Break down Edge Functions into smaller services
- **Event-Driven**: Implement message queues for async processing
- **Multi-Region**: Deploy to multiple geographic regions
- **CDN Optimization**: Advanced caching strategies

### Security Enhancements

- **Zero Trust**: Implement zero-trust security model
- **Advanced Auth**: Multi-factor authentication, SSO
- **Threat Detection**: AI-powered security monitoring
- **Compliance**: SOC 2, GDPR compliance features

### AI Capabilities

- **Custom Models**: Train domain-specific AI models
- **Advanced Analysis**: Code pattern recognition
- **Predictive Security**: Vulnerability prediction
- **Natural Language**: Conversational security assistant

## 📚 Technical Decisions

### Why Supabase Edge Functions?

- **Deno Runtime**: Modern, secure JavaScript runtime
- **TypeScript Support**: Full type safety and developer experience
- **Database Integration**: Native PostgreSQL support
- **Serverless**: Auto-scaling and cost efficiency

### Why React + Vercel?

- **Developer Experience**: Excellent tooling and ecosystem
- **Performance**: Edge network and optimization
- **Scalability**: Global CDN and serverless functions
- **Integration**: Seamless deployment and monitoring

### Why PostgreSQL?

- **Reliability**: ACID compliance and data integrity
- **Performance**: Advanced indexing and query optimization
- **Extensions**: Rich ecosystem of extensions (pgcrypto, etc.)
- **Scalability**: Horizontal and vertical scaling options

---

This architecture provides a solid foundation for a production-ready security scanning application while maintaining flexibility for future enhancements and scaling requirements.
