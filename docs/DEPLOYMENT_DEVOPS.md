# Deployment & DevOps Architecture
# Global Handwriting Competition Platform

## DevOps Overview

This document outlines the complete deployment strategy, infrastructure setup, CI/CD pipelines, monitoring, and operational procedures for production-grade deployment across multiple cloud regions.

---

## 1. INFRASTRUCTURE AS CODE (IaC)

### Cloud Provider Setup (AWS)

```yaml
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "handwriting-platform-vpc"
  }
}

# Public Subnets (3 AZs)
resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true
}

# Private Subnets (3 AZs)
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

# Database Subnet
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

# RDS PostgreSQL
resource "aws_db_instance" "postgresql" {
  identifier     = "handwriting-platform-db"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.r6g.xlarge"
  
  allocated_storage     = 100
  storage_encrypted     = true
  backup_retention_days = 30
  
  db_name  = "handwriting_db"
  username = var.db_username
  password = random_password.db_password.result
  
  multi_az               = true
  publicly_accessible    = false
  skip_final_snapshot    = false
  final_snapshot_identifier = "handwriting-db-backup-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  tags = {
    Name = "handwriting-platform-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "handwriting-redis"
  engine               = "redis"
  node_type            = "cache.r6g.xlarge"
  num_cache_nodes      = 3
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Name = "handwriting-platform-redis"
  }
}

# S3 Bucket for File Storage
resource "aws_s3_bucket" "submissions" {
  bucket = "handwriting-submissions-${var.environment}"
  
  tags = {
    Name = "Handwriting Submissions"
  }
}

resource "aws_s3_bucket_versioning" "submissions" {
  bucket = aws_s3_bucket.submissions.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "submissions" {
  bucket = aws_s3_bucket.submissions.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

---

## 2. CONTAINERIZATION & ORCHESTRATION

### Docker Setup

```dockerfile
# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build TypeScript
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

```dockerfile
# Flutter Web Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Install Flutter
RUN apt-get update && apt-get install -y git curl unzip

# Build Flutter web
COPY . .
RUN flutter pub get
RUN flutter build web --release

# Production stage
FROM nginx:alpine

COPY --from=builder /app/build/web /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

EXPOSE 5000

CMD ["gunicorn", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "app:app"]
```

### Kubernetes Configuration

```yaml
# kubernetes/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: handwriting-platform
---

# kubernetes/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: handwriting-platform
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: handwriting-platform/backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1024Mi
        
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - backend
              topologyKey: kubernetes.io/hostname

---
# kubernetes/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: handwriting-platform
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
    name: http

---
# kubernetes/backend-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: handwriting-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 3. CI/CD PIPELINE

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main, development]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: 123456789012.dkr.ecr.us-east-1.amazonaws.com
  ECR_REPOSITORY: handwriting-platform

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgres://postgres:test_password@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgres://postgres:test_password@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Code coverage
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json

  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: SonarQube scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    
    - name: Dependency scanning
      run: npm run security:check
    
    - name: Secret scanning
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: ${{ github.event.repository.default_branch }}

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/development'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build, tag, and push image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/development'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Update EKS cluster kubeconfig
      run: |
        aws eks update-kubeconfig --region ${{ env.AWS_REGION }} \
          --name handwriting-platform-staging
    
    - name: Deploy to staging
      run: |
        kubectl set image deployment/backend backend=\
          ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }} \
          -n handwriting-platform
        kubectl rollout status deployment/backend -n handwriting-platform

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Update EKS cluster kubeconfig
      run: |
        aws eks update-kubeconfig --region ${{ env.AWS_REGION }} \
          --name handwriting-platform-production
    
    - name: Deploy to production (canary)
      run: |
        # Deploy to 10% of traffic
        kubectl set image deployment/backend backend=\
          ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }} \
          -n handwriting-platform
        kubectl rollout status deployment/backend -n handwriting-platform
    
    - name: Smoke tests
      run: npm run test:smoke
    
    - name: Complete rollout
      if: success()
      run: |
        kubectl rollout status deployment/backend -n handwriting-platform
    
    - name: Notify team
      if: always()
      run: |
        curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
          -d '{"text": "Production deployment completed"}'
```

