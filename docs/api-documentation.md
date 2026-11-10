# RESTful API Documentation & Endpoint Specification

## Base URL
- **Local Development**: `http://localhost:8000/api`
- **Docker Production**: `http://localhost/api`
- **Kubernetes NodePort**: `http://<node-ip>:30800/api`
- **Interactive Swagger UI**: `http://localhost:8000/docs`

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Dr. Sarah Mitchell",
  "email": "sarah@academy.edu",
  "password": "password123",
  "role": "provider",
  "organization": "National Academy of Technology"
}
```
- **Response**: `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Dr. Sarah Mitchell",
    "email": "sarah@academy.edu",
    "role": "provider",
    "organization": "National Academy of Technology",
    "is_active": true,
    "created_at": "2026-11-09T12:00:00Z"
  }
}
```

### 1.2 User Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@credentialverify.com",
  "password": "password123"
}
```
- **Response**: `200 OK` (returns JWT Bearer token and user profile)

### 1.3 Get Current User Session
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Access**: Authenticated (Bearer Token)
- **Response**: `200 OK`

---

## 2. User Management Endpoints

### 2.1 List All Users
- **Method**: `GET`
- **Endpoint**: `/api/users?role=learner&search=Alex`
- **Access**: Admin only
- **Response**: `200 OK` (Array of user records)

### 2.2 Update User
- **Method**: `PUT`
- **Endpoint**: `/api/users/{id}`
- **Access**: Admin or Self
- **Request Body**:
```json
{
  "name": "Alex Mercer, M.Sc.",
  "organization": "Stanford University Alumni",
  "is_active": true
}
```
- **Response**: `200 OK`

### 2.3 Delete User
- **Method**: `DELETE`
- **Endpoint**: `/api/users/{id}`
- **Access**: Admin only
- **Response**: `204 No Content`

---

## 3. Course Management Endpoints

### 3.1 List Courses
- **Method**: `GET`
- **Endpoint**: `/api/courses?category=Cloud%20%26%20DevOps&status_filter=approved`
- **Access**: Public
- **Response**: `200 OK`

### 3.2 Create Course
- **Method**: `POST`
- **Endpoint**: `/api/courses`
- **Access**: Admin or Course Provider
- **Request Body**:
```json
{
  "title": "Cloud Architecture & Kubernetes Deployment",
  "description": "Master enterprise cloud engineering and orchestration.",
  "category": "Cloud & DevOps",
  "difficulty": "Advanced",
  "duration_hours": 36,
  "passing_percentage": 75.0,
  "thumbnail_url": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9"
}
```
- **Response**: `201 Created`

### 3.3 Add Syllabus Module
- **Method**: `POST`
- **Endpoint**: `/api/courses/{course_id}/modules`
- **Access**: Course Provider (Owner) or Admin
- **Request Body**:
```json
{
  "title": "Module 1: Docker Containers & Multi-stage Builds",
  "description": "Container optimization, security scanning, and registries.",
  "content_type": "document",
  "content_url": "https://kubernetes.io/docs/",
  "reading_time_mins": 25,
  "order_index": 1
}
```
- **Response**: `201 Created`

### 3.4 Approve / Reject Course
- **Method**: `PUT`
- **Endpoints**: `/api/courses/{id}/approve` | `/api/courses/{id}/reject`
- **Access**: Admin only
- **Response**: `200 OK`

---

## 4. Enrollment & Progress Endpoints

### 4.1 Enroll in Course
- **Method**: `POST`
- **Endpoint**: `/api/enrollments`
- **Access**: Authenticated Learner
- **Request Body**: `{ "course_id": 1 }`
- **Response**: `201 Created`

### 4.2 Update Module Progress
- **Method**: `PUT`
- **Endpoint**: `/api/enrollments/{enrollment_id}/progress`
- **Access**: Enrolled Student
- **Request Body**: `{ "module_id": 1, "completed": true }`
- **Response**: `200 OK` (returns updated `progress_percentage` and `status`)

