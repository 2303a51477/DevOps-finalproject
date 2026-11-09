# System Architecture & Technical Design

## 1. Executive Architecture Overview

The **Online Course Certification and Credential Verification Portal** is engineered as a cloud-native, decoupled multi-tier web application designed to fulfill strict enterprise availability, academic data integrity, and tamper-evident credential verification standards.

```
                              +-------------------------------------------+
                              |              Web Browsers                 |
                              |   (Admin / Provider / Learner / Employer) |
                              +-------------------------------------------+
                                                    |
                                                    | HTTPS (Port 443 / 80)
                                                    v
                              +-------------------------------------------+
                              |        Nginx Reverse Proxy / Ingress      |
                              |         Static SPA / API Router           |
                              +-------------------------------------------+
                                          |                     |
                  / (Static SPA Assets)   |                     | /api/* (REST APIs)
                                          v                     v
                +------------------------------------+  +------------------------------------+
                |       React Vite Frontend          |  |       FastAPI Python Backend       |
                | - Tailwind CSS & Lucide Icons      |  | - RESTful Endpoints & Middleware   |
                | - React Router v6 & Context API    |  | - JWT Bearer Token Validation     |
                | - Chart.js & Client PDF Download   |  | - ReportLab PDF & QR Code Engine   |
                +------------------------------------+  +------------------------------------+
                                                                        |
                                                                        | SQLAlchemy ORM (PyMySQL)
                                                                        v
                                                        +------------------------------------+
                                                        |        MySQL 8.0 Relational DB     |
                                                        | - 10 Normalized Relational Tables  |
                                                        | - Foreign Keys & Cascading Deletes |
                                                        | - Persistent Storage (PVC / Volume)|
                                                        +------------------------------------+
```

---

## 2. Multi-Tier Layer Decomposition

### 2.1 Presentation Tier (Frontend)
- **Framework**: React 18.2 with Vite 5 toolchain for sub-second hot-module replacement and optimized tree-shaken production bundles.
- **Styling System**: Tailwind CSS v3 with customized light-blue and crisp white corporate aesthetic, responsive flex/grid layouts, and `@media print` rules for certificate and report generation.
- **State Management**: Centralized React Context API (`AuthContext`) handling token persistence in `localStorage`, role privileges, and session expiration.
- **Routing & Route Protection**: `react-router-dom` v6 with declarative `ProtectedRoute` components enforcing role-based access control (RBAC).
- **Interactive Visualizations**: `Chart.js` with `react-chartjs-2` for dynamic bar graphs, doughnut charts, and progress telemetry.
- **Icons**: `lucide-react` for consistent, accessible visual cues.

### 2.2 Application Logic Tier (Backend)
- **Framework**: Python 3.11 with FastAPI and Starlette asynchronous runtime.
- **API Architecture**: Clean RESTful design with versioned routing prefixes (`/api/auth`, `/api/courses`, `/api/certificates`, etc.).
- **Data Validation & Serialization**: Pydantic v2 schemas enforcing strict typing, field constraints, and automatic OpenAPI / Swagger documentation (`/docs`).
- **Security & Cryptography**:
  - Passwords hashed with salted `bcrypt` (12 rounds).
  - Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).
  - Cryptographic verification hashes generated with 128-bit entropy (`VFY-<UUID>`).
- **Document Generation Engine**: `reportlab` library generating high-resolution A4 landscape digital certificates with embedded PNG QR codes generated in-memory via `qrcode`.
- **Reporting Engine**: CSV streaming and JSON aggregation services calculating completions, drop-offs, and verification logs.

### 2.3 Data Storage Tier (Database)
- **Database Engine**: MySQL 8.0 with InnoDB storage engine, full transactional ACID compliance, foreign key integrity, and UTF-8 (`utf8mb4_unicode_ci`) encoding.
- **Resilient Engine Abstraction**: Dual-engine connection mechanism in SQLAlchemy—connects directly to MySQL in Docker/Kubernetes production environments with automated connection retry and fallback support for local standalone development.
- **Data Volume Persistence**: Managed Kubernetes `PersistentVolumeClaim` (PVC) and Docker named volumes safeguarding database storage across container restarts.

---

## 3. Security & Verification Architecture

1. **Tamper-Evident Digital Certificates**:
   - Every certificate is stamped with an immutable `certificate_id` (e.g., `CERT-2026-98124`) and unique `verification_id` (e.g., `VFY-8A7B6C5D4E3F`).
   - The embedded QR code points directly to `https://credentialverify.local/verify/<verification_id>`.
2. **Public Verification Sandbox**:
   - Verification lookups (`GET /api/verify/{id}`) are public and do not require authentication or user accounts.
   - Enables prospective employers, hiring managers, and academic admissions officers to verify student achievements instantly.
3. **Revocation Safeguards**:
   - When a certificate is marked as revoked by an Admin or Course Provider, its status is permanently set to `revoked` along with a mandatory audit reason.
   - Subsequent verification requests immediately return a high-priority revocation warning banner, ensuring revoked certificates can never be validated as authentic.

---

## 4. Container & Orchestration Architecture

- **Docker Implementation**:
  - `frontend/Dockerfile`: Multi-stage build (Node 20 build stage followed by a lightweight Nginx alpine production image).
  - `backend/Dockerfile`: Minimalist Python 3.11-slim container with curl health check probe.
  - `docker/docker-compose.yml`: Automated service composition linking MySQL 8, backend, and frontend containers on an isolated bridge network with volume mapping.
- **Kubernetes Implementation**:
  - Microservice isolation with 3 independent Deployments (`mysql-deployment`, `backend-deployment`, `frontend-deployment`).
  - Decoupled configuration via `portal-config` ConfigMap and `portal-secret` Secret.
  - Zero-downtime rolling updates (`RollingUpdate` strategy) and automatic liveness/readiness health probes.
  - NodePort service exposure (`nodePort: 30080` for Frontend, `nodePort: 30800` for Backend).
