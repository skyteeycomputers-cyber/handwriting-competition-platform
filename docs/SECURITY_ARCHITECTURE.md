# Security Architecture
# Global Handwriting Competition Platform

## Security Overview

This document outlines the complete security architecture for the Global Handwriting Competition Platform, ensuring GDPR compliance, data protection, fraud prevention, and secure payment processing.

---

## 1. AUTHENTICATION & AUTHORIZATION

### JWT Token Strategy

```
User Login
    ↓
Generate Access Token (15 min expiry)
Generate Refresh Token (7 days expiry)
    ↓
Return Tokens to Client
    ↓
Client uses Access Token for API calls
    ↓
Token Expires → Use Refresh Token
    ↓
Get New Access Token
```

### Token Structure

```json
Access Token:
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "role": "user",
  "permissions": ["read:submissions", "write:submissions"],
  "iat": 1686524400,
  "exp": 1686525300
}

Refresh Token:
{
  "sub": "user_uuid",
  "type": "refresh",
  "iat": 1686524400,
  "exp": 1689116400
}
```

### Role-Based Access Control (RBAC)

```
Roles:
├── SUPER_ADMIN
│   └── Full platform access, user management, financial reports
├── ADMIN
│   └── Competition management, enrollment approval, analytics
├── JUDGE
│   └── Manual grading, submission review
├── EDUCATOR
│   └── Course creation, student management
├── USER
│   └── Registration, enrollment, submission, learning
└── GUEST
    └── View-only access (limited)

Permissions:
├── read:users
├── write:users
├── delete:users
├── read:competitions
├── write:competitions
├── manage:payments
├── manage:wallets
├── manage:ai_grades
└── view:analytics
```

### Multi-Factor Authentication (MFA)

```
Optional for users:
1. Email OTP (Default)
2. SMS OTP
3. Authenticator App (TOTP)

Implementation:
├── Generate 6-digit OTP
├── Store hash (SHA-256) in Redis
├── Set 5-minute expiry
├── Rate limit: 5 attempts
└── Lock account after 10 failed attempts
```

---

## 2. DATA ENCRYPTION

### Encryption in Transit

```
HTTPS/TLS 1.3
├── Certificate: Let's Encrypt (auto-renewed)
├── HSTS (HTTP Strict Transport Security) enabled
├── Certificate pinning on mobile apps
└── API Gateway enforces SSL/TLS
```

### Encryption at Rest

```
Database Level:
├── PostgreSQL native encryption
├── Encrypted columns for sensitive data
└── Column-level encryption for:
    ├── Passwords (bcrypt + salt)
    ├── Passwords (argon2 + salt)
    ├── Social security numbers (AES-256)
    ├── Bank details (AES-256)
    └── Facial recognition data (AES-256)

File Storage (S3):
├── Server-side encryption (SSE-S3)
├── Bucket encryption enabled
└── Access logging enabled
```

### Hashing Strategy

```
Passwords:
├── Algorithm: Argon2id
├── Memory: 65536 KB
├── Iterations: 3
├── Parallelism: 4

Sensitive Data:
├── Algorithm: SHA-256
├── Salt: Generated per entry
├── Iterations: 100,000 (PBKDF2)
```

---

## 3. DATA PROTECTION & GDPR COMPLIANCE

### Data Minimization

```
Collect only necessary data:
├── User registration: Name, email, phone, DOB, country
├── Competition enrollment: ID, facial photo (temporary)
├── Submissions: Handwriting samples only
└── Payments: Tokenized card data (never stored)
```

### Data Retention Policy

```
User Data:
├── Active user: Retained during account active status
├── Inactive (6 months): Retained + notification
├── Account deletion: Deleted after 30 days (grace period)

Submission Data:
├── For competition: Retained for 2 years
├── After completion: Available for user download
├── Deletion: Upon user request

Payment Data:
├── Transaction logs: Retained for 7 years (compliance)
├── Card data: Never stored (PCI-DSS via Stripe)
├── Payment tokens: Auto-expire after 6 months

Audit Logs:
├── Retained: 2 years
├── Encrypted: Yes
└── Immutable: Yes
```

### Right to Data Portability

```
Users can request:
1. Data Export (JSON/CSV format)
   - User profile
   - Submission history
   - Transaction records
   - Learning progress

2. Data Deletion (GDPR Article 17)
   - Automatic after 30-day grace period
   - Irreversible for non-dependent data
   - Retained only as required by law
```

### Privacy by Design

```
├── Anonymize test data in development
├── PII masked in logs
├── No PII in error messages
├── Minimal data in analytics
├── User consent required for:
│   ├── Cookies
│   ├── Push notifications
│   ├── Email marketing
│   └── Data analytics
└── Clear privacy policy & terms
```

---

## 4. FACIAL RECOGNITION SECURITY

### Facial Recognition Workflow

