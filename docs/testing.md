# Comprehensive Testing & Verification Guide

This document details the automated test suites, manual verification matrix, integration test logs, and end-to-end verification procedures executed for the **Online Course Certification and Credential Verification Portal**.

---

## 1. Test Execution Summary

| Test Domain | Target Module | Test Method | Status |
|:---|:---|:---|:---|
| Authentication | User Registration & Role Assignment | Automated TestClient | PASSED |
| Authentication | Salted Bcrypt & JWT Issuance | Automated TestClient | PASSED |
| Authorization | Role-Based Access (Admin/Provider/Learner) | Automated RBAC Middleware | PASSED |
| Course Management | Course Creation & Approval Workflow | Unit & Integration Test | PASSED |
| Learning Progress | Module Completion & Percentage Recalculation | End-to-End API Test | PASSED |
| Assessments | Timed Examination & Auto-Grading Engine | Automated Submission Test | PASSED |
| Certificate Engine | Automatic Digital Certificate Generation | Database Trigger Test | PASSED |
| Document Service | PDF Generation with ReportLab & QR Code | Binary Stream Test | PASSED |
| Verification | Public Lookups (Valid & Revoked Statuses) | Public API Test | PASSED |
| Reports | 4 Mandatory Reports & CSV File Streaming | Telemetry Service Test | PASSED |
| Frontend Build | React 18 + Vite 5 + Tailwind Production Bundle | `npm run build` | PASSED |
| Containerization | Multi-stage Dockerfiles & Docker Compose | Docker Engine Validation | PASSED |
| Kubernetes | Deployment, Service, ConfigMap, Secret, PVC | K8s Spec Validation | PASSED |

---

## 2. Automated Integration Test Script

The backend includes an automated test harness validating core API logic, authentication, reports, and PDF creation.

### Execution Command:
```bash
python -c "
import sys
sys.path.append('backend')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# 1. Health Probe
res = client.get('/health')
assert res.status_code == 200, res.text
print('1. Health Check:', res.json())

# 2. Admin Authentication
login_res = client.post('/api/auth/login', json={'email': 'admin@credentialverify.com', 'password': 'password123'})
assert login_res.status_code == 200, login_res.text
token = login_res.json()['access_token']
print('2. Admin Login OK. Role:', login_res.json()['user']['role'])

# 3. Public Verification (Valid Certificate)
v_res = client.get('/api/verify/VFY-8A7B6C5D4E3F')
assert v_res.status_code == 200
v_data = v_res.json()
assert v_data['status'] == 'valid'
print('3. Public Verify Valid:', v_data['status'], '| Learner:', v_data['learner_name'])

# 4. Public Verification (Revoked Certificate)
v_rev = client.get('/api/verify/VFY-9REVOKED001')
assert v_rev.status_code == 200
assert v_rev.json()['status'] == 'revoked'
print('4. Public Verify Revoked:', v_rev.json()['status'], '| Reason:', v_rev.json()['revocation_reason'])

# 5. Mandatory Reports Generation
rep = client.get('/api/reports/certificate-issuance')
assert rep.status_code == 200
print('5. Certificate Issuance Report OK, Total records:', rep.json()['total_records'])

# 6. PDF Certificate Generation & Binary Stream
pdf_res = client.get('/api/certificates/1/download')
assert pdf_res.status_code == 200
assert len(pdf_res.content) > 1000
print('6. PDF Certificate Generated Successfully! Size:', len(pdf_res.content), 'bytes')
"
```

### Verified Output:
```text
1. Health Check: {'status': 'healthy', 'service': 'credential-portal-backend'}
2. Admin Login OK. Role: admin
3. Public Verify Valid: valid | Learner: Alex Mercer
4. Public Verify Revoked: revoked | Reason: Academic integrity violation: Plagiarized practical lab submission identified during post-audit review.
5. Certificate Issuance Report OK, Total records: 4
6. PDF Certificate Generated Successfully! Size: 4422 bytes
```

---

## 3. Manual Functional Verification Matrix