---

## 4. MONITORING & OBSERVABILITY

### Prometheus Metrics

```yaml
# kubernetes/prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - localhost:9093

rule_files:
- /etc/prometheus/rules.yml

scrape_configs:
- job_name: 'backend'
  kubernetes_sd_configs:
  - role: pod
    namespaces:
      names:
      - handwriting-platform
  relabel_configs:
  - source_labels: [__meta_kubernetes_pod_label_app]
    action: keep
    regex: backend
  - source_labels: [__meta_kubernetes_pod_container_port_number]
    action: keep
    regex: '3000'

- job_name: 'postgres'
  static_configs:
  - targets: ['postgres-exporter:9187']

- job_name: 'redis'
  static_configs:
  - targets: ['redis-exporter:9121']
```

### Alert Rules

```yaml
# prometheus-rules.yml
groups:
- name: application
  rules:
  - alert: HighErrorRate
    expr: rate(errors_total[5m]) > 0.05
    for: 5m
    annotations:
      summary: "High error rate detected"
  
  - alert: PodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    annotations:
      summary: "Pod crash looping detected"
  
  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
    for: 5m
    annotations:
      summary: "High memory usage detected"

- name: database
  rules:
  - alert: PostgreSQLDown
    expr: up{job="postgres"} == 0
    for: 1m
    annotations:
      summary: "PostgreSQL is down"
  
  - alert: HighConnections
    expr: pg_stat_activity_count > 80
    for: 5m
    annotations:
      summary: "High database connections"

- name: payment
  rules:
  - alert: PaymentFailureRate
    expr: rate(payments_failed_total[5m]) > 0.1
    for: 5m
    annotations:
      summary: "High payment failure rate"
```

### Logging Stack (ELK)

```yaml
# kubernetes/elasticsearch-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: elasticsearch-config
  namespace: logging
data:
  elasticsearch.yml: |
    cluster.name: handwriting-logs
    node.name: ${HOSTNAME}
    discovery.type: zen
    discovery.zen.ping.unicast.hosts: ["elasticsearch-0.elasticsearch", "elasticsearch-1.elasticsearch", "elasticsearch-2.elasticsearch"]
---

# kubernetes/fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>
    
    <filter kubernetes.**>
      @type kubernetes_metadata
      kubernetes_url "#{ENV['FLUENT_FILTER_KUBERNETES_URL']}"
      kubernetes_ca_file /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      kubernetes_token_file /var/run/secrets/kubernetes.io/serviceaccount/token
      kubernetes_verify_ssl true
      kubernetes_namespace_name handwriting-platform
    </filter>
    
    <match **>
      @type elasticsearch
      @id output_elasticsearch
      @log_level info
      include_tag_key true
      host elasticsearch
      port 9200
      path_prefix handwriting-logs
      logstash_format true
      logstash_prefix handwriting
      logstash_dateformat %Y.%m.%d
      include_timestamp false
      type_name _doc
      <buffer tag,time>
        timekey 1d
        timekey_wait 10m
        timekey_use_utc true
      </buffer>
    </match>
```

---

## 5. DATABASE MIGRATIONS

### Flyway Setup

```
migrations/
├── V1__initial_schema.sql
├── V2__add_enrollments_table.sql
├── V3__add_submissions_table.sql
├── V4__add_ai_grades_table.sql
├── V5__add_indexes.sql
└── V6__add_audit_logs.sql
```

### Migration Script

```sql
-- V1__initial_schema.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);

-- Add more tables...
```

---

## 6. BACKUP & DISASTER RECOVERY

### Backup Strategy