```
Enrollment:
1. User captures selfie
2. AWS Rekognition compares with ID document
3. Similarity score: 90%+ for match
4. Biometric data stored encrypted
5. Consent verification logged

Verification:
1. User submits handwriting + facial verification
2. Compare with stored enrollment photo
3. Real-time liveness check (prevents spoofing)
4. Failure triggers manual review
```

### Biometric Data Protection

```
Storage:
├── Encrypted (AES-256)
├── Separate secure vault
├── Access-controlled (admins only)
├── Audit logged

Retention:
├── During active enrollment: Retained
├── After withdrawal/rejection: 30-day hold
├── Upon deletion: Permanent removal

Compliance:
├── GDPR Article 9 (special data)
├── Explicit consent required
├── Limited purpose use
└── No third-party sharing
```

### Anti-Spoofing Measures

```
Liveness Detection:
├── Challenge-response (blink, smile)
├── 3D depth detection (if device supports)
├── Motion analysis
├── Texture analysis (prevents photos)

Fraud Patterns:
├── Multiple enrollments: 1 per person
├── Same device attempts: Rate-limited
├── Geographic anomalies: Flagged
└── Session validation: Device fingerprinting
```

---

## 5. ANTI-FRAUD & ANTI-CHEATING

### Submission Authentication

```
Before Submission:
├── Device verification
├── Geolocation check
├── Time-zone validation
├── VPN/Proxy detection
└── Device fingerprinting

During Submission:
├── Image quality analysis
├── Timestamp validation
├── Metadata verification
├── File integrity check
└── Duplicate detection
```

### AI-Based Fraud Detection

```
Anomaly Detection:
├── Sudden score improvements
├── Writing style inconsistencies
├── Impossible handwriting speeds
├── Device switching during competition
└── Multiple device submissions

Actions:
├── Score below threshold: Flag for manual review
├── High confidence: Admin notification
├── Pattern match: Account suspension
└── Evidence: Audit log maintained
```

### Duplicate Submission Detection

```
Image Analysis:
├── Hash comparison (MD5/SHA-256)
├── Perceptual hashing (p-hash)
├── SIFT feature matching
└── Similarity threshold: 85%+

Prevention:
├── One submission per competition
├── Re-submission: Replaces previous (not adds)
├── Version history maintained
└── Duplicate flagged for review
```

---

## 6. PAYMENT SECURITY

### PCI-DSS Compliance

```
Level 1 Compliance through:
├── Stripe/PayPal (third-party processors)
├── No direct credit card storage
├── Tokenization for recurring payments
└── Regular security audits
```

### Payment Flow

```
User Initiates Payment
    ↓
Create Stripe/PayPal session
    ↓
User redirected to provider
    ↓
Card data entered on provider's secure form
    ↓
Token returned to backend
    ↓
Store token (encrypted)
    ↓
Webhook validation (signature verification)
    ↓
Update wallet balance
    ↓
Send receipt & confirmation
```

### Webhook Security

```
Verification:
├── Signature verification (HMAC-SHA256)
├── Timestamp validation (within 5 minutes)
├── Replay attack prevention (idempotency keys)
├── SSL certificate validation
└── IP whitelisting (provider IPs only)

Error Handling:
├── Webhook retries: 3 attempts (exponential backoff)
├── Failed webhooks: Logged & alerted
├── Manual reconciliation: Daily
└── Disputes: Recorded & investigated
```

### Fraud Prevention

```
Transaction Rules:
├── Velocity checks (limit per user/card)
├── Amount thresholds (flag high values)
├── Currency mismatch detection
├── Time-zone anomalies
└── Geographic impossibilities

3D Secure:
├── Enabled for high-risk transactions
├── User authentication via provider
├── Chargeback protection
└── Enhanced security layer
```

---

## 7. API SECURITY

### Rate Limiting & DDoS Protection

```
Rate Limits:
├── 100 requests/minute per user
├── 1000 requests/hour per API key
├── 10000 requests/day per IP
└── Burst allowance: 150% of limit

DDoS Protection:
├── CloudFlare DDoS mitigation
├── IP reputation blocking
├── Geographic blocking (if needed)
├── Bot detection (reCAPTCHA v3)
└── Traffic analysis & anomalies
```

### API Authentication

```
Request Flow:
1. User provides credentials → JWT token
2. Token included in Authorization header
3. API Gateway validates signature
4. Claims verified (expiry, permissions)
5. Request routed to service
6. Service validates token again
7. Access control enforced
```

### Input Validation & Sanitization

```
Validation:
├── Type checking (string, number, etc.)
├── Length limits (prevent buffer overflow)
├── Format validation (email, phone, etc.)
├── SQL injection prevention (parameterized queries)
├── XSS prevention (HTML escaping)
└── CSRF tokens (state-changing operations)

Sanitization:
├── Remove special characters
├── Encode HTML entities
├── Escape quotes & backslashes
└── Validate file uploads (type, size)
```

---

## 8. INFRASTRUCTURE SECURITY

### Network Architecture

