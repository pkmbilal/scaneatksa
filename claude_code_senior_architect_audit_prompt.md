# Claude Code — Senior Software Architect Production Audit

Act as a **Senior Software Architect, Principal Engineer, Security Engineer, and Production Reliability Engineer** reviewing this entire codebase.

This is a serious **production-readiness audit**. Do NOT assume the existing architecture is correct simply because the application works.

Your job is to inspect the actual codebase, configuration, database access patterns, API routes, authentication, frontend/backend architecture, Supabase usage, Vercel deployment configuration, dependencies, and infrastructure-related code.

## IMPORTANT RULES

1. **Do not modify any files.**
2. Do not refactor or "fix" anything yet.
3. First perform a comprehensive audit and produce a detailed report.
4. Do not give generic advice. Every finding should be connected to actual code/configuration in this repository.
5. If something cannot be verified from the repository, explicitly say:
   - "Cannot verify from codebase"
   - and explain what would need to be checked.
6. Assume this application will eventually have real users and real production traffic.
7. Look for problems that may not be obvious during normal development.
8. Pay special attention to issues that could cause:
   - security vulnerabilities
   - data leaks
   - excessive Supabase usage
   - excessive Vercel usage/cost
   - database performance problems
   - unnecessary API requests
   - serverless function problems
   - scalability problems
   - slow page loads
   - authentication problems
   - authorization problems
   - race conditions
   - reliability issues
   - unnecessary database queries
   - N+1 queries
   - inefficient React rendering
   - memory/resource problems
   - excessive logging
   - production deployment failures

---

# PHASE 1 — UNDERSTAND THE ARCHITECTURE

First inspect the repository and determine:

- Framework
- Frontend architecture
- Backend architecture
- API architecture
- Database
- Authentication mechanism
- Authorization/RBAC
- Supabase services being used
- Vercel services/features being used
- Storage architecture
- External APIs/services
- Background jobs/cron jobs
- Caching strategy
- State management
- ORM/query builder/database client
- Deployment configuration
- Environment variable strategy

Create a concise architecture diagram in text showing:

User
↓
Frontend
↓
API / Server Actions / Server Components / Edge Functions
↓
Supabase / Database / Storage / Auth
↓
External services

Adjust the diagram based on the actual implementation.

---

# PHASE 2 — SECURITY AUDIT

Perform a serious security review.

## Authentication

Look for:

- Authentication bypass
- Incorrect session handling
- Weak session validation
- Client-side-only authentication checks
- Improper JWT handling
- Token exposure
- Authentication state inconsistencies
- Password handling problems
- Password reset vulnerabilities
- Email verification problems
- Session fixation
- Missing authentication checks on APIs

## Authorization

Check every sensitive API/server action/database operation.

Look for:

- IDOR vulnerabilities
- Missing ownership checks
- Missing role checks
- Privilege escalation
- Users accessing another user's records
- Admin functionality exposed to normal users
- Client-controlled user IDs
- Client-controlled role values
- Trusting hidden form fields for authorization

Do not assume that hiding a UI element is security.

## Supabase Security

Inspect:

- Row Level Security (RLS)
- RLS policies
- Service-role key usage
- Anon key usage
- Database permissions
- Storage policies
- Storage bucket permissions
- Direct client-side database access
- Server-side privileged queries
- Any place where service-role credentials could leak

Pay particular attention to whether the application relies on application code for authorization when RLS should provide database-level protection.

Identify tables that appear to contain sensitive information and determine whether their access policies are appropriately restricted.

## Secrets

Search for:

- hardcoded API keys
- credentials
- tokens
- passwords
- service-role keys
- private keys
- secrets committed to source control
- secrets exposed to browser/client bundles
- incorrectly prefixed public environment variables

Check `.env`, `.env.example`, Vercel configuration, configuration files and source code.

## Injection

Check for:

- SQL injection
- command injection
- XSS
- HTML injection
- unsafe `dangerouslySetInnerHTML`
- unsafe HTML rendering
- SSRF
- path traversal
- unsafe redirects
- template injection
- malicious file uploads

## File Uploads

If file uploads exist, inspect:

- file type validation
- MIME validation
- file size limits
- filename handling
- storage permissions
- public/private buckets
- malicious file risks
- unauthorized file access
- image processing risks

---

# PHASE 3 — SUPABASE USAGE AUDIT

