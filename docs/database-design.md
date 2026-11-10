# Database Design & Relational Schema Specification

## 1. Relational Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ COURSES : "authors/provides"
    USERS ||--o{ ENROLLMENTS : "registers_for"
    USERS ||--o{ ASSESSMENT_RESULTS : "completes"
    USERS ||--o{ CERTIFICATES : "awarded_to"
    USERS ||--o{ CERTIFICATES : "issued_by"
    
    COURSES ||--o{ COURSE_MODULES : "contains"
    COURSES ||--o{ ENROLLMENTS : "has_students"
    COURSES ||--o{ ASSESSMENTS : "evaluates"
    COURSES ||--o{ CERTIFICATES : "certifies"

    ASSESSMENTS ||--o{ ASSESSMENT_QUESTIONS : "includes"
    ASSESSMENTS ||--o{ ASSESSMENT_RESULTS : "produces"

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        string organization
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    COURSES {
        int id PK
        string title
        text description
        int provider_id FK
        string category
        string difficulty
        int duration_hours
        float passing_percentage
        string status
        string thumbnail_url
        timestamp created_at
        timestamp updated_at
    }

    COURSE_MODULES {
        int id PK
        int course_id FK
        string title
        text description
        string content_type
        string content_url
        int reading_time_mins
        int order_index
        timestamp created_at
    }

    ENROLLMENTS {
        int id PK
        int user_id FK
        int course_id FK
        string status
        float progress_percentage
        text completed_modules
        timestamp enrolled_at
        timestamp completed_at
    }

    ASSESSMENTS {
        int id PK
        int course_id FK
        string title
        text description
        float passing_score
        int time_limit_mins
        timestamp created_at
    }

    ASSESSMENT_QUESTIONS {
        int id PK
        int assessment_id FK
        text question_text
        json options
        int correct_option_index
        text explanation
    }

    ASSESSMENT_RESULTS {
        int id PK
        int assessment_id FK
        int user_id FK
        float score
        int total_questions
        boolean passed
        timestamp submitted_at
    }

    CERTIFICATES {
        int id PK
        string certificate_id UK
        string verification_id UK
        int learner_id FK
        int course_id FK
        int provider_id FK
        float score
        timestamp issue_date
        timestamp completion_date
        string status
        text revocation_reason
        timestamp revoked_at
        text qr_code_data
    }

    VERIFICATION_REQUESTS {
        int id PK
        string request_id UK
        string requester_name
        string requester_email
        string requester_organization
        string certificate_id
        string status
        text notes
        timestamp verified_at
        timestamp created_at
    }

    SYSTEM_SETTINGS {
        int id PK
        string key UK
        text value
        string description
        timestamp updated_at
    }
```

---

## 2. Table Specifications & Column Dictionaries

### 2.1 Table: `users`
Stores authenticated users belonging to the four platform roles (Admin, Course Provider, Learner, Verifier).

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | INT | Primary Key, Auto Increment | Unique user identifier |
| `name` | VARCHAR(150) | NOT NULL | User's full legal name |
| `email` | VARCHAR(191) | NOT NULL, UNIQUE, INDEX | User login and contact email |
| `password_hash` | VARCHAR(255) | NOT NULL | 12-round salted bcrypt hash |
| `role` | VARCHAR(50) | NOT NULL, INDEX | One of: `admin`, `provider`, `learner`, `verifier` |
| `organization`| VARCHAR(200)| NULL | Associated university, academy, or company |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account state toggle (active/suspended) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account registration timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last modification timestamp |

### 2.2 Table: `courses`
Stores certified curriculum information authored by course providers and approved by admins.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | INT | Primary Key, Auto Increment | Unique course identifier |
| `title` | VARCHAR(255) | NOT NULL | Full course title |
| `description` | TEXT | NULL | Course overview and learning outcomes |
| `provider_id` | INT | NOT NULL, FK -> `users(id)` | Authoring instructor / provider |
| `category` | VARCHAR(100)| NOT NULL, INDEX | E.g. "Cloud & DevOps", "Web Development" |
| `difficulty` | VARCHAR(50) | NOT NULL | "Beginner", "Intermediate", or "Advanced" |
| `duration_hours`| INT | NOT NULL, DEFAULT 10 | Estimated instructional hours |
| `passing_percentage`| FLOAT | NOT NULL, DEFAULT 70.0 | Minimum assessment score required to pass |
| `status` | VARCHAR(50) | NOT NULL, INDEX | `approved`, `pending`, or `rejected` |
| `thumbnail_url`| VARCHAR(500)| NULL | Public cover image link |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Course creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last updated timestamp |

### 2.3 Table: `course_modules`
Contains individual instructional units, reading documents, videos, and practical exercises.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | INT | Primary Key, Auto Increment | Unique module identifier |
| `course_id` | INT | NOT NULL, FK -> `courses(id)` ON DELETE CASCADE | Associated parent course |
| `title` | VARCHAR(255) | NOT NULL | Module syllabus title |
| `description` | TEXT | NULL | Summary of lesson concepts |
| `content_type`| VARCHAR(50) | NOT NULL, DEFAULT 'document' | `document`, `video`, or `interactive` |
| `content_url` | VARCHAR(500)| NULL | Link to reading reference or video player |
| `reading_time_mins`| INT | NOT NULL, DEFAULT 15 | Estimated study duration |
| `order_index` | INT | NOT NULL, DEFAULT 1 | Display sequence order within syllabus |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp added |

### 2.4 Table: `enrollments`
Tracks student course progress, completed module checklists, and completion timestamps.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | INT | Primary Key, Auto Increment | Unique enrollment ID |
| `user_id` | INT | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Enrolled student ID |
| `course_id` | INT | NOT NULL, FK -> `courses(id)` ON DELETE CASCADE | Course ID |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'in_progress' | `in_progress` or `completed` |
| `progress_percentage`| FLOAT| NOT NULL, DEFAULT 0.0 | 0.0% to 100.0% dynamic completion |
| `completed_modules`| TEXT | NOT NULL, DEFAULT '[]' | JSON list of finished module IDs |
| `enrolled_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |
| `completed_at` | TIMESTAMP | NULL | Timestamp when 100% was reached |

### 2.5 Table: `assessments` & `assessment_questions`
Stores technical quizzes, questions, options, and explanations.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | INT | Primary Key, Auto Increment | Assessment ID |
| `course_id` | INT | NOT NULL, FK -> `courses(id)` ON DELETE CASCADE | Certified course |
| `title` | VARCHAR(255) | NOT NULL | Exam name |
| `description` | TEXT | NULL | Exam guidelines |
| `passing_score`| FLOAT | NOT NULL, DEFAULT 70.0 | Passing threshold |
| `time_limit_mins`| INT | NOT NULL, DEFAULT 30 | Countdown timer limit |

### 2.6 Table: `certificates`
The central registry ledger storing awarded credentials.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | INT | Primary Key, Auto Increment | Database record ID |
| `certificate_id`| VARCHAR(64) | NOT NULL, UNIQUE, INDEX | Formal ID (e.g. `CERT-2026-98124`) |
| `verification_id`| VARCHAR(64)| NOT NULL, UNIQUE, INDEX | Cryptographic Hash (e.g. `VFY-8A7B6C5D4E3F`) |
| `learner_id` | INT | NOT NULL, FK -> `users(id)` | Awarded student |
| `course_id` | INT | NOT NULL, FK -> `courses(id)` | Certified program |
| `provider_id` | INT | NOT NULL, FK -> `users(id)` | Issuing academy/instructor |
| `score` | FLOAT | NOT NULL, DEFAULT 100.0 | Exam grade percentage |
| `issue_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date issued |
| `completion_date`| TIMESTAMP| DEFAULT CURRENT_TIMESTAMP | Date fulfilled |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'valid', INDEX | `valid` or `revoked` |
| `revocation_reason`| TEXT | NULL | Reason for invalidation if revoked |
| `revoked_at` | TIMESTAMP | NULL | Invalidation timestamp |
| `qr_code_data` | TEXT | NULL | Encoded verification URL string |

### 2.7 Table: `verification_requests`
Maintains audit logs of employer background checks.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | INT | Primary Key, Auto Increment | Verification request record ID |
| `request_id` | VARCHAR(64) | NOT NULL, UNIQUE, INDEX | Formal Request ID (e.g. `VR-2026-0041`) |
| `requester_name`| VARCHAR(150)| NOT NULL | HR Director / Recruiter name |
| `requester_email`| VARCHAR(191)| NOT NULL | Corporate email |
| `requester_organization`| VARCHAR(200)| NULL | Hiring company name |
| `certificate_id`| VARCHAR(64) | NOT NULL, INDEX | Audited credential identifier |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'verified' | `verified`, `pending`, `rejected` |
| `notes` | TEXT | NULL | Candidate audit notes |
| `verified_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Verification execution date |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Inquiry created date |