```
Internet
    ↓
CloudFlare CDN (DDoS protection)
    ↓
AWS API Gateway (rate limiting, authentication)
    ↓
VPC (Virtual Private Cloud)
    ├── Public Subnet (Load Balancer)
    ├── Private Subnet (Application Servers)
    └── Private Subnet (Database)
    ↓
NACLs & Security Groups (firewall rules)
```

### Database Security

```
Access Control:
├── Separate DB user per service
├── Principle of least privilege
├── No root password sharing
├── VPC endpoint (no internet access)
└── Encryption key management (AWS KMS)

Backup & Disaster Recovery:
├── Automated daily backups
├── Multi-region replication
├── Point-in-time recovery (35 days)
├── Backup encryption
├── Tested restores (monthly)
└── RTO: 4 hours, RPO: 1 hour
```

### Secrets Management

```
AWS Secrets Manager:
├── Database credentials
├── API keys
├── JWT signing keys
├── Payment provider tokens
├── Third-party service credentials

Rotation:
├── Automatic every 30 days
├── Zero-downtime rotation
├── Version history maintained
├── Access audit logging
└── Breach detection alerts
```

---

## 9. INCIDENT RESPONSE

### Security Incident Response Plan

```
Detection
    ↓ (Automated alerts + manual detection)
Containment (within 30 minutes)
    ↓ Isolate affected systems
    ↓ Revoke compromised credentials
    ↓ Scale up logging
    ↓ Notify security team
    ↓
Investigation (ongoing)
    ↓ Analyze logs & audit trails
    ↓ Determine scope & impact
    ↓ Identify root cause
    ↓
Notification (within 72 hours for breaches)
    ↓ Notify affected users
    ↓ Regulatory bodies (if required)
    ↓ Credit monitoring (if PII exposed)
    ↓
Recovery & Remediation
    ↓ Patch vulnerabilities
    ↓ Restore from backups
    ↓ Verify integrity
    ↓
Post-Incident Review
    ↓ Root cause analysis
    ↓ Process improvements
    ↓ Staff training updates
    ↓ Public communication
```

### Monitoring & Alerting

```
Tools:
├── CloudWatch (AWS)
├── Prometheus + Grafana (metrics)
├── ELK Stack (logs)
├── Sentry (error tracking)
└── Snyk (vulnerability scanning)

Alerts:
├── Failed authentication attempts (>5)
├── Unusual API activity
├── Database connection anomalies
├── Payment processing failures
├── File system changes
├── CPU/Memory spikes
└── Security group modifications
```

---

## 10. COMPLIANCE & AUDITING

### Audit Logging

```
Logged Events:
├── User login/logout
├── Data access (who, what, when)
├── Permission changes
├── Payment transactions
├── Submission evaluations
├── Admin actions
├── API calls (sensitive endpoints)
└── System configuration changes

Log Details:
├── Timestamp (UTC, millisecond precision)
├── User ID / Service ID
├── Action performed
├── Resource affected
├── Status (success/failure)
├── IP address
├── User agent
└── Result/changes made

Retention:
├── Active logs: 30 days (searchable)
├── Archive: 2 years (encrypted storage)
├── Immutable: Yes (no modification)
└── Access: Restricted (audit team only)
```

### Security Certifications & Standards

```
Target Compliance:
├── GDPR (EU data protection)
├── CCPA (California privacy)
├── PCI-DSS (payment processing)
├── ISO 27001 (information security)
├── SOC 2 Type II (controls & processes)
└── COPPA (children's privacy, if applicable)

Regular Assessments:
├── Quarterly: Vulnerability scanning
├── Semi-annually: Penetration testing
├── Annually: Full security audit
└── Continuous: Code scanning & reviews
```

---

## 11. SECURITY BEST PRACTICES

### Development Security

```
Secure Coding:
├── OWASP Top 10 mitigation
├── Static code analysis (SonarQube)
├── Dependency scanning (Snyk, Dependabot)
├── Code review (peer review mandatory)
├── Secure defaults
└── Principle of least privilege

Deployment:
├── Automated security checks in CI/CD
├── Container scanning (Docker images)
├── Infrastructure-as-code scanning
├── Secret scanning (no credentials in repo)
└── Production deployment verification
```

### Employee Security

```
├── Security awareness training (annual)
├── Background checks (team members)
├── NDA & confidentiality agreements
├── Access reviews (quarterly)
├── Secure communication protocols
├── Device encryption (all company devices)
├── VPN requirement (remote work)
└── Incident reporting training
```

---

## Security Checklist for Deployment

- [ ] HTTPS/TLS enabled
- [ ] JWT tokens configured
- [ ] Database encryption enabled
- [ ] Secrets not in code/configs
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Input validation enabled
- [ ] Logging & monitoring active
- [ ] Backup tested & verified
- [ ] Incident response plan documented
- [ ] Security audit completed
- [ ] Penetration test passed
- [ ] GDPR compliance verified
- [ ] PCI-DSS compliance verified

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-12  
**Status:** Active