Assume Supabase usage can become expensive or rate-limited at scale.

Inspect every Supabase query.

## Excessive Queries

Look for:

- duplicate queries
- unnecessary queries
- queries executed on every render
- queries executed repeatedly
- queries that could be cached
- queries triggered unnecessarily from the client
- polling
- unnecessary realtime subscriptions

## N+1 Queries

Find code patterns such as:

    for each item:
        query database

Identify exactly where this happens.

## Query Efficiency

Check:

- SELECT *
- fetching unnecessary columns
- missing filters
- missing pagination
- large result sets
- expensive joins
- repeated joins
- unnecessary sorting
- unnecessary counting
- inefficient search
- queries without appropriate indexes

## Pagination

Check every list/table/search endpoint.

Determine whether pagination is:

- implemented
- cursor-based or offset-based
- safe for large datasets
- fetching too many rows

Flag endpoints that could eventually attempt to load thousands/millions of records.

## Database Indexes

Inspect migrations/schema.

Identify columns likely needing indexes based on actual queries.

Examples:

- foreign keys
- frequently filtered columns
- frequently sorted columns
- lookup fields
- timestamps
- status fields
- unique identifiers

Do not blindly recommend indexes. Explain why each index is needed and what query benefits from it.

## Supabase Realtime

If Realtime is used:

- identify every subscription
- determine when subscriptions are created/destroyed
- check for duplicate subscriptions
- check cleanup behavior
- determine whether realtime is actually necessary
- identify possible connection explosion

## Supabase Storage

Audit:

- upload frequency
- image/file sizes
- public URLs
- transformations
- caching
- unnecessary downloads
- repeated downloads
- access policies

## Supabase Edge Functions

If used, inspect:

- invocation frequency
- cold-start implications
- unnecessary calls
- timeout risks
- authentication
- secrets
- external API calls
- retry behavior

---

# PHASE 4 — VERCEL USAGE / COST / SERVERLESS AUDIT

Review the application specifically from a Vercel perspective.

Look for patterns that can cause excessive:

- Function invocations
- Function execution time
- bandwidth
- build minutes
- serverless compute
- edge requests
- image optimization usage
- cron executions
- ISR/revalidation activity

Inspect:

- `vercel.json`
- Next.js configuration
- API routes
- Server Actions
- middleware
- server components
- route handlers
- cron jobs
- caching
- revalidation
- dynamic rendering

Identify routes that may unintentionally become dynamic.

Look for:

- unnecessary server rendering
- unnecessary server actions
- API calls from server to another internal API route
- API calls from client when server-side fetching would be better
- repeated requests caused by React rendering
- middleware running on too many routes
- expensive operations inside middleware
- functions performing long database operations
- functions calling multiple external services sequentially

Identify anything that could create unexpectedly high Vercel usage.

---

# PHASE 5 — PERFORMANCE AUDIT

Analyze frontend and backend performance.

## Frontend

Inspect:

- unnecessary re-renders
- large JavaScript bundles
- unnecessary dependencies
- client components that could be server components
- excessive use of `useEffect`
- duplicate API calls
- inefficient state management
- large images
- missing image optimization
- layout shifts
- expensive calculations during render
- unnecessary hydration
- huge components
- unnecessary third-party scripts

## React

Look for:

- incorrect dependency arrays
- effects that trigger loops
- effects used for derived state
- state that could be computed
- unstable object/function references
- unnecessary context updates
- lists without proper keys
- large lists without virtualization where appropriate

Do not recommend `useMemo`, `useCallback`, or memoization everywhere. Only recommend them when there is evidence of a performance problem.

## Backend

Inspect:

- slow queries
- repeated queries
- sequential operations that could be parallelized
- unnecessary external API calls
- large response payloads
- inefficient serialization
- expensive computation inside serverless functions
- missing caching

---

# PHASE 6 — SCALABILITY AUDIT

Imagine this application grows from:

10 users
→ 100 users
→ 1,000 users
→ 10,000 users
→ 100,000 users

Identify what will break first.

Pay special attention to:

- database connection usage
- query volume
- Supabase limits
- Vercel function execution
- storage
- realtime connections
- API rate limits
- large database tables
- unbounded queries
- search functionality
- reporting/dashboard queries
- cron jobs
- background processing

For each issue explain:

