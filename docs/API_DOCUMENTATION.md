# REST API Documentation
# Global Handwriting Competition Platform

## Base URL
```
https://api.handwriting-platform.com/api/v1
```

## Authentication
- JWT Bearer Token in Authorization header
- Refresh token mechanism for token renewal
- OAuth2 support for social login

---

## 1. AUTHENTICATION ENDPOINTS

### Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phoneNumber": "+254712345678",
  "country": "Kenya",
  "dateOfBirth": "2005-01-15",
  "gender": "male",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully. Verify your email.",
  "data": {
    "userId": 1,
    "email": "john@example.com",
    "verificationToken": "token_xxx"
  }
}
```

### Verify Email OTP
```
POST /auth/verify-email
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "otp": "123456"
}

Response (200):
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "userId": 1,
      "email": "john@example.com",
      "fullName": "John Doe"
    }
  }
}
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

Request:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Password Reset
```
POST /auth/forgot-password
Request: { "email": "john@example.com" }

POST /auth/reset-password
Request: { "token": "token_xxx", "newPassword": "NewPass@123" }
```

---

## 2. USER ENDPOINTS

### Get User Profile
```
GET /users/profile
Headers: Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "userId": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "profilePicture": "https://...",
    "country": "Kenya",
    "joinDate": "2026-01-15T10:00:00Z"
  }
}
```

### Update Profile
```
PUT /users/profile
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "fullName": "John Doe",
  "bio": "Handwriting enthusiast",
  "profilePicture": "base64_image_data"
}

Response (200): Updated user object
```

### Upload Profile Picture
```
POST /users/profile-picture
Headers: Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Request:
- file: [image_file]

Response (200):
{
  "success": true,
  "data": {
    "profilePictureUrl": "https://..."
  }
}
```

---

## 3. ENROLLMENT ENDPOINTS

### Get Enrollments
```
GET /enrollments
Headers: Authorization: Bearer {accessToken}
Query: ?status=approved&competition_id=1

Response (200):
{
  "success": true,
  "data": [
    {
      "enrollmentId": 1,
      "competitionId": 5,
      "category": "school",
      "level": "intermediate",
      "status": "approved",
      "enrollmentDate": "2026-06-01"
    }
  ]
}
```

### Create Enrollment
```
POST /enrollments
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "competitionId": 5,
  "category": "school",
  "level": "intermediate",
  "guardianApproval": true,
  "identityDocument": "base64_image"
}

Response (201):
{
  "success": true,
  "message": "Enrollment submitted for review",
  "data": {
    "enrollmentId": 1,
    "status": "pending"
  }
}
```

### Verify Facial Recognition
```
POST /enrollments/{enrollmentId}/verify-facial
Headers: Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Request:
- photo: [selfie_image]

Response (200):
{
  "success": true,
  "message": "Facial recognition verified",
  "data": {
    "verified": true,
    "matchScore": 0.95
  }
}
```

---

## 4. COMPETITION ENDPOINTS

### List Competitions
```
GET /competitions
Query: ?type=national&status=open&page=1&limit=20

Response (200):
{
  "success": true,
  "data": [
    {
      "competitionId": 5,
      "name": "National Handwriting 2026",
      "type": "national",
      "category": "school",
      "startDate": "2026-07-01",
      "endDate": "2026-08-31",
      "status": "open",
      "enrollmentFee": 50.00,
      "participantsCount": 125
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

### Get Competition Details
```
GET /competitions/{competitionId}

Response (200):
{
  "success": true,
  "data": {
    "competitionId": 5,
    "name": "National Handwriting 2026",
    "description": "...",
    "rules": "...",
    "prizes": [...],
    "judges": [...]
  }
}
```

---

## 5. SUBMISSION ENDPOINTS

### Submit Handwriting
```
POST /submissions
Headers: Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Request:
- competitionId: 5
- submissionType: "image" (image|pdf|scanned)
- file: [submission_file]

Response (201):
{
  "success": true,
  "data": {
    "submissionId": 100,
    "status": "processing",
    "submittedAt": "2026-06-12T10:30:00Z"
  }
}
```

### Get Submission Status
```
GET /submissions/{submissionId}
Headers: Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "submissionId": 100,
    "status": "evaluated",
    "aiGrade": {
      "score": 8.5,
      "grade": "A",
      "feedback": "Excellent consistency and alignment"
    }
  }
}
```

### List User Submissions
```
GET /submissions
Headers: Authorization: Bearer {accessToken}
Query: ?competitionId=5&status=evaluated

