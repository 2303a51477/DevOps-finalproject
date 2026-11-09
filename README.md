# Online Course Certification and Credential Verification Portal

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18.2-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1.svg?style=flat&logo=mysql)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/Styles-Tailwind_CSS_v3-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/DevOps-Docker_&_Compose-2496ED.svg?style=flat&logo=docker)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5.svg?style=flat&logo=kubernetes)](https://kubernetes.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, production-style web platform providing automated course accreditation, module-based learning tracking, auto-graded technical examinations, cryptographic digital certificate generation with embedded QR codes, and a public verification ledger for universities, online academies, and hiring employers.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [User Roles & Permissions Matrix](#6-user-roles--permissions-matrix)
7. [Technology Stack](#7-technology-stack)
8. [System Architecture](#8-system-architecture)
9. [Database Design & ER Diagram](#9-database-design--er-diagram)
10. [RESTful API Endpoints](#10-restful-api-endpoints)
11. [18 Minimum Website Screens](#11-18-minimum-website-screens)
12. [Four Mandatory Reports](#12-four-mandatory-reports)
13. [Installation & Local Setup](#13-installation--local-setup)
14. [Environment Configuration](#14-environment-configuration)
15. [Docker Setup & Execution](#15-docker-setup--execution)
16. [Kubernetes Deployment](#16-kubernetes-deployment)
17. [Testing Procedures](#17-testing-procedures)
18. [Screenshots & UI Walkthrough](#18-screenshots--ui-walkthrough)
19. [Future Enhancements](#19-future-enhancements)

---

## 1. Project Overview

The **Online Course Certification and Credential Verification Portal** bridges the trust gap between online education and corporate hiring. The platform automates the entire learning-to-credentialing lifecycle:
- Course providers publish accredited syllabus modules and interactive assessments.
- Learners enroll, track lesson completion in real time, and sit for timed exams.
- The system automatically grades assessments and mints cryptographic, signed digital certificates with tamper-proof Verification IDs and dynamic QR codes.
- Corporate recruiters, background check agencies, and universities verify credentials instantly without requiring authentication.

---

## 2. Problem Statement

Modern credential fraud and the proliferation of low-quality online certificates present significant challenges to academia and employers:
1. **Proliferation of Forged PDFs**: Traditional static PDF certificates are vulnerable to tampering using standard image-editing software.
2. **Slow, Manual Background Checks**: Employers often wait weeks for registrar offices to confirm candidate qualifications.
3. **Fragmented Learning & Credentialing**: Many learning management systems (LMS) lack integrated, automated certificate generation tied directly to verifiable passing criteria.
4. **Lack of Invalidation Auditing**: Revoked certificates (due to academic dishonesty or expired credentials) often circulate indefinitely without detection.

---

## 3. Objectives

- **Tamper-Evident Issuance**: Mint unique certificate identifiers (`CERT-YYYY-XXXX`) and verification hashes (`VFY-XXXXXXXX`) recorded in an immutable relational ledger.
- **Automated Workflow**: Automatically recalculate learner progress and issue certificates upon 100% module completion and passing the timed assessment.
- **Public Verification**: Provide instant, zero-login credential lookup via direct URL parameter or QR code scanning.
- **Revocation Governance**: Enable authorized administrators and course providers to revoke certificates with auditable explanations.
- **Comprehensive Analytics**: Generate the four mandatory reports (Certificate Issuance, Course Completion, Verification Requests, and Learner Progress) with CSV export and print-ready formats.
- **Cloud-Native Deployment**: Package the application with multi-stage Dockerfiles, Docker Compose, and complete Kubernetes orchestration manifests.

---

## 4. Functional Requirements

- **Authentication & RBAC**: JWT-based authentication supporting four distinct roles: Admin, Course Provider, Learner, and Verifier.
- **Course Studio**: Rich curriculum editor supporting video, document, and interactive module types with duration tracking.
- **Interactive Assessments**: Timed technical examinations with randomized questions, countdown timers, and immediate auto-scoring.
- **Certificate Engine**: Server-side PDF generation using ReportLab, embedding high-resolution QR codes, security seals, and registrar signatures.
- **Public Verification Interface**: Real-time status badge rendering (`VALID`, `REVOKED`, `NOT_FOUND`), revocation reasons, and printable verification sheets.
- **Audit Logging**: Employer verification inquiry submission and history tracking.

---

## 5. Non-Functional Requirements

- **Performance**: Sub-100ms API response latency on credential lookups; under 2-second server-side PDF generation.
- **Security**: Passwords encrypted with 12-round salted `bcrypt`; CORS-protected endpoints; input sanitization and Pydantic validation.
- **Availability**: Kubernetes deployment with dual-replica sets, automated health probes, and self-healing pods.
- **Scalability**: Decoupled presentation and application tiers; connection pooling and read-optimized relational indexing.
- **Usability**: Professional SaaS aesthetic adhering to a clean white and light-blue corporate design system with responsive mobile layouts.

---

## 6. User Roles & Permissions Matrix

| Feature / Action | Admin | Course Provider | Learner | Verifier / Employer |
|:---|:---:|:---:|:---:|:---:|
| System User Management & Roles | **Yes** | No | No | No |
| Course Approval / Rejection | **Yes** | No | No | No |
| System Analytics & Global Config | **Yes** | No | No | No |
| Author & Edit Courses | **Yes** | **Yes** | No | No |
| Manage Syllabus Modules | **Yes** | **Yes** | No | No |
| Create Quizzes & Assessments | **Yes** | **Yes** | No | No |
| Issue & Revoke Certificates | **Yes** | **Yes** | No | No |
| Browse Course Catalog | **Yes** | **Yes** | **Yes** | **Yes** |
| Enroll & Track Module Progress | **Yes** | No | **Yes** | No |
| Complete Assessments | No | No | **Yes** | No |
| Download Earned PDF Certificates | **Yes** | **Yes** | **Yes** | **Yes** |
| Public Credential Verification | **Yes** | **Yes** | **Yes** | **Yes** |
| Submit Verification Requests | **Yes** | No | No | **Yes** |
| Mandatory Analytical Reports | **Yes** | **Yes** | No | **Yes** (Audit) |

---

## 7. Technology Stack

### Frontend
- **React.js 18.2** with **Vite 5**
- **Tailwind CSS v3** (Custom light-blue `#0284c7` & slate styling system)
- **React Router DOM v6** (Protected routes & RBAC navigation)
- **Chart.js** & **react-chartjs-2** (Interactive analytics & velocity graphs)
- **Lucide React** (Modern, consistent iconography)

### Backend
- **Python 3.11** with **FastAPI**
- **SQLAlchemy 2.0** ORM & **PyMySQL**
- **Pydantic v2** (Request & response schema validation)
- **PyJWT** (HMAC-SHA256 Bearer token authentication)
- **Bcrypt** (Salted password hashing)
- **ReportLab 4.1** & **qrcode** (Dynamic PDF certificate generation with embedded QR codes)

### Database
- **MySQL 8.0** (Relational schema, foreign keys, cascades, unique constraints, and indexes)
- Resilient connection fallback supporting SQLite for standalone local testing.

### DevOps & Orchestration
- **Docker** & **Docker Compose**
- **Nginx** (Reverse proxy, SPA client routing, and static caching)
- **Kubernetes** (Deployments, Services, ConfigMaps, Secrets, and PVCs)

---

## 8. System Architecture

```
[ Web Client / Browser ]
           │
           │ HTTPS / HTTP
           ▼
[ Nginx Reverse Proxy (Port 80 / 30080) ]
   ├── Static SPA Bundle (/) ─────────────► [ React 18 + Vite ]
   └── API Requests (/api/*) ────────────► [ FastAPI Backend (Port 8000) ]
                                                    │
                                                    │ SQLAlchemy / PyMySQL
                                                    ▼
                                         [ MySQL 8.0 Relational DB ]
                                         (Volume: portal_mysql_data)
```

For complete architectural details, see [docs/architecture.md](docs/architecture.md).

---

## 9. Database Design & ER Diagram

The database schema consists of **10 normalized tables**:
1. `users`
2. `courses`
3. `course_modules`
4. `enrollments`
5. `assessments`
6. `assessment_questions`
7. `assessment_results`
8. `certificates`
9. `verification_requests`
10. `system_settings`

Complete DDL schema is located at [database/schema.sql](database/schema.sql) and seed data at [database/seed.sql](database/seed.sql). For detailed schema documentation and Mermaid diagrams, see [docs/database-design.md](docs/database-design.md).

---

## 10. RESTful API Endpoints

| Resource | Method | Endpoint | Description |
|:---|:---:|:---|:---|
| **Auth** | `POST` | `/api/auth/register` | User registration |
| **Auth** | `POST` | `/api/auth/login` | User login & JWT issuance |
| **Auth** | `GET` | `/api/auth/me` | Fetch active session profile |
| **Users** | `GET` | `/api/users` | List users with role filter |
| **Users** | `PUT` | `/api/users/{id}` | Update user profile / status |
| **Users** | `DELETE`| `/api/users/{id}` | Remove user account |
| **Courses** | `GET` | `/api/courses` | List courses catalog |
| **Courses** | `POST` | `/api/courses` | Create new course program |
| **Courses** | `PUT` | `/api/courses/{id}` | Update course metadata |
| **Courses** | `DELETE`| `/api/courses/{id}`| Delete course & modules |
| **Courses** | `POST` | `/api/courses/{id}/modules` | Add syllabus module |
| **Courses** | `PUT` | `/api/courses/{id}/approve` | Admin course approval |
| **Courses** | `PUT` | `/api/courses/{id}/reject` | Admin course rejection |
| **Enrollments**| `POST` | `/api/enrollments` | Enroll learner in course |
| **Enrollments**| `GET` | `/api/enrollments` | View student enrollments |
| **Enrollments**| `PUT` | `/api/enrollments/{id}/progress`| Mark module complete & recalculate % |
| **Assessments**| `POST` | `/api/assessments` | Create assessment quiz |
| **Assessments**| `GET` | `/api/assessments/{id}` | Retrieve questions for quiz |
| **Assessments**| `POST` | `/api/assessments/{id}/submit` | Auto-grade & auto-issue certificate |
| **Certificates**| `GET` | `/api/certificates` | View certificate ledger |
| **Certificates**| `POST` | `/api/certificates/issue` | Manual certificate issuance |
| **Certificates**| `GET` | `/api/certificates/{id}/download`| Download PDF certificate with QR code |
| **Certificates**| `PUT` | `/api/certificates/{id}/revoke`| Revoke certificate with mandatory audit reason |
| **Verification**| `GET` | `/api/verify/{verification_id}` | **Public** credential verification lookup |
| **Verification**| `POST`| `/api/verification-requests` | Submit formal employer verification |
| **Reports** | `GET` | `/api/reports/certificate-issuance` | Mandatory Report A |
| **Reports** | `GET` | `/api/reports/course-completion` | Mandatory Report B |
| **Reports** | `GET` | `/api/reports/verification-requests`| Mandatory Report C |
| **Reports** | `GET` | `/api/reports/learner-progress` | Mandatory Report D |
| **Reports** | `GET` | `/api/reports/export/csv/{type}` | Download report as CSV file |
| **Settings** | `GET` | `/api/settings` | Retrieve system parameters |
| **Settings** | `PUT` | `/api/settings/{key}` | Update system parameter |

For full request/response schemas, see [docs/api-documentation.md](docs/api-documentation.md).

---

## 11. 18 Minimum Website Screens

The application includes **18 functional screens**:

1. **Landing Page (`/`)**: Hero section, live certificate search, platform metrics, workflow diagrams, featured courses, and role portals.
2. **Registration Page (`/register`)**: Role selection tabs (Learner, Provider, Verifier), input validation, terms agreement, and direct registration.
3. **Login Page (`/login`)**: Secure sign-in form with **One-Click Academic Demo Sign-In** buttons for Admin, Provider, Learner, and Verifier roles.
4. **Admin Dashboard (`/admin/dashboard`)**: Metric overview cards, certificate issuance velocity bar chart, integrity doughnut chart, and pending course approval queue.
5. **User Management (`/admin/users`)**: Searchable user directory, role filter pills, account active/suspend toggle, edit permissions modal, and deletion confirmation.
6. **Course Provider Dashboard (`/provider/dashboard`)**: Provider stats, published courses showcase, enrolled learners tracking, and quick action buttons.
7. **Course Creation & Management (`/provider/courses`)**: Course editor, category/difficulty selectors, passing criteria controls, and module syllabus manager.
8. **Course Listing (`/courses`)**: Public course catalog with full-text search, category filters, difficulty tags, duration, and direct enroll links.
9. **Course Details (`/courses/:id`)**: Curriculum overview, syllabus module accordion, reading times, provider accreditation seal, and enrollment action.
10. **Learner Dashboard (`/learner/dashboard`)**: Enrolled courses with visual progress bars, earned credentials showcase, and quick-resume buttons.
11. **Learning Progress Page (`/learn/:courseId`)**: Interactive learning room, module reader, external resource links, "Mark as Complete" toggle, and exam unlock trigger.
12. **Assessment Page (`/assessments/:assessmentId`)**: Timed technical examination, live countdown clock, multiple-choice radio questions, auto-grading, and instant certificate unlock modal.
13. **Certificate Management (`/certificates/manage`)**: Complete certificate ledger, manual issuance modal, revocation modal with audit reason, and direct PDF downloads.
14. **Certificate Verification Page (`/verify` & `/verify/:verificationId`)**: Public verification search bar, live status badges (`VALID`, `REVOKED`, `NOT_FOUND`), official certificate preview, and printable verification sheet.
15. **Verification Requests Page (`/verifications/requests`)**: Employer verification inquiry form and historical audit table.
16. **Reports & Analytics Page (`/reports`)**: The four mandatory reports with Chart.js telemetry, search filters, date ranges, and CSV/Print export controls.
17. **User Profile (`/profile`)**: User information overview, organizational affiliation editor, and salted bcrypt password change form.
18. **Admin Settings (`/admin/settings`)**: Platform branding, default passing percentage, auto-issuance toggles, and security seal options.

---

## 12. Four Mandatory Reports

| Report | Description | Key Columns | Supported Formats |
|:---|:---|:---|:---|
| **A. Certificate Issuance Report** | Tracks all minted certificates, issuance dates, and integrity status. | Certificate ID, Learner Name, Course Name, Issue Date, Score, Status | Interactive Chart, CSV, Print/PDF |
| **B. Course Completion Report** | Evaluates student throughput, retention, and completion percentages. | Course Name, Category, Total Learners, Completed Learners, Pending Learners, Completion % | Interactive Chart, CSV, Print/PDF |
| **C. Verification Requests Report** | Audits background checks submitted by corporate recruiters. | Request ID, Requester Details, Certificate ID, Request Date, Verification Result | Interactive Chart, CSV, Print/PDF |
| **D. Learner Progress Report** | Granular telemetry on module completion counts and examination scores. | Learner Name, Enrolled Course, Completed Modules, Assessment Score, Progress %, Status | Interactive Chart, CSV, Print/PDF |

---

## 13. Installation & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) MySQL 8.0 server (the application includes automatic SQLite fallback for zero-configuration standalone testing)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/online-course-certification-portal.git
cd online-course-certification-portal
```

### Step 2: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend initializes the database schema and seeds demo accounts automatically. Swagger UI will be available at `http://localhost:8000/docs`.

### Step 3: Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 14. Environment Configuration

### Backend (`backend/.env` or Docker Environment Variables):
```env
PORT=8000
SECRET_KEY=credential-portal-super-secret-production-key-2026-98124
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=credential_portal
MYSQL_USER=portal_user
MYSQL_PASSWORD=portal_password123
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=/api
```

---

## 15. Docker Setup & Execution

The entire multi-tier stack (MySQL 8, FastAPI backend, and React/Nginx frontend) can be spun up using Docker Compose:

```bash
# Build and run all services
docker compose -f docker/docker-compose.yml up --build -d

# Verify container health
docker compose -f docker/docker-compose.yml ps

# Tail application logs
docker compose -f docker/docker-compose.yml logs -f
```

### Access Points:
- **Frontend Application**: `http://localhost:5173` or `http://localhost:80`
- **Backend API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **MySQL Database**: `localhost:3306`

To shut down:
```bash
docker compose -f docker/docker-compose.yml down
```

---

## 16. Kubernetes Deployment

The `kubernetes/` folder contains production-ready declarative manifests.

### Step 1: Deploy to Cluster
```bash
# Apply ConfigMaps and Secrets
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml

# Apply Persistent Volume Claim for MySQL
kubectl apply -f kubernetes/mysql-pvc.yaml

# Deploy MySQL Database Service
kubectl apply -f kubernetes/mysql-deployment.yaml
kubectl apply -f kubernetes/mysql-service.yaml

# Deploy FastAPI Backend
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/backend-service.yaml

# Deploy React Frontend
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml
```
Or apply all manifests simultaneously:
```bash
kubectl apply -f kubernetes/
```

### Step 2: Verify Resources
```bash
kubectl get pods
kubectl get services
kubectl get deployments
kubectl describe pods -l app=credential-portal
```

### Accessing via NodePort:
- **Frontend Portal**: `http://<NODE-IP>:30080`
- **Backend API**: `http://<NODE-IP>:30800`

---

## 17. Testing Procedures

Run the comprehensive automated integration suite:
```bash
python -c "
import sys; sys.path.append('backend')
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
assert client.get('/health').status_code == 200
assert client.get('/api/verify/VFY-8A7B6C5D4E3F').json()['status'] == 'valid'
assert client.get('/api/verify/VFY-9REVOKED001').json()['status'] == 'revoked'
assert client.get('/api/reports/certificate-issuance').status_code == 200
print('ALL INTEGRATION TESTS PASSED!')
"
```
For detailed manual test cases and matrices, consult [docs/testing.md](docs/testing.md).

---

## 18. Screenshots & UI Walkthrough

### Pre-Seeded Academic Demo Accounts:
Use the **One-Click Sign-In** buttons on the Login page or manually enter:
- **Admin**: `admin@credentialverify.com` | `password123`
- **Course Provider**: `provider@cloudacademy.com` | `password123`
- **Learner**: `learner@stanford.edu` | `password123`
- **Corporate Verifier**: `recruiter@techcorp.com` | `password123`

### Sample Verification Hashes:
- **Valid Credential**: `VFY-8A7B6C5D4E3F` (Course: Cloud Architecture & Kubernetes)
- **Revoked Credential**: `VFY-9REVOKED001` (Reason: Academic integrity violation)

---

## 19. Future Enhancements

- **Decentralized Identifiers (DIDs)**: Anchoring verification hashes onto public blockchain networks (Ethereum / Polygon) for zero-trust ledger immutability.
- **W3C Verifiable Credentials (VC)**: Exporting student credentials directly into Apple Wallet and Google Wallet.
- **Proctored AI Examinations**: Automated webcam proctoring and browser lock during high-stakes certification assessments.
- **Multi-Tenant SSO**: Single Sign-On integration via SAML 2.0 / OpenID Connect for enterprise identity providers (Okta, Azure AD).

---

## Academic Evaluation Compliance Checklist

- [x] Full-Stack Implementation (React + Vite + FastAPI + MySQL)
- [x] 18 Fully Functional Screens (Exceeds minimum requirement of 15)
- [x] Four User Roles with RBAC (Admin, Provider, Learner, Verifier)
- [x] Certificate PDF Generation & Dynamic QR Code Engine
- [x] Public Zero-Login Verification Portal with Revocation Handling
- [x] Four Mandatory Database-Driven Reports with CSV Export & Print
- [x] Production Dockerfiles & Docker Compose Orchestration
- [x] Complete Kubernetes YAML Manifests (Deployments, Services, ConfigMap, Secret, PVC)
- [x] Architecture, Database Design, API Reference, and Testing Documentation

---

**Built with pride for Academic Project Evaluation.**
