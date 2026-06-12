# System Architecture
# Global Handwriting Competition Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Flutter Web    │  Flutter iOS    │  Flutter Android            │
│  (Material 3)   │  (Material 3)   │  (Material 3)               │
└────────┬─────────────────────────────────────────┬──────────────┘
         │                                          │
         └──────────────────┬───────────────────────┘
                            │
         ┌──────────────────▼───────────────────────┐
         │      API GATEWAY & CDN (CloudFlare)     │
         └──────────────────┬───────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ Auth Service     │  │ User Service     │  │ Enrollment  │  │
│  │ (JWT)            │  │ (Profiles)       │  │ Service     │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
��  │ Competition Svc  │  │ Submission Svc   │  │ Payment Svc │  │
│  │ (Management)     │  │ (Upload/Validate)│  │ (Stripe/PP) │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ AI Service       │  │ Wallet Service   │  │ Notification│  │
│  │ (Evaluation)     │  │ (Rewards)        │  │ Service     │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ Learning Svc     │  │ Admin Service    │  │ Analytics   │  │
│  │ (Courses/Lessons)│  │ (Management)     │  │ Service     │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                           │                 │
    ┌────▼────────┐     ┌───────────▼─────┐   ┌──────▼──────┐
    │   MESSAGE   │     │  CACHE LAYER    │   │   FILE      │
    │   QUEUE     │     │  (Redis)        │   │   STORAGE   │
    │  (RabbitMQ) │     └─────────────────┘   │  (S3/Cloud) │
    └─────────────┘                           └─────────────┘
         │
┌────────▼──────────────────────────────────────────────────────┐
│              DATA PERSISTENCE LAYER                           ���
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐        ┌─────────────────────┐      │
│  │  PRIMARY DATABASE   │        │ REPLICA DATABASE    │      │
│  │  (PostgreSQL)       │───────▶│ (PostgreSQL)        │      │
│  │  - Users            │        │ Read-only for       │      │
│  │  - Competitions     │        │ Analytics & Reports │      │
│  │  - Submissions      │        └─────────────────────┘      │
│  │  - Wallets          │                                      │
│  │  - Transactions     │        ┌─────────────────────┐      │
│  │  - Courses          │        │ SEARCH INDEX        │      │
│  │  - Lessons          │        │ (Elasticsearch)     │      │
│  └─────────────────────┘        └───────────���─────────┘      │
│                                                               │
└───────────────────────────────────────────────────────────────┘

```

## Technology Stack

### Frontend
- **Framework:** Flutter 3.x
- **State Management:** BLoC / Provider / Riverpod
- **Architecture:** Clean Architecture + Repository Pattern
- **UI Kit:** Material Design 3
- **HTTP Client:** Dio with interceptors
- **Database:** Hive (local cache)
- **Platforms:** iOS, Android, Web

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** NestJS 10.x
- **Language:** TypeScript
- **API:** REST (GraphQL optional)
- **Authentication:** JWT + OAuth2
- **Validation:** class-validator, class-transformer

### Database & Caching
- **Primary DB:** PostgreSQL 15.x
- **Cache:** Redis 7.x
- **Search:** Elasticsearch 8.x
- **ORM:** TypeORM / Prisma
- **Migrations:** Flyway / TypeORM migrations

### AI & ML
- **Handwriting Assessment:** TensorFlow.js / PyTorch
- **OCR:** Tesseract.js / AWS Textract
- **Facial Recognition:** AWS Rekognition / Azure Face API
- **Processing:** Python 3.11 (FastAPI microservice)

### Infrastructure & DevOps
- **Cloud:** AWS / Azure / Google Cloud
- **Container:** Docker + Docker Compose
- **Orchestration:** Kubernetes
- **CI/CD:** GitHub Actions / GitLab CI
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **CDN:** CloudFlare
- **File Storage:** AWS S3 / Azure Blob Storage

### Security
- **API Gateway:** Kong / AWS API Gateway
- **SSL/TLS:** Let's Encrypt / AWS Certificate Manager
- **Secrets Management:** HashiCorp Vault / AWS Secrets Manager
- **DDoS Protection:** CloudFlare / AWS Shield

### Payment Integration
- **Payment Gateways:** Stripe, PayPal, Flutterwave (M-Pesa)
- **Webhooks:** For transaction notifications
- **PCI Compliance:** Tokenization & vault systems

## Microservices Architecture

### Service Decomposition

```
API Gateway
    │
    ├── Auth Service (Port 3001)
    │   └── JWT Token Generation
    │   └── OAuth2 Integration
    │
    ├── User Service (Port 3002)
    │   └── Profile Management
    │   └── User Preferences
    │
    ├── Enrollment Service (Port 3003)
    │   └── Category Management
    │   └── Verification (Age, Facial)
    │
    ├── Competition Service (Port 3004)
    │   └── Competition CRUD
    │   └── Category Management
    │
    ├── Submission Service (Port 3005)
    │   └── File Upload/Validation
    │   └── Duplicate Detection
    │
    ├── AI Service (Port 3006)
    │   └── Handwriting Evaluation
    │   └── Scoring Engine
    │   └── OCR Processing
    │
    ├── Payment Service (Port 3007)
    │   └── Transaction Processing
    │   └── Webhook Handling
    │
    ├── Wallet Service (Port 3008)
    │   └── Balance Management
    │   └── Withdrawal Processing
    │
    ├── Learning Service (Port 3009)
    │   └── Course Management
    │   └── Lesson Delivery
    │
    ├── Notification Service (Port 3010)
    │   └── Email/SMS/Push Notifications
    │   └── Event-driven triggers
    │
    ├── Admin Service (Port 3011)
    │   └── Dashboard Management
    │   └── Fraud Monitoring
    │
    └── Analytics Service (Port 3012)
        └── Report Generation
        └── Data Aggregation
```

## Data Flow

### User Registration Flow
```
User Input → Validation → Hash Password → Store in DB 
→ Generate OTP → Send Email/SMS → Verify OTP → Account Activation
```

### Competition Submission Flow
```
User Upload → File Validation → Duplicate Check → Store in S3 
→ Queue AI Job → AI Processing → Store Results → Notify User 
→ Admin Review → Final Scoring → Publish Results
```

### Payment Flow
```
User Initiates → Payment Service → Stripe/PayPal API 
→ Webhook Notification → Update Wallet → Send Receipt 
→ Update Transaction Log → Notify User
```

## Security Layers

1. **API Level:** Rate limiting, CORS, Input validation
2. **Authentication:** JWT with refresh tokens
3. **Authorization:** RBAC (Role-Based Access Control)
4. **Data:** Encryption at rest & in transit (TLS 1.3)
5. **Storage:** Encrypted S3 buckets, DB encryption
6. **Monitoring:** Intrusion detection, anomaly detection

## Scalability Strategy

- **Horizontal Scaling:** Stateless services in Kubernetes
- **Database Sharding:** User ID based sharding
- **Caching Layers:** Redis for frequently accessed data
- **CDN:** Static assets globally distributed
- **Load Balancing:** AWS/Azure load balancers
- **Auto-scaling:** Based on CPU/Memory metrics

## High Availability

- **Multi-region deployment**
- **Database replication across regions**
- **Active-active configuration**
- **Failover mechanisms**
- **99.99% uptime SLA**

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-12  
**Status:** Active
