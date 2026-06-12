# Database Schema
# Global Handwriting Competition Platform

## Entity Relationship Diagram (ERD)

```
┌──────────────┐         ┌──────────────┐
│   USERS      │─────────│ ENROLLMENTS  │
└──────────────┘         └──────────────┘
       │                        │
       │                        │
       ├──────────────┬─────────┤
       │              │         │
┌──────▼──────┐  ┌────▼──────┐ │
│  PROFILES   │  │ IDENTITIES│ │
└─────────────┘  └───────────┘ │
                                │
                    ┌───────────┴──────┐
                    │                  │
            ┌───────▼────────┐  ┌──────▼─────────┐
            │ COMPETITIONS   │  │ SUBMISSIONS    │
            └────────────────┘  └────────────────┘
                    │                    │
                    │                    │
            ┌───────▼────────┐  ┌──────▼─────────┐
            │   COURSES      │  │  AI_GRADES     │
            └────────────────┘  └────────────────┘
                    │                    │
                    │                    ▼
            ┌───────▼────────┐  ┌──────────────┐
            │   LESSONS      │  │ HUMAN_GRADES │
            └────────────────┘  └──────────────┘
                                        │
                    ┌───────────────────┴──────┐
                    │                          │
            ┌───────▼────────┐     ┌──────────▼──────┐
            │   WALLETS      │     │ TRANSACTIONS    │
            └────────────────┘     └─────────────────┘
                    │
            ┌───────▼────────┐
            │ ADVERTISEMENTS │
            └────────────────┘
```

## Table Schemas

### 1. USERS
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    country VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_blocked BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_country ON users(country);
```

### 2. PROFILES
```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    social_links JSONB,
    notification_preferences JSONB,
    privacy_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. IDENTITIES
```sql
CREATE TABLE identities (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    id_type VARCHAR(50), -- 'national_id', 'passport', 'driver_license'
    id_number VARCHAR(100),
    id_image_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, id_type)
);
```

### 4. ENROLLMENTS
```sql
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    competition_id INT NOT NULL,
    category VARCHAR(100), -- 'school', 'general', 'english_somali'
    level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    enrollment_fee DECIMAL(10, 2),
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    age_verified BOOLEAN DEFAULT FALSE,
    guardian_approval BOOLEAN DEFAULT FALSE,
    facial_recognition_verified BOOLEAN DEFAULT FALSE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    UNIQUE(user_id, competition_id)
);

CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
```

### 5. COMPETITIONS
```sql
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- 'national', 'regional', 'international'
    category VARCHAR(100),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    submission_deadline TIMESTAMP NOT NULL,
    max_participants INT,
    enrollment_fee DECIMAL(10, 2),
    status ENUM('draft', 'open', 'closed', 'completed') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_type ON competitions(type);
```

### 6. COURSES
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'functional_cursive', 'artistic'
    level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    duration_weeks INT,
    instructor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);
```

### 7. LESSONS
```sql
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    lesson_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

### 8. ASSIGNMENTS
```sql
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    lesson_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sample_image_url TEXT,
    submission_deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);
```

### 9. SUBMISSIONS
```sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id INT NOT NULL,
    competition_id INT NOT NULL,
    submission_type VARCHAR(50), -- 'image', 'pdf', 'scanned'
    file_url TEXT NOT NULL,
    file_size_bytes INT,
    image_quality_score DECIMAL(5, 2),
    duplicate_detected BOOLEAN DEFAULT FALSE,
    authenticity_verified BOOLEAN DEFAULT FALSE,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('submitted', 'processing', 'evaluated', 'rejected') DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_user ON submissions(user_id);
```

### 10. AI_GRADES
```sql
CREATE TABLE ai_grades (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL UNIQUE,
    letter_formation_score DECIMAL(5, 2),
    consistency_score DECIMAL(5, 2),
    alignment_score DECIMAL(5, 2),
    spacing_score DECIMAL(5, 2),
    legibility_score DECIMAL(5, 2),
    speed_score DECIMAL(5, 2),
    creativity_score DECIMAL(5, 2),
    overall_score DECIMAL(5, 2) NOT NULL,
    grade CHAR(2), -- 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'
    feedback TEXT,
    improvement_suggestions JSONB,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_grades_score ON ai_grades(overall_score);
```

### 11. HUMAN_GRADES
```sql
CREATE TABLE human_grades (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL,
    judge_id INT NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    grade CHAR(2),
    comments TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES users(id)
);
```

### 12. WALLETS
```sql
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    total_earned DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 13. TRANSACTIONS
```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    wallet_id INT NOT NULL,
    transaction_type VARCHAR(50), -- 'deposit', 'withdrawal', 'reward', 'refund'
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50), -- 'bank_transfer', 'stripe', 'paypal', 'mpesa'
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    reference_number VARCHAR(100),
    description TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
```

### 14. ADVERTISEMENTS
```sql
CREATE TABLE advertisements (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    advertiser_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT,
    position VARCHAR(50), -- 'banner', 'featured', 'sidebar'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status ENUM('active', 'inactive', 'scheduled') DEFAULT 'inactive',
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (advertiser_id) REFERENCES users(id)
);
```

### 15. CERTIFICATES
```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    competition_id INT,
    certificate_type VARCHAR(50), -- 'completion', 'achievement', 'winner'
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id)
);
```

### 16. NOTIFICATIONS
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50), -- 'enrollment', 'result', 'reward', 'promotion'
    title VARCHAR(255),
    message TEXT,
    channel VARCHAR(50), -- 'email', 'sms', 'push', 'in_app'
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### 17. AUDIT_LOGS
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id INT,
    changes JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

## Key Constraints

- All primary keys are auto-incrementing SERIAL
- Foreign keys cascade on delete (except user deletions)
- Email and username are globally unique
- One enrollment per user per competition
- One identity per user per type
- Soft deletes supported via deleted_at column

## Indexing Strategy

- Primary lookup indexes on foreign keys
- Status-based indexes for filtering
- Date-based indexes for time-range queries
- Unique indexes for preventing duplicates

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-12  
**Status:** Active