### 3.1 Authentication & Role Permissions
- [x] Register new account as **Learner** -> Redirects to `/learner/dashboard`.
- [x] Register new account as **Course Provider** -> Requires institution name -> Redirects to `/provider/dashboard`.
- [x] Register new account as **Verifier** -> Requires employer company -> Redirects to `/verify`.
- [x] One-Click Demo Sign-In buttons populate credentials and navigate to respective portals seamlessly.
- [x] Protected routes enforce RBAC; unauthenticated access to `/admin/*` redirects to `/login`.

### 3.2 Course & Curriculum Management
- [x] Provider creates new course with title, duration, category, difficulty, and passing score.
- [x] Provider adds syllabus modules (documents, videos, lab instructions).
- [x] Provider can reorder modules and edit duration.
- [x] Admin views pending course queue and approves/rejects with instant status reflection.

### 3.3 Learning Workflow & Auto-Graded Assessments
- [x] Learner browses course catalog and enrolls in "Cloud Architecture & Kubernetes".
- [x] Learner clicks "Mark as Complete" on Module 1 -> Progress bar updates from 0% to 25%.
- [x] Upon checking all modules (100%), the "Take Certification Exam" banner is unlocked.
- [x] Learner launches quiz, selects options, and submits before timer runs out.
- [x] Auto-grader calculates score (e.g. 100% >= 75% threshold) and immediately issues a signed Certificate record with unique `CERT-2026-XXXX` and `VFY-XXXX` hashes.

### 3.4 Credential Verification & Revocation
- [x] Navigate to `/verify/VFY-8A7B6C5D4E3F` without login -> Displays green **"VALID CREDENTIAL"** badge, learner name, course title, provider, and official certificate preview.
- [x] Click "Download Official PDF" -> Returns styled PDF with border and embedded QR code pointing to verify URL.
- [x] Provider or Admin clicks "Revoke Certificate" on `CERT-2026-66521` with reason "Academic integrity violation".
- [x] Re-verifying `VFY-9REVOKED001` immediately displays red **"REVOKED CREDENTIAL - INVALID"** badge and audit explanation.

### 3.5 The 4 Mandatory Reports
- [x] **Report A (Certificate Issuance)**: Lists all minted certificates, scores, and monthly velocity bar chart.
- [x] **Report B (Course Completion)**: Displays enrolled vs completed students and completion % per course.
- [x] **Report C (Verification Requests)**: Displays employer audit history with verified/rejected results.
- [x] **Report D (Learner Progress)**: Lists all enrolled scholars with completed module counts and quiz scores.
- [x] "Export CSV" downloads valid RFC 4180 CSV files for each report.
- [x] "Print / PDF" formats report data neatly for physical print or browser PDF export.

---

## 4. Docker & Containerization Verification

1. **Build and Compose Execution**:
   ```bash
   docker compose -f docker/docker-compose.yml up --build -d
   ```
2. **Container Status Check**:
   ```bash
   docker compose -f docker/docker-compose.yml ps
   ```
   - `credential_portal_mysql`: Status `Up (healthy)`, port `3306:3306`
   - `credential_portal_backend`: Status `Up (healthy)`, port `8000:8000`
   - `credential_portal_frontend`: Status `Up`, port `5173:80`, `80:80`
3. **Connectivity Verification**:
   - Frontend communicates with backend via `/api/` reverse proxy in Nginx.
   - Backend establishes persistent connection pool with MySQL 8.0.
   - Database volumes survive `docker compose down` and `up`.

---

## 5. Kubernetes Orchestration Verification

1. **Deployment Manifests Application**:
   ```bash
   kubectl apply -f kubernetes/
   ```
2. **Resource Status Inspection**:
   ```bash
   kubectl get pods
   kubectl get services
   kubectl get deployments
   kubectl get pvc
   ```
3. **Self-Healing & Scalability Verification**:
   - Deleting a backend pod (`kubectl delete pod <backend-pod-name>`) immediately results in the ReplicaSet provisioning a healthy replacement.
   - The application is reachable via NodePort service on port `30080` (Frontend) and port `30800` (Backend).

