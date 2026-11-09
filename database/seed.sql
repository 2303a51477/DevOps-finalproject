-- =====================================================================
-- SEED DATA FOR ONLINE COURSE CERTIFICATION PORTAL
-- =====================================================================

USE credential_portal;

-- Seed Users (Passwords: 'password123' bcrypt hash)
INSERT INTO users (id, name, email, password_hash, role, organization, is_active) VALUES
(1, 'Dr. Sarah Mitchell (Administrator)', 'admin@credentialverify.com', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'admin', 'National Credential Board', TRUE),
(2, 'Prof. David Vance', 'provider@cloudacademy.com', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'provider', 'Cloud DevOps Institute', TRUE),
(3, 'Elena Rostova', 'elena.provider@datascience.io', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'provider', 'AI & Big Data Consortium', TRUE),
(4, 'Alex Mercer', 'learner@stanford.edu', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'learner', 'Stanford University Alumni', TRUE),
(5, 'Maya Patel', 'maya.patel@student.edu', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'learner', 'University of Washington', TRUE),
(6, 'James Thornton', 'james.thornton@columbia.edu', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'learner', 'Columbia University', TRUE),
(7, 'Rachel Green (Senior HR Director)', 'recruiter@techcorp.com', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'verifier', 'TechCorp Global Talent Acquisition', TRUE),
(8, 'Michael Chang (Lead Technical Recruiter)', 'mchang@google-recruiting.com', '$2b$12$e8x5a31D8u8MhR70WfE1cehP923hU.jM3H3.kU4EaJ3d0vR24Z65q', 'verifier', 'Apex Enterprise Solutions', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Courses
INSERT INTO courses (id, title, description, provider_id, category, difficulty, duration_hours, passing_percentage, status, thumbnail_url) VALUES
(1, 'Cloud Architecture & Kubernetes Orchestration', 'Master enterprise cloud engineering, containerization with Docker, Kubernetes cluster orchestration, and GitOps delivery.', 2, 'Cloud & DevOps', 'Advanced', 36, 75.0, 'approved', 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80'),
(2, 'Full-Stack Development with FastAPI & React', 'Modern full-stack web engineering with Python FastAPI, asynchronous endpoints, SQLAlchemy ORM, React 18, Vite, and Tailwind CSS.', 2, 'Web Development', 'Intermediate', 30, 70.0, 'approved', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'),
(3, 'Enterprise Cybersecurity & Ethical Hacking', 'Comprehensive defense-in-depth principles, vulnerability assessments, penetration testing, and zero-trust architectures.', 3, 'Cybersecurity', 'Advanced', 42, 80.0, 'approved', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'),
(4, 'Applied Machine Learning & Deep Neural Networks', 'Supervised and unsupervised learning, PyTorch deep learning, convolutional networks, and transformer architectures.', 3, 'AI & Data Science', 'Intermediate', 40, 75.0, 'approved', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Seed Certificates
INSERT INTO certificates (id, certificate_id, verification_id, learner_id, course_id, provider_id, score, status, revocation_reason, qr_code_data) VALUES
(1, 'CERT-2026-98124', 'VFY-8A7B6C5D4E3F', 4, 1, 2, 100.0, 'valid', NULL, '/verify/VFY-8A7B6C5D4E3F'),
(2, 'CERT-2026-44019', 'VFY-3K9L2M5N8P1Q', 4, 2, 2, 95.0, 'valid', NULL, '/verify/VFY-3K9L2M5N8P1Q'),
(3, 'CERT-2026-11892', 'VFY-7X4W1Z9V2U0T', 5, 2, 2, 88.0, 'valid', NULL, '/verify/VFY-7X4W1Z9V2U0T'),
(4, 'CERT-2026-66521', 'VFY-9REVOKED001', 6, 3, 3, 72.0, 'revoked', 'Academic integrity violation: Plagiarized practical lab submission identified during post-audit review.', '/verify/VFY-9REVOKED001')
ON DUPLICATE KEY UPDATE certificate_id=VALUES(certificate_id);

-- Seed Verification Requests
INSERT INTO verification_requests (id, request_id, requester_name, requester_email, requester_organization, certificate_id, status, notes) VALUES
(1, 'VR-2026-0041', 'Rachel Green', 'recruiter@techcorp.com', 'TechCorp Global Talent Acquisition', 'CERT-2026-98124', 'verified', 'Candidate verification for Senior Site Reliability Engineer position.'),
(2, 'VR-2026-0042', 'Michael Chang', 'mchang@google-recruiting.com', 'Apex Enterprise Solutions', 'CERT-2026-44019', 'verified', 'Pre-employment academic credential audit.'),
(3, 'VR-2026-0043', 'David Sterling', 'dsterling@hedgefund.com', 'Sterling Capital Management', 'CERT-2026-66521', 'rejected', 'Validation of cybersecurity clearance. Status confirmed as REVOKED.')
ON DUPLICATE KEY UPDATE request_id=VALUES(request_id);