Response (200):
{
  "success": true,
  "data": [
    {
      "submissionId": 100,
      "competitionId": 5,
      "status": "evaluated",
      "score": 8.5
    }
  ]
}
```

---

## 6. AI EVALUATION ENDPOINTS

### Get AI Evaluation
```
GET /evaluations/{submissionId}
Headers: Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "submissionId": 100,
    "letterFormation": 8.5,
    "consistency": 8.8,
    "alignment": 8.2,
    "spacing": 8.7,
    "legibility": 9.0,
    "speed": 7.9,
    "creativity": 8.3,
    "overallScore": 8.5,
    "grade": "A",
    "feedback": "Strong overall performance",
    "improvements": [
      "Work on letter spacing consistency",
      "Practice speed drills"
    ]
  }
}
```

---

## 7. PAYMENT ENDPOINTS

### Initiate Payment
```
POST /payments/initiate
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "enrollmentId": 1,
  "amount": 50.00,
  "paymentMethod": "stripe",
  "currency": "USD"
}

Response (200):
{
  "success": true,
  "data": {
    "paymentId": "pay_xxx",
    "clientSecret": "pi_xxx",
    "status": "pending"
  }
}
```

### Confirm Payment
```
POST /payments/{paymentId}/confirm
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "paymentMethodId": "pm_xxx"
}

Response (200):
{
  "success": true,
  "data": {
    "paymentId": "pay_xxx",
    "status": "completed"
  }
}
```

---

## 8. WALLET ENDPOINTS

### Get Wallet Balance
```
GET /wallet
Headers: Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "balance": 250.50,
    "currency": "USD",
    "totalEarned": 1000.00,
    "totalWithdrawn": 749.50
  }
}
```

### Request Withdrawal
```
POST /wallet/withdraw
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "amount": 100.00,
  "paymentMethod": "bank_transfer",
  "bankDetails": {
    "accountNumber": "1234567890",
    "bankName": "Example Bank",
    "country": "Kenya"
  }
}

Response (201):
{
  "success": true,
  "data": {
    "withdrawalId": "wd_xxx",
    "status": "pending",
    "amount": 100.00
  }
}
```

### Transaction History
```
GET /wallet/transactions
Headers: Authorization: Bearer {accessToken}
Query: ?limit=20&offset=0

Response (200):
{
  "success": true,
  "data": [
    {
      "transactionId": "tx_xxx",
      "type": "reward",
      "amount": 50.00,
      "status": "completed",
      "date": "2026-06-10T15:30:00Z"
    }
  ]
}
```

---

## 9. LEARNING ENDPOINTS

### List Courses
```
GET /courses
Query: ?category=functional_cursive&level=beginner

Response (200):
{
  "success": true,
  "data": [
    {
      "courseId": 1,
      "name": "Basic Strokes Mastery",
      "category": "functional_cursive",
      "level": "beginner",
      "duration": 4
    }
  ]
}
```

### Get Course Lessons
```
GET /courses/{courseId}/lessons
Headers: Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": [
    {
      "lessonId": 1,
      "title": "Introduction to Strokes",
      "videoUrl": "https://...",
      "completed": false
    }
  ]
}
```

---

## 10. NOTIFICATION ENDPOINTS

### Get Notifications
```
GET /notifications
Headers: Authorization: Bearer {accessToken}
Query: ?unread=true&limit=20

Response (200):
{
  "success": true,
  "data": [
    {
      "notificationId": 1,
      "type": "enrollment",
      "title": "Enrollment Approved",
      "message": "You've been approved for competition",
      "read": false,
      "date": "2026-06-12T10:00:00Z"
    }
  ]
}
```

### Mark as Read
```
PUT /notifications/{notificationId}/read
Headers: Authorization: Bearer {accessToken}

Response (200):
{
  "success": true
}
```

---

## 11. ADMIN ENDPOINTS

### Create Competition
```
POST /admin/competitions
Headers: Authorization: Bearer {adminToken}
Content-Type: application/json

Request:
{
  "name": "National Handwriting 2026",
  "type": "national",
  "category": "school",
  "startDate": "2026-07-01",
  "endDate": "2026-08-31",
  "enrollmentFee": 50.00
}

Response (201): Competition object
```

### Approve Enrollment
```
PUT /admin/enrollments/{enrollmentId}/approve
Headers: Authorization: Bearer {adminToken}

Response (200):
{
  "success": true,
  "data": { enrollmentId, status: "approved" }
}
```

### Get Analytics
```
GET /admin/analytics
Headers: Authorization: Bearer {adminToken}
Query: ?startDate=2026-01-01&endDate=2026-06-12

Response (200):
{
  "success": true,
  "data": {
    "totalUsers": 5000,
    "totalRevenue": 250000.00,
    "enrollments": 1250,
    "submissions": 1100,
    "activeCompetitions": 5
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "email": "Invalid email format"
    }
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per API key
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Webhooks

### Submission Evaluated
```
POST {webhookUrl}
Event: submission.evaluated
Payload: { submissionId, score, grade }
```

### Payment Completed
```
POST {webhookUrl}
Event: payment.completed
Payload: { paymentId, enrollmentId, amount, status }
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-12  
**Status:** Active