"Works at small scale but becomes problematic when ______."

---

# PHASE 7 — RELIABILITY / ERROR HANDLING

Inspect:

- error handling
- API error responses
- database error handling
- retries
- timeout handling
- external API failures
- partial failures
- transaction usage
- race conditions
- duplicate submissions
- idempotency
- optimistic updates
- concurrent updates

Identify operations that should probably be transactional.

Look for situations where:

Operation A succeeds
but
Operation B fails

and leaves the database in an inconsistent state.

---

# PHASE 8 — DATA INTEGRITY

Review database operations for:

- missing constraints
- missing foreign keys
- incorrect relationships
- nullable fields that should not be nullable
- duplicate records
- race conditions
- missing unique constraints
- unsafe upserts
- inconsistent status values
- client-controlled timestamps
- client-controlled ownership fields

Recommend database-level constraints where appropriate.

---

# PHASE 9 — DEPENDENCIES

Inspect:

- package.json
- lock files
- dependency versions
- unused dependencies
- duplicated dependencies
- outdated/high-risk packages
- unnecessarily large packages
- client-side packages that could remain server-side

Identify dependencies that significantly affect bundle size or security.

---

# PHASE 10 — CODE QUALITY / ARCHITECTURE

Review:

- separation of concerns
- component structure
- service/repository patterns
- database access patterns
- duplicated logic
- excessive abstraction
- under-abstraction
- tightly coupled components
- inconsistent error handling
- inconsistent naming
- dead code
- unreachable code
- technical debt

Look specifically for code that works today but will become difficult to maintain as the application grows.

---

# PHASE 11 — ENVIRONMENT / DEPLOYMENT

Review:

- environment variables
- development vs production configuration
- Supabase configuration
- Vercel configuration
- build configuration
- database migrations
- migration safety
- seed scripts
- production build
- logging
- source maps
- error monitoring

Identify configuration that could accidentally expose development functionality in production.

---

# PHASE 12 — COST ANALYSIS

Based on the actual architecture, identify potential cost drivers.

Separate them into:

### LOW RISK
Likely inexpensive under normal usage.

### MEDIUM RISK
Could become noticeable as traffic grows.

### HIGH RISK
Could generate unexpectedly high usage/cost.

For each cost risk explain:

- What causes the usage
- Where it occurs in the code
- What resource is consumed
- Why it can scale badly
- How to reduce it

Do NOT invent exact costs unless they can be verified from current official pricing documentation.

---

# PHASE 13 — PRIORITIZED FINDINGS

Create a table:

| Priority | Category | Finding | Evidence | Impact | Likelihood | Recommended Fix |
|---|---|---|---|---|---|---|

Use these priorities:

P0 = Critical security/data-loss/production issue
P1 = High-impact security/performance/reliability issue
P2 = Important technical debt or scalability issue
P3 = Improvement / optimization
P4 = Nice-to-have

Do not artificially inflate severity.

---

# PHASE 14 — TOP 10 PROBLEMS

After the complete audit, give me the **10 most important problems you found**.

For each:

1. Problem
2. Exact file/path
3. Relevant function/component
4. Why it is a problem
5. Real-world scenario where it could cause trouble
6. Severity
7. Recommended solution
8. Whether it should be fixed before production

---

# PHASE 15 — "WHAT I WOULD FIX FIRST"

Finally, act as the senior architect responsible for taking this project to production.

Give me a prioritized implementation roadmap:

### Before Production
Things that should be fixed before deployment.

### Before First 1,000 Users
Things that should be addressed as usage grows.

### Before Significant Scale
Things that can wait until the application has meaningful traffic.

### Optional Improvements
Things that are useful but not urgent.

Do not rewrite the code.

---

# IMPORTANT FINAL REQUIREMENT

At the end, provide:

## Architecture Health

Rate each area ONLY descriptively using:

- Healthy
- Needs Attention
- High Risk
- Critical

Areas:

- Security
- Authentication
- Authorization
- Database
- Supabase Usage
- Vercel Usage
- Performance
- Scalability
- Reliability
- Code Quality
- Deployment
- Cost Efficiency

Do not give an overall score.

Most importantly, **base your findings on actual inspection of the repository rather than generic best practices. Quote or reference specific files, functions, queries, configuration, and code patterns wherever possible.**

Start by inspecting the repository structure and then progressively audit the application.