---

## 5. Assessment & Examination Endpoints

### 5.1 Create Assessment
- **Method**: `POST`
- **Endpoint**: `/api/assessments`
- **Access**: Provider or Admin
- **Request Body**:
```json
{
  "course_id": 1,
  "title": "Kubernetes Certification Exam",
  "passing_score": 75.0,
  "time_limit_mins": 25,
  "questions": [
    {
      "question_text": "Which Kubernetes resource guarantees a copy of a pod per worker node?",
      "options": ["Deployment", "DaemonSet", "StatefulSet", "ReplicaSet"],
      "correct_option_index": 1,
      "explanation": "DaemonSets ensure exactly one pod per matching node."
    }
  ]
}
```

### 5.2 Submit Assessment (Auto-Grading & Auto-Credentialing)
- **Method**: `POST`
- **Endpoint**: `/api/assessments/{assessment_id}/submit`
- **Access**: Enrolled Learner
- **Request Body**:
```json
{
  "answers": {
    "1": 1,
    "2": 2
  }
}
```
- **Response**: `200 OK`
```json
{
  "id": 12,
  "score": 100.0,
  "total_questions": 2,
  "passed": true,
  "submitted_at": "2026-11-09T18:00:00Z",
  "certificate_eligible": true,
  "certificate_id": "CERT-2026-98124",
  "verification_id": "VFY-8A7B6C5D4E3F"
}
```

---

## 6. Certificate Ledger & Verification Endpoints

### 6.1 Public Credential Verification
- **Method**: `GET`
- **Endpoint**: `/api/verify/{verification_id}`
- **Access**: Public (No authentication required)
- **Sample URL**: `/api/verify/VFY-8A7B6C5D4E3F`
- **Response (Valid)**: `200 OK`
```json
{
  "verification_id": "VFY-8A7B6C5D4E3F",
  "certificate_id": "CERT-2026-98124",
  "status": "valid",
  "learner_name": "Alex Mercer",
  "course_name": "Cloud Architecture & Kubernetes Orchestration",
  "provider_name": "Cloud DevOps Institute",
  "completion_date": "2026-11-09T12:00:00Z",
  "issue_date": "2026-11-09T12:00:00Z",
  "score": 100.0,
  "verified_at": "2026-11-09T18:30:00Z"
}
```
- **Response (Revoked)**: `200 OK`
```json
{
  "verification_id": "VFY-9REVOKED001",
  "certificate_id": "CERT-2026-66521",
  "status": "revoked",
  "revocation_reason": "Academic integrity violation: Plagiarized practical lab submission.",
  "revoked_at": "2026-11-07T10:00:00Z",
  "verified_at": "2026-11-09T18:30:00Z"
}
```

### 6.2 Download Official PDF Certificate
- **Method**: `GET`
- **Endpoint**: `/api/certificates/{id}/download`
- **Access**: Public
- **Response**: `200 OK` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="CERT-2026-98124.pdf"`

### 6.3 Revoke Certificate
- **Method**: `PUT`
- **Endpoint**: `/api/certificates/{id}/revoke`
- **Access**: Course Provider (Owner) or Admin
- **Request Body**:
```json
{
  "revocation_reason": "Academic integrity violation during audit."
}
```
- **Response**: `200 OK`

---

## 7. Mandatory Reports Endpoints

| Endpoint | Method | Output | Description |
|:---|:---|:---|:---|
| `/api/reports/certificate-issuance` | `GET` | JSON | Total issued, valid, revoked, and monthly velocity |
| `/api/reports/course-completion` | `GET` | JSON | Total enrolled, completed, and completion rates per course |
| `/api/reports/verification-requests` | `GET` | JSON | Employer background verification history & results |
| `/api/reports/learner-progress` | `GET` | JSON | Student progress %, completed modules, exam scores |
| `/api/reports/export/csv/{report_type}` | `GET` | CSV | Direct streaming CSV export for any of the 4 reports |