```
Daily Automated Backups:
├── Time: 02:00 UTC (off-peak)
├── Retention: 30 days
├── Location: AWS S3 (cross-region replication)
├── Encryption: AES-256
└── Testing: Weekly restore tests

Weekly Full Backups:
├── Day: Sunday 02:00 UTC
├── Retention: 12 weeks
└── Verification: Automated integrity checks

Monthly Archive:
├── Long-term retention: 2 years
├── Location: AWS Glacier
└── Access: Requires approval
```

### Disaster Recovery Plan

```
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 1 hour

Recovery Procedures:
1. Detection & Assessment (15 min)
2. Activation of recovery infrastructure (30 min)
3. Database restoration (2 hours)
4. Application deployment (30 min)
5. Verification & validation (30 min)
6. Traffic failover (15 min)

Testing:
├── Quarterly: Full DR drill
├── Monthly: Backup restoration test
└── Continuous: Automated health checks
```

---

## 7. SCALING STRATEGY

### Horizontal Scaling

```
Load Balancer Distribution:
├── Weighted round-robin
├── Least connections
├── Geo-based routing
└── Health-based routing

Auto-Scaling Triggers:
├── CPU > 70% for 5 minutes → Scale up
├── Memory > 80% for 5 minutes → Scale up
├── Requests per second > 1000 → Scale up
├── CPU < 30% for 15 minutes → Scale down
└── Memory < 50% for 15 minutes → Scale down

Min Replicas: 3
Max Replicas: 20
Scale-up rate: +2 pods per minute
Scale-down rate: -1 pod per minute
```

---

## 8. ROLLBACK & HEALTH CHECKS

### Deployment Health Checks

```yaml
Liveness Probe:
- Path: /health
- Interval: 10 seconds
- Timeout: 3 seconds
- Failure threshold: 3

Readiness Probe:
- Path: /ready
- Interval: 5 seconds
- Timeout: 3 seconds
- Failure threshold: 3

Startup Probe:
- Path: /startup
- Interval: 10 seconds
- Failure threshold: 30 (300 seconds total)
```

### Rollback Procedure

```
If deployment fails:
1. Detect failure (health check failures)
2. Automatic rollback to previous version
3. Notify team
4. Investigation in staging
5. Retry after fix
```

---

## 9. ENVIRONMENT CONFIGURATION

### Environment Variables

```bash
# .env.production
NODE_ENV=production
APP_NAME=handwriting-competition-platform
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:pass@db.rds.amazonaws.com:5432/handwriting_db
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000

# Redis
REDIS_URL=redis://cache.elasticache.amazonaws.com:6379
REDIS_DB=0

# JWT
JWT_SECRET=<secure-secret-from-vault>
JWT_EXPIRY=900
REFRESH_TOKEN_EXPIRY=604800

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<from-vault>
AWS_SECRET_ACCESS_KEY=<from-vault>
AWS_S3_BUCKET=handwriting-submissions-prod

# Payment
STRIPE_SECRET_KEY=<from-vault>
STRIPE_PUBLISHABLE_KEY=<public-key>
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=<from-vault>

# Email
SMTP_HOST=ses.amazonaws.com
SMTP_PORT=587
SMTP_USER=<from-vault>
SMTP_PASSWORD=<from-vault>

# Firebase
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_PRIVATE_KEY=<from-vault>
FIREBASE_CLIENT_EMAIL=<service-account-email>

# Monitoring
SENTRY_DSN=<from-vault>
LOG_LEVEL=info
```

---

## 10. OPERATIONAL PROCEDURES

### Deployment Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] Security scan passed
- [ ] Staging deployment successful
- [ ] Smoke tests passed
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] On-call team notified
- [ ] Maintenance window scheduled
- [ ] Backup verified

### Post-Deployment Verification

```
1. Health endpoints responding
2. API responses within SLA
3. Database connectivity confirmed
4. External services accessible
5. Monitoring dashboards green
6. No error spikes detected
7. User reports monitored
8. Performance metrics normal
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-12  
**Status:** Active
