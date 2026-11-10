import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.course import Course, CourseModule
from app.models.enrollment import Enrollment
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentResult
from app.models.certificate import Certificate
from app.models.verification import VerificationRequest, SystemSetting
from app.services.auth import get_password_hash
from app.mongo_db import next_seq


def _get_seed_catalog():
    # 1. Users
    users_data = [
        {
            "name": "Dr. Sarah Mitchell (Administrator)",
            "email": "admin@credentialverify.com",
            "password": "password123",
            "role": "admin",
            "organization": "National Credential Board",
            "is_active": True
        },
        {
            "name": "Prof. David Vance",
            "email": "provider@cloudacademy.com",
            "password": "password123",
            "role": "provider",
            "organization": "Cloud DevOps Institute",
            "is_active": True
        },
        {
            "name": "Elena Rostova",
            "email": "elena.provider@datascience.io",
            "password": "password123",
            "role": "provider",
            "organization": "AI & Big Data Consortium",
            "is_active": True
        },
        {
            "name": "Alex Mercer",
            "email": "learner@stanford.edu",
            "password": "password123",
            "role": "learner",
            "organization": "Stanford University Alumni",
            "is_active": True
        },
        {
            "name": "Maya Patel",
            "email": "maya.patel@student.edu",
            "password": "password123",
            "role": "learner",
            "organization": "University of Washington",
            "is_active": True
        },
        {
            "name": "James Thornton",
            "email": "james.thornton@columbia.edu",
            "password": "password123",
            "role": "learner",
            "organization": "Columbia University",
            "is_active": True
        },
        {
            "name": "Rachel Green (Senior HR Director)",
            "email": "recruiter@techcorp.com",
            "password": "password123",
            "role": "verifier",
            "organization": "TechCorp Global Talent Acquisition",
            "is_active": True
        },
        {
            "name": "Michael Chang (Lead Technical Recruiter)",
            "email": "mchang@google-recruiting.com",
            "password": "password123",
            "role": "verifier",
            "organization": "Apex Enterprise Solutions",
            "is_active": True
        }
    ]

    # 2. Courses & Modules
    courses_data = [
        {
            "title": "Cloud Architecture & Kubernetes Orchestration",
            "description": "Master enterprise cloud engineering, containerization with Docker, Kubernetes cluster orchestration, Service Meshes, and GitOps automated delivery.",
            "category": "Cloud & DevOps",
            "difficulty": "Advanced",
            "duration_hours": 36,
            "passing_percentage": 75.0,
            "provider_email": "provider@cloudacademy.com",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: Docker Containers & Multi-stage Builds",
                    "description": "Fundamental container principles, image optimization, security scanning, and container registries.",
                    "content_type": "document",
                    "content_url": "https://kubernetes.io/docs/concepts/overview/",
                    "reading_time_mins": 25,
                    "order_index": 1
                },
                {
                    "title": "Module 2: Kubernetes Architecture, Pods & Deployments",
                    "description": "Control plane components, worker nodes, ReplicaSets, rolling updates, and declarative manifests.",
                    "content_type": "video",
                    "content_url": "https://www.youtube.com/watch?v=X48VuDVv0do",
                    "reading_time_mins": 40,
                    "order_index": 2
                },
                {
                    "title": "Module 3: Services, Ingress Controllers & Networking",
                    "description": "ClusterIP, NodePort, LoadBalancer services, Ingress rules, DNS resolution, and network policies.",
                    "content_type": "document",
                    "content_url": "https://kubernetes.io/docs/concepts/services-networking/",
                    "reading_time_mins": 30,
                    "order_index": 3
                },
                {
                    "title": "Module 4: Persistent Volumes & StatefulSets",
                    "description": "StorageClasses, dynamic provisioning, PVCs, and stateful database management in clusters.",
                    "content_type": "interactive",
                    "content_url": "https://kubernetes.io/docs/concepts/storage/",
                    "reading_time_mins": 35,
                    "order_index": 4
                }
            ],
            "assessment": {
                "title": "Kubernetes Certified Professional Assessment",
                "description": "Comprehensive 5-question technical certification exam covering container networking, deployment strategies, and orchestration.",
                "passing_score": 75.0,
                "time_limit_mins": 25,
                "questions": [
                    {
                        "question_text": "Which Kubernetes resource guarantees that exactly one copy of a Pod runs on each designated worker node in the cluster?",
                        "options": ["Deployment", "DaemonSet", "StatefulSet", "ReplicaSet"],
                        "correct_option_index": 1,
                        "explanation": "A DaemonSet ensures that all (or some) Nodes run a copy of a Pod as nodes are added to the cluster."
                    },
                    {
                        "question_text": "In Kubernetes, which Service type exposes the Pods externally by creating a dedicated cloud provider infrastructure load balancer?",
                        "options": ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"],
                        "correct_option_index": 2,
                        "explanation": "LoadBalancer provisions an external cloud load balancer pointing to NodePort endpoints."
                    },
                    {
                        "question_text": "What is the primary role of kube-proxy on worker nodes?",
                        "options": ["Schedule pods on nodes", "Maintain network rules and forward TCP/UDP traffic", "Manage container runtimes", "Store cluster state in etcd"],
                        "correct_option_index": 1,
                        "explanation": "kube-proxy maintains network rules on nodes and handles request forwarding for Services."
                    },
                    {
                        "question_text": "Which deployment strategy launches a complete second version of pods alongside the old version and flips routing instantaneously?",
                        "options": ["Rolling Update", "Canary Deployment", "Blue/Green Deployment", "Recreate"],
                        "correct_option_index": 2,
                        "explanation": "Blue/Green deployment maintains two identical production environments with immediate cutover."
                    }
                ]
            }
        },
        {
            "title": "Full-Stack Development with FastAPI & React",
            "description": "Modern full-stack web engineering with Python FastAPI, asynchronous endpoints, SQLAlchemy ORM, React 18, Vite, and Tailwind CSS.",
            "category": "Web Development",
            "difficulty": "Intermediate",
            "duration_hours": 30,
            "passing_percentage": 70.0,
            "provider_email": "provider@cloudacademy.com",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: FastAPI Fundamentals & Pydantic Validation",
                    "description": "Type annotations, path parameters, query parameters, and automatic OpenAPI Swagger docs.",
                    "content_type": "document",
                    "content_url": "https://fastapi.tiangolo.com/tutorial/",
                    "reading_time_mins": 20,
                    "order_index": 1
                },
                {
                    "title": "Module 2: Relational Databases & SQLAlchemy 2.0 ORM",
                    "description": "Declarative base, sessions, foreign key constraints, migration strategies, and async drivers.",
                    "content_type": "document",
                    "content_url": "https://docs.sqlalchemy.org/en/20/",
                    "reading_time_mins": 30,
                    "order_index": 2
                },
                {
                    "title": "Module 3: React Single Page Architecture & Hooks",
                    "description": "Component lifecycles, useState, useEffect, Custom Hooks, and React Router v6.",
                    "content_type": "video",
                    "content_url": "https://react.dev/learn",
                    "reading_time_mins": 35,
                    "order_index": 3
                }
            ],
            "assessment": {
                "title": "Full-Stack Web Mastery Certification",
                "description": "Rigorous assessment evaluating full-stack application lifecycle, REST APIs, and client-side rendering.",
                "passing_score": 70.0,
                "time_limit_mins": 20,
                "questions": [
                    {
                        "question_text": "What standard Python mechanism does FastAPI utilize for automatic request validation and serialization?",
                        "options": ["Django Forms", "Pydantic Models & Python Type Hints", "Marshmallow Schemas", "Cerberus"],
                        "correct_option_index": 1,
                        "explanation": "FastAPI is built on Pydantic and leverages standard Python 3.6+ type hints for robust data validation."
                    },
                    {
                        "question_text": "Which React hook is specifically designed to perform side effects like data fetching and subscription listeners?",
                        "options": ["useMemo", "useCallback", "useEffect", "useReducer"],
                        "correct_option_index": 2,
                        "explanation": "useEffect lets you synchronize a component with external systems such as network requests and timers."
                    },
                    {
                        "question_text": "What header is standard for transmitting JWT Bearer tokens in HTTP REST requests?",
                        "options": ["X-Token", "Authorization: Bearer <token>", "Content-Auth", "Authentication"],
                        "correct_option_index": 1,
                        "explanation": "Standard OAuth 2.0 uses 'Authorization: Bearer <token>' in HTTP headers."
                    }
                ]
            }
        },
        {
            "title": "Enterprise Cybersecurity & Ethical Hacking",
            "description": "Comprehensive defense-in-depth principles, vulnerability assessments, penetration testing, cryptographic signatures, and zero-trust architectures.",
            "category": "Cybersecurity",
            "difficulty": "Advanced",
            "duration_hours": 42,
            "passing_percentage": 80.0,
            "provider_email": "elena.provider@datascience.io",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: Cryptographic Foundations & Public Key Infrastructure",
                    "description": "Symmetric vs asymmetric encryption, RSA, ECC, digital certificates, and hashing functions.",
                    "content_type": "document",
                    "content_url": "https://csrc.nist.gov/",
                    "reading_time_mins": 30,
                    "order_index": 1
                },
                {
                    "title": "Module 2: Network Penetration & Threat Modeling",
                    "description": "STRIDE framework, port auditing, packet sniffing with Wireshark, and firewall hardening.",
                    "content_type": "video",
                    "content_url": "https://owasp.org/",
                    "reading_time_mins": 45,
                    "order_index": 2
                }
            ],
            "assessment": {
                "title": "Certified Cybersecurity Specialist Exam",
                "description": "Evaluation of cryptographic integrity, access control paradigms, and threat mitigation.",
                "passing_score": 80.0,
                "time_limit_mins": 30,
                "questions": [
                    {
                        "question_text": "Which cryptographic algorithm is an asymmetric algorithm commonly used in digital signatures?",
                        "options": ["AES-256", "RSA", "ChaCha20", "DES"],
                        "correct_option_index": 1,
                        "explanation": "RSA uses public-private key pairs for asymmetric encryption and digital signatures."
                    },
                    {
                        "question_text": "What security principle enforces giving users only the bare minimum access rights required to perform their duties?",
                        "options": ["Principle of Least Privilege", "Separation of Duties", "Defense in Depth", "Fail-safe Defaults"],
                        "correct_option_index": 0,
                        "explanation": "The principle of least privilege dictates granting only necessary access permissions."
                    }
                ]
            }
        },
        {
            "title": "Applied Machine Learning & Deep Neural Networks",
            "description": "Supervised and unsupervised learning, gradient descent, PyTorch deep learning, convolutional networks, and transformer architectures.",
            "category": "AI & Data Science",
            "difficulty": "Intermediate",
            "duration_hours": 40,
            "passing_percentage": 75.0,
            "provider_email": "elena.provider@datascience.io",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: Feature Engineering & Preprocessing",
                    "description": "Handling missing values, one-hot encoding, feature normalization, and PCA dimensionality reduction.",
                    "content_type": "document",
                    "content_url": "https://scikit-learn.org/",
                    "reading_time_mins": 25,
                    "order_index": 1
                },
                {
                    "title": "Module 2: Neural Networks & Backpropagation",
                    "description": "Feedforward networks, activation functions (ReLU, GELU), loss functions, and Adam optimizer.",
                    "content_type": "document",
                    "content_url": "https://pytorch.org/",
                    "reading_time_mins": 35,
                    "order_index": 2
                }
            ],
            "assessment": {
                "title": "Deep Learning Practicum Examination",
                "description": "Certification exam testing mathematical intuition, model optimization, and hyperparameter tuning.",
                "passing_score": 75.0,
                "time_limit_mins": 20,
                "questions": [
                    {
                        "question_text": "Which technique prevents overfitting in deep neural networks by randomly zeroing out neuron outputs during training?",
                        "options": ["Batch Normalization", "Dropout", "Early Stopping", "Gradient Clipping"],
                        "correct_option_index": 1,
                        "explanation": "Dropout randomly sets input units to 0 with a frequency rate during training to prevent co-adaptation."
                    }
                ]
            }
        },
        {
            "title": "DevOps CI/CD Pipelines with GitHub Actions",
            "description": "Automate build, test, and container push pipelines, semantic versioning, artifact caching, and secrets management.",
            "category": "Cloud & DevOps",
            "difficulty": "Beginner",
            "duration_hours": 18,
            "passing_percentage": 70.0,
            "provider_email": "provider@cloudacademy.com",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: Workflow Syntax & Triggers",
                    "description": "YAML configuration, on: push/pull_request triggers, matrix builds, and environment variables.",
                    "content_type": "document",
                    "content_url": "https://docs.github.com/en/actions",
                    "reading_time_mins": 20,
                    "order_index": 1
                }
            ],
            "assessment": {
                "title": "CI/CD Pipeline Automation Test",
                "description": "Tests workflow automation triggers, secret injection, and multi-stage container deployment.",
                "passing_score": 70.0,
                "time_limit_mins": 15,
                "questions": [
                    {
                        "question_text": "In a GitHub Actions workflow YAML file, which keyword defines the sequence of automated commands in a job?",
                        "options": ["runs", "steps", "pipeline", "tasks"],
                        "correct_option_index": 1,
                        "explanation": "Jobs contain a sequence of tasks called 'steps' that execute individual actions or scripts."
                    }
                ]
            }
        },
        {
            "title": "Enterprise Java & Spring Boot Microservices",
            "description": "Master professional Java 21, object-oriented software engineering, Spring Boot 3 framework, Spring Data JPA, RESTful microservices, and Apache Kafka integration.",
            "category": "Software Engineering",
            "difficulty": "Intermediate",
            "duration_hours": 36,
            "passing_percentage": 75.0,
            "provider_email": "provider@cloudacademy.com",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: Java 21 Core, OOP & JVM Memory Model",
                    "description": "Object-oriented programming, interfaces, generics, garbage collection, heap vs stack, and Java Virtual Machine optimization.",
                    "content_type": "document",
                    "content_url": "https://docs.oracle.com/en/java/",
                    "reading_time_mins": 25,
                    "order_index": 1
                },
                {
                    "title": "Module 2: Spring Boot 3, Dependency Injection & JPA",
                    "description": "Spring core container, IoC, Spring Data repositories, Hibernate ORM, and database transaction management.",
                    "content_type": "video",
                    "content_url": "https://spring.io/projects/spring-boot",
                    "reading_time_mins": 35,
                    "order_index": 2
                },
                {
                    "title": "Module 3: Microservices Architecture & Kafka Messaging",
                    "description": "Decoupled service design, API Gateways, Eureka service discovery, distributed tracing, and event streaming.",
                    "content_type": "interactive",
                    "content_url": "https://kafka.apache.org/documentation/",
                    "reading_time_mins": 40,
                    "order_index": 3
                }
            ],
            "assessment": {
                "title": "Enterprise Java & Spring Boot Professional Certification",
                "description": "Evaluate memory management, Spring Beans lifecycles, and resilient microservice design.",
                "passing_score": 75.0,
                "time_limit_mins": 25,
                "questions": [
                    {
                        "question_text": "Which garbage collection area in the JVM holds objects created using the new keyword?",
                        "options": ["Stack Memory", "Heap Memory", "Metaspace", "Program Counter Register"],
                        "correct_option_index": 1,
                        "explanation": "In Java, all objects and instances are dynamically allocated on the Heap Memory."
                    },
                    {
                        "question_text": "Which Spring annotation is used to auto-wire collaborator beans into a Spring component?",
                        "options": ["@Component", "@Autowired", "@Entity", "@Service"],
                        "correct_option_index": 1,
                        "explanation": "@Autowired enables constructor or field-level dependency injection in Spring."
                    },
                    {
                        "question_text": "In a Kafka microservices architecture, what guarantees ordered message consumption within a partition?",
                        "options": ["Message Key Hashing", "Consumer Group Round-Robin", "Topic Replication Factor", "Zookeeper Quorum"],
                        "correct_option_index": 0,
                        "explanation": "Messages with the same key are assigned to the exact same partition, guaranteeing chronological order."
                    }
                ]
            }
        },
        {
            "title": "Low-Level Systems Programming & Memory Management in C",
            "description": "Master C23 fundamentals, pointer arithmetic, dynamic memory allocation with malloc/free, Unix system calls, multi-threading with pthreads, and cache-conscious optimization.",
            "category": "Systems & Security",
            "difficulty": "Intermediate",
            "duration_hours": 32,
            "passing_percentage": 75.0,
            "provider_email": "provider@cloudacademy.com",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: Pointers, Memory Allocation & Data Structures",
                    "description": "Direct memory addressing, double pointers, custom memory allocators, struct alignments, and memory leak prevention with Valgrind.",
                    "content_type": "document",
                    "content_url": "https://en.cppreference.com/w/c",
                    "reading_time_mins": 30,
                    "order_index": 1
                },
                {
                    "title": "Module 2: Unix System Calls & Process Management",
                    "description": "File descriptors, fork(), execvp(), pipes, signal handling, and inter-process communication (IPC).",
                    "content_type": "document",
                    "content_url": "https://man7.org/linux/man-pages/",
                    "reading_time_mins": 35,
                    "order_index": 2
                },
                {
                    "title": "Module 3: POSIX Multi-threading & Synchronization",
                    "description": "Race conditions, thread creation with pthread_create, mutex locks, condition variables, and deadlock avoidance.",
                    "content_type": "interactive",
                    "content_url": "https://computing.llnl.gov/tutorials/pthreads/",
                    "reading_time_mins": 40,
                    "order_index": 3
                }
            ],
            "assessment": {
                "title": "C Systems Programming Specialist Certification",
                "description": "Rigorous assessment of pointer manipulation, system call semantics, and concurrency control.",
                "passing_score": 75.0,
                "time_limit_mins": 25,
                "questions": [
                    {
                        "question_text": "What standard library function in C releases dynamically allocated heap memory back to the operating system allocator?",
                        "options": ["delete()", "free()", "dealloc()", "release()"],
                        "correct_option_index": 1,
                        "explanation": "The free() function deallocates memory blocks previously allocated by malloc, calloc, or realloc."
                    },
                    {
                        "question_text": "What system call in Unix creates an exact duplicate copy of the calling process?",
                        "options": ["clone()", "exec()", "fork()", "spawn()"],
                        "correct_option_index": 2,
                        "explanation": "fork() creates a new child process with a duplicated address space."
                    },
                    {
                        "question_text": "What is the consequence of dereferencing a dangling pointer in C?",
                        "options": ["Compile-time syntax error", "Undefined behavior or Segmentation Fault", "Automatic null-pointer redirection", "Memory is reallocated"],
                        "correct_option_index": 1,
                        "explanation": "Dereferencing a pointer that points to deallocated memory leads to undefined behavior or SIGSEGV."
                    }
                ]
            }
        },
        {
            "title": "Modern C++20 & High-Performance Systems Architecture",
            "description": "Modern C++ features including RAII, smart pointers, C++20 concepts and ranges, move semantics, template metaprogramming, and lock-free concurrency.",
            "category": "Software Engineering",
            "difficulty": "Advanced",
            "duration_hours": 38,
            "passing_percentage": 80.0,
            "provider_email": "provider@cloudacademy.com",
            "status": "approved",
            "thumbnail_url": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80",
            "modules": [
                {
                    "title": "Module 1: RAII, Move Semantics & Smart Pointers",
                    "description": "Resource Acquisition Is Initialization, rvalue references, std::move, unique_ptr, shared_ptr, and custom deleters.",
                    "content_type": "document",
                    "content_url": "https://isocpp.org/",
                    "reading_time_mins": 30,
                    "order_index": 1
                },
                {
                    "title": "Module 2: C++20 Concepts, Coroutines & Ranges",
                    "description": "Constrained template parameters with concepts, functional range pipelines, and cooperative multitasking with coroutines.",
                    "content_type": "video",
                    "content_url": "https://en.cppreference.com/w/cpp/20",
                    "reading_time_mins": 35,
                    "order_index": 2
                }
            ],
            "assessment": {
                "title": "Modern C++ Professional Certification Exam",
                "description": "Evaluate object lifetime management, template specialization, and modern C++ idiom mastery.",
                "passing_score": 80.0,
                "time_limit_mins": 25,
                "questions": [
                    {
                        "question_text": "Which smart pointer in modern C++ represents exclusive, non-shareable ownership of a dynamically allocated object?",
                        "options": ["std::shared_ptr", "std::unique_ptr", "std::weak_ptr", "std::auto_ptr"],
                        "correct_option_index": 1,
                        "explanation": "std::unique_ptr enforces single, non-copyable ownership of a heap resource."
                    },
                    {
                        "question_text": "What C++20 feature provides compile-time predicate validation for template arguments?",
                        "options": ["Concepts", "Modules", "Coroutines", "Ranges"],
                        "correct_option_index": 0,
                        "explanation": "Concepts specify compile-time requirements on template parameters, giving clear compiler diagnostics."
                    }
                ]
            }
        }
    ]
    return users_data, courses_data


def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("Seeding initial production data for Online Course Certification Portal...")
    users_data, courses_data = _get_seed_catalog()

    users = {}
    for u in users_data:
        user_obj = User(
            name=u["name"],
            email=u["email"],
            password_hash=get_password_hash(u["password"]),
            role=u["role"],
            organization=u["organization"],
            is_active=u["is_active"],
            created_at=datetime.utcnow() - timedelta(days=60)
        )
        db.add(user_obj)
        db.flush()
        users[u["email"]] = user_obj

    courses = {}
    assessments_dict = {}

    for c in courses_data:
        prov = users[c["provider_email"]]
        course_obj = Course(
            title=c["title"],
            description=c["description"],
            provider_id=prov.id,
            category=c["category"],
            difficulty=c["difficulty"],
            duration_hours=c["duration_hours"],
            passing_percentage=c["passing_percentage"],
            status=c["status"],
            thumbnail_url=c["thumbnail_url"],
            created_at=datetime.utcnow() - timedelta(days=45)
        )
        db.add(course_obj)
        db.flush()
        courses[c["title"]] = course_obj

        # Add modules
        for m in c["modules"]:
            mod_obj = CourseModule(
                course_id=course_obj.id,
                title=m["title"],
                description=m["description"],
                content_type=m["content_type"],
                content_url=m["content_url"],
                reading_time_mins=m["reading_time_mins"],
                order_index=m["order_index"],
                created_at=datetime.utcnow() - timedelta(days=40)
            )
            db.add(mod_obj)
        db.flush()

        # Add assessment
        a_data = c["assessment"]
        assessment_obj = Assessment(
            course_id=course_obj.id,
            title=a_data["title"],
            description=a_data["description"],
            passing_score=a_data["passing_score"],
            time_limit_mins=a_data["time_limit_mins"],
            created_at=datetime.utcnow() - timedelta(days=35)
        )
        db.add(assessment_obj)
        db.flush()
        assessments_dict[course_obj.id] = assessment_obj

        for q in a_data["questions"]:
            q_obj = AssessmentQuestion(
                assessment_id=assessment_obj.id,
                question_text=q["question_text"],
                options=json.dumps(q["options"]),
                correct_option_index=q["correct_option_index"],
                explanation=q["explanation"]
            )
            db.add(q_obj)
        db.flush()

    # 3. Enrollments for Alex Mercer & Maya Patel & James Thornton
    alex = users["learner@stanford.edu"]
    maya = users["maya.patel@student.edu"]
    james = users["james.thornton@columbia.edu"]

    c1 = courses["Cloud Architecture & Kubernetes Orchestration"]
    c2 = courses["Full-Stack Development with FastAPI & React"]
    c3 = courses["Enterprise Cybersecurity & Ethical Hacking"]
    c4 = courses["Applied Machine Learning & Deep Neural Networks"]

    # Alex completed C1 and C2
    c1_modules = [m.id for m in c1.modules]
    e1 = Enrollment(
        user_id=alex.id,
        course_id=c1.id,
        status="completed",
        progress_percentage=100.0,
        completed_modules=json.dumps(c1_modules),
        enrolled_at=datetime.utcnow() - timedelta(days=25),
        completed_at=datetime.utcnow() - timedelta(days=10)
    )
    db.add(e1)

    c2_modules = [m.id for m in c2.modules]
    e2 = Enrollment(
        user_id=alex.id,
        course_id=c2.id,
        status="completed",
        progress_percentage=100.0,
        completed_modules=json.dumps(c2_modules),
        enrolled_at=datetime.utcnow() - timedelta(days=20),
        completed_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(e2)

    # Alex in progress for C3
    e3 = Enrollment(
        user_id=alex.id,
        course_id=c3.id,
        status="in_progress",
        progress_percentage=50.0,
        completed_modules=json.dumps([c3.modules[0].id] if c3.modules else []),
        enrolled_at=datetime.utcnow() - timedelta(days=8),
        completed_at=None
    )
    db.add(e3)

    # Maya completed C2
    e4 = Enrollment(
        user_id=maya.id,
        course_id=c2.id,
        status="completed",
        progress_percentage=100.0,
        completed_modules=json.dumps(c2_modules),
        enrolled_at=datetime.utcnow() - timedelta(days=18),
        completed_at=datetime.utcnow() - timedelta(days=7)
    )
    db.add(e4)

    # Maya in progress for C1
    e5 = Enrollment(
        user_id=maya.id,
        course_id=c1.id,
        status="in_progress",
        progress_percentage=75.0,
        completed_modules=json.dumps(c1_modules[:3]),
        enrolled_at=datetime.utcnow() - timedelta(days=14)
    )
    db.add(e5)

    # James in progress for C4
    e6 = Enrollment(
        user_id=james.id,
        course_id=c4.id,
        status="in_progress",
        progress_percentage=50.0,
        completed_modules=json.dumps([c4.modules[0].id] if c4.modules else []),
        enrolled_at=datetime.utcnow() - timedelta(days=12)
    )
    db.add(e6)
    db.flush()

    # 4. Assessment Results
    a1 = assessments_dict[c1.id]
    a2 = assessments_dict[c2.id]

    r1 = AssessmentResult(
        assessment_id=a1.id,
        user_id=alex.id,
        score=100.0,
        total_questions=4,
        passed=True,
        submitted_at=datetime.utcnow() - timedelta(days=10)
    )
    db.add(r1)

    r2 = AssessmentResult(
        assessment_id=a2.id,
        user_id=alex.id,
        score=95.0,
        total_questions=3,
        passed=True,
        submitted_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(r2)

    r3 = AssessmentResult(
        assessment_id=a2.id,
        user_id=maya.id,
        score=88.0,
        total_questions=3,
        passed=True,
        submitted_at=datetime.utcnow() - timedelta(days=7)
    )
    db.add(r3)
    db.flush()

    # 5. Certificates (Both VALID and one sample REVOKED)
    cert1 = Certificate(
        certificate_id="CERT-2026-98124",
        verification_id="VFY-8A7B6C5D4E3F",
        learner_id=alex.id,
        course_id=c1.id,
        provider_id=c1.provider_id,
        score=100.0,
        issue_date=datetime.utcnow() - timedelta(days=10),
        completion_date=datetime.utcnow() - timedelta(days=10),
        status="valid",
        qr_code_data="/verify/VFY-8A7B6C5D4E3F"
    )
    db.add(cert1)

    cert2 = Certificate(
        certificate_id="CERT-2026-44019",
        verification_id="VFY-3K9L2M5N8P1Q",
        learner_id=alex.id,
        course_id=c2.id,
        provider_id=c2.provider_id,
        score=95.0,
        issue_date=datetime.utcnow() - timedelta(days=5),
        completion_date=datetime.utcnow() - timedelta(days=5),
        status="valid",
        qr_code_data="/verify/VFY-3K9L2M5N8P1Q"
    )
    db.add(cert2)

    cert3 = Certificate(
        certificate_id="CERT-2026-11892",
        verification_id="VFY-7X4W1Z9V2U0T",
        learner_id=maya.id,
        course_id=c2.id,
        provider_id=c2.provider_id,
        score=88.0,
        issue_date=datetime.utcnow() - timedelta(days=7),
        completion_date=datetime.utcnow() - timedelta(days=7),
        status="valid",
        qr_code_data="/verify/VFY-7X4W1Z9V2U0T"
    )
    db.add(cert3)

    # Revoked certificate for demonstrating revocation check & report
    cert_revoked = Certificate(
        certificate_id="CERT-2026-66521",
        verification_id="VFY-9REVOKED001",
        learner_id=james.id,
        course_id=c3.id,
        provider_id=c3.provider_id,
        score=72.0,
        issue_date=datetime.utcnow() - timedelta(days=30),
        completion_date=datetime.utcnow() - timedelta(days=30),
        status="revoked",
        revocation_reason="Academic integrity violation: Plagiarized practical lab submission identified during post-audit review.",
        revoked_at=datetime.utcnow() - timedelta(days=2),
        qr_code_data="/verify/VFY-9REVOKED001"
    )
    db.add(cert_revoked)
    db.flush()

    # 6. Verification Requests from Employers
    vr1 = VerificationRequest(
        request_id="VR-2026-0041",
        requester_name="Rachel Green",
        requester_email="recruiter@techcorp.com",
        requester_organization="TechCorp Global Talent Acquisition",
        certificate_id="CERT-2026-98124",
        status="verified",
        notes="Candidate verification for Senior Site Reliability Engineer position.",
        verified_at=datetime.utcnow() - timedelta(days=4),
        created_at=datetime.utcnow() - timedelta(days=4)
    )
    db.add(vr1)

    vr2 = VerificationRequest(
        request_id="VR-2026-0042",
        requester_name="Michael Chang",
        requester_email="mchang@google-recruiting.com",
        requester_organization="Apex Enterprise Solutions",
        certificate_id="CERT-2026-44019",
        status="verified",
        notes="Pre-employment academic credential audit.",
        verified_at=datetime.utcnow() - timedelta(days=2),
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(vr2)

    vr3 = VerificationRequest(
        request_id="VR-2026-0043",
        requester_name="David Sterling",
        requester_email="dsterling@hedgefund.com",
        requester_organization="Sterling Capital Management",
        certificate_id="CERT-2026-66521",
        status="rejected",
        notes="Requested validation of cybersecurity clearance certificate. Status confirmed as REVOKED.",
        verified_at=datetime.utcnow() - timedelta(days=1),
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(vr3)

    # 7. System Settings
    settings_items = [
        {"key": "platform_name", "value": "Online Course Certification and Credential Verification Portal", "description": "Global display title for verification portal"},
        {"key": "default_passing_percentage", "value": "75.0", "description": "Default threshold passing score for newly created assessments"},
        {"key": "auto_issue_certificates", "value": "true", "description": "Automatically issue signed digital certificates upon 100% course completion & passed exam"},
        {"key": "verification_mode", "value": "instant", "description": "Real-time cryptographically hashed verification lookup mode"},
        {"key": "support_email", "value": "credentials@credentialverify.local", "description": "Official registrar contact address for verification queries"},
        {"key": "security_seal_enabled", "value": "true", "description": "Render official gold security seal graphic on PDF certificates"}
    ]
    for s in settings_items:
        db.add(SystemSetting(key=s["key"], value=s["value"], description=s["description"], updated_at=datetime.utcnow()))

    db.commit()
    print("Database seeding successfully completed!")


def seed_mongo_database(mdb):
    """Seed initial portal data into MongoDB Atlas if the database is empty."""
    if mdb["users"].count_documents({}) > 0:
        return

    print("Seeding initial production data into MongoDB...")
    users_data, courses_data = _get_seed_catalog()
    now = datetime.utcnow()

    # 1. Users
    users = {}
    for u in users_data:
        uid = next_seq(mdb, "users")
        user_doc = {
            "id": uid,
            "name": u["name"],
            "email": u["email"].lower().strip(),
            "password_hash": get_password_hash(u["password"]),
            "role": u["role"],
            "organization": u["organization"],
            "is_active": u["is_active"],
            "created_at": now - timedelta(days=60),
            "updated_at": now - timedelta(days=60),
        }
        mdb["users"].insert_one(user_doc)
        users[u["email"]] = user_doc

    # 2. Courses, Modules, Assessments & Questions
    courses = {}
    course_modules_map = {}
    assessments_dict = {}

    for c in courses_data:
        prov = users[c["provider_email"]]
        cid = next_seq(mdb, "courses")
        course_doc = {
            "id": cid,
            "title": c["title"],
            "description": c["description"],
            "provider_id": prov["id"],
            "category": c["category"],
            "difficulty": c["difficulty"],
            "duration_hours": c["duration_hours"],
            "passing_percentage": c["passing_percentage"],
            "status": c["status"],
            "thumbnail_url": c["thumbnail_url"],
            "created_at": now - timedelta(days=45),
            "updated_at": now - timedelta(days=45),
        }
        mdb["courses"].insert_one(course_doc)
        courses[c["title"]] = course_doc

        mod_ids = []
        for m in c["modules"]:
            mid = next_seq(mdb, "course_modules")
            mdb["course_modules"].insert_one({
                "id": mid,
                "course_id": cid,
                "title": m["title"],
                "description": m["description"],
                "content_type": m["content_type"],
                "content_url": m["content_url"],
                "reading_time_mins": m["reading_time_mins"],
                "order_index": m["order_index"],
                "created_at": now - timedelta(days=40),
            })
            mod_ids.append(mid)
        course_modules_map[cid] = mod_ids

        a_data = c["assessment"]
        aid = next_seq(mdb, "assessments")
        assessment_doc = {
            "id": aid,
            "course_id": cid,
            "title": a_data["title"],
            "description": a_data["description"],
            "passing_score": a_data["passing_score"],
            "time_limit_mins": a_data["time_limit_mins"],
            "created_at": now - timedelta(days=35),
        }
        mdb["assessments"].insert_one(assessment_doc)
        assessments_dict[cid] = assessment_doc

        for q in a_data["questions"]:
            qid = next_seq(mdb, "assessment_questions")
            mdb["assessment_questions"].insert_one({
                "id": qid,
                "assessment_id": aid,
                "question_text": q["question_text"],
                "options": q["options"],
                "correct_option_index": q["correct_option_index"],
                "explanation": q["explanation"],
            })

    # 3. Enrollments
    alex = users["learner@stanford.edu"]
    maya = users["maya.patel@student.edu"]
    james = users["james.thornton@columbia.edu"]

    c1 = courses["Cloud Architecture & Kubernetes Orchestration"]
    c2 = courses["Full-Stack Development with FastAPI & React"]
    c3 = courses["Enterprise Cybersecurity & Ethical Hacking"]
    c4 = courses["Applied Machine Learning & Deep Neural Networks"]

    c1_modules = course_modules_map[c1["id"]]
    c2_modules = course_modules_map[c2["id"]]
    c3_modules = course_modules_map[c3["id"]]
    c4_modules = course_modules_map[c4["id"]]

    enrollments_seed = [
        {
            "id": next_seq(mdb, "enrollments"),
            "user_id": alex["id"],
            "course_id": c1["id"],
            "status": "completed",
            "progress_percentage": 100.0,
            "completed_modules": json.dumps(c1_modules),
            "enrolled_at": now - timedelta(days=25),
            "completed_at": now - timedelta(days=10),
        },
        {
            "id": next_seq(mdb, "enrollments"),
            "user_id": alex["id"],
            "course_id": c2["id"],
            "status": "completed",
            "progress_percentage": 100.0,
            "completed_modules": json.dumps(c2_modules),
            "enrolled_at": now - timedelta(days=20),
            "completed_at": now - timedelta(days=5),
        },
        {
            "id": next_seq(mdb, "enrollments"),
            "user_id": alex["id"],
            "course_id": c3["id"],
            "status": "in_progress",
            "progress_percentage": 50.0,
            "completed_modules": json.dumps([c3_modules[0]] if c3_modules else []),
            "enrolled_at": now - timedelta(days=8),
            "completed_at": None,
        },
        {
            "id": next_seq(mdb, "enrollments"),
            "user_id": maya["id"],
            "course_id": c2["id"],
            "status": "completed",
            "progress_percentage": 100.0,
            "completed_modules": json.dumps(c2_modules),
            "enrolled_at": now - timedelta(days=18),
            "completed_at": now - timedelta(days=7),
        },
        {
            "id": next_seq(mdb, "enrollments"),
            "user_id": maya["id"],
            "course_id": c1["id"],
            "status": "in_progress",
            "progress_percentage": 75.0,
            "completed_modules": json.dumps(c1_modules[:3]),
            "enrolled_at": now - timedelta(days=14),
            "completed_at": None,
        },
        {
            "id": next_seq(mdb, "enrollments"),
            "user_id": james["id"],
            "course_id": c4["id"],
            "status": "in_progress",
            "progress_percentage": 50.0,
            "completed_modules": json.dumps([c4_modules[0]] if c4_modules else []),
            "enrolled_at": now - timedelta(days=12),
            "completed_at": None,
        },
    ]
    mdb["enrollments"].insert_many(enrollments_seed)

    # 4. Assessment Results
    a1 = assessments_dict[c1["id"]]
    a2 = assessments_dict[c2["id"]]
    mdb["assessment_results"].insert_many([
        {
            "id": next_seq(mdb, "assessment_results"),
            "assessment_id": a1["id"],
            "user_id": alex["id"],
            "score": 100.0,
            "total_questions": 4,
            "passed": True,
            "submitted_at": now - timedelta(days=10),
        },
        {
            "id": next_seq(mdb, "assessment_results"),
            "assessment_id": a2["id"],
            "user_id": alex["id"],
            "score": 95.0,
            "total_questions": 3,
            "passed": True,
            "submitted_at": now - timedelta(days=5),
        },
        {
            "id": next_seq(mdb, "assessment_results"),
            "assessment_id": a2["id"],
            "user_id": maya["id"],
            "score": 88.0,
            "total_questions": 3,
            "passed": True,
            "submitted_at": now - timedelta(days=7),
        },
    ])

    # 5. Certificates
    mdb["certificates"].insert_many([
        {
            "id": next_seq(mdb, "certificates"),
            "certificate_id": "CERT-2026-98124",
            "verification_id": "VFY-8A7B6C5D4E3F",
            "learner_id": alex["id"],
            "course_id": c1["id"],
            "provider_id": c1["provider_id"],
            "score": 100.0,
            "issue_date": now - timedelta(days=10),
            "completion_date": now - timedelta(days=10),
            "status": "valid",
            "revocation_reason": None,
            "revoked_at": None,
            "qr_code_data": "/verify/VFY-8A7B6C5D4E3F",
        },
        {
            "id": next_seq(mdb, "certificates"),
            "certificate_id": "CERT-2026-44019",
            "verification_id": "VFY-3K9L2M5N8P1Q",
            "learner_id": alex["id"],
            "course_id": c2["id"],
            "provider_id": c2["provider_id"],
            "score": 95.0,
            "issue_date": now - timedelta(days=5),
            "completion_date": now - timedelta(days=5),
            "status": "valid",
            "revocation_reason": None,
            "revoked_at": None,
            "qr_code_data": "/verify/VFY-3K9L2M5N8P1Q",
        },
        {
            "id": next_seq(mdb, "certificates"),
            "certificate_id": "CERT-2026-11892",
            "verification_id": "VFY-7X4W1Z9V2U0T",
            "learner_id": maya["id"],
            "course_id": c2["id"],
            "provider_id": c2["provider_id"],
            "score": 88.0,
            "issue_date": now - timedelta(days=7),
            "completion_date": now - timedelta(days=7),
            "status": "valid",
            "revocation_reason": None,
            "revoked_at": None,
            "qr_code_data": "/verify/VFY-7X4W1Z9V2U0T",
        },
        {
            "id": next_seq(mdb, "certificates"),
            "certificate_id": "CERT-2026-66521",
            "verification_id": "VFY-9REVOKED001",
            "learner_id": james["id"],
            "course_id": c3["id"],
            "provider_id": c3["provider_id"],
            "score": 72.0,
            "issue_date": now - timedelta(days=30),
            "completion_date": now - timedelta(days=30),
            "status": "revoked",
            "revocation_reason": "Academic integrity violation: Plagiarized practical lab submission identified during post-audit review.",
            "revoked_at": now - timedelta(days=2),
            "qr_code_data": "/verify/VFY-9REVOKED001",
        },
    ])

    # 6. Verification Requests
    mdb["verification_requests"].insert_many([
        {
            "id": next_seq(mdb, "verification_requests"),
            "request_id": "VR-2026-0041",
            "requester_name": "Rachel Green",
            "requester_email": "recruiter@techcorp.com",
            "requester_organization": "TechCorp Global Talent Acquisition",
            "certificate_id": "CERT-2026-98124",
            "status": "verified",
            "notes": "Candidate verification for Senior Site Reliability Engineer position.",
            "verified_at": now - timedelta(days=4),
            "created_at": now - timedelta(days=4),
        },
        {
            "id": next_seq(mdb, "verification_requests"),
            "request_id": "VR-2026-0042",
            "requester_name": "Michael Chang",
            "requester_email": "mchang@google-recruiting.com",
            "requester_organization": "Apex Enterprise Solutions",
            "certificate_id": "CERT-2026-44019",
            "status": "verified",
            "notes": "Pre-employment academic credential audit.",
            "verified_at": now - timedelta(days=2),
            "created_at": now - timedelta(days=2),
        },
        {
            "id": next_seq(mdb, "verification_requests"),
            "request_id": "VR-2026-0043",
            "requester_name": "David Sterling",
            "requester_email": "dsterling@hedgefund.com",
            "requester_organization": "Sterling Capital Management",
            "certificate_id": "CERT-2026-66521",
            "status": "rejected",
            "notes": "Requested validation of cybersecurity clearance certificate. Status confirmed as REVOKED.",
            "verified_at": now - timedelta(days=1),
            "created_at": now - timedelta(days=1),
        },
    ])

    # 7. System Settings
    settings_items = [
        {"key": "platform_name", "value": "Online Course Certification and Credential Verification Portal", "description": "Global display title for verification portal"},
        {"key": "default_passing_percentage", "value": "75.0", "description": "Default threshold passing score for newly created assessments"},
        {"key": "auto_issue_certificates", "value": "true", "description": "Automatically issue signed digital certificates upon 100% course completion & passed exam"},
        {"key": "verification_mode", "value": "instant", "description": "Real-time cryptographically hashed verification lookup mode"},
        {"key": "support_email", "value": "credentials@credentialverify.local", "description": "Official registrar contact address for verification queries"},
        {"key": "security_seal_enabled", "value": "true", "description": "Render official gold security seal graphic on PDF certificates"},
    ]
    for s in settings_items:
        mdb["system_settings"].insert_one({
            "id": next_seq(mdb, "system_settings"),
            "key": s["key"],
            "value": s["value"],
            "description": s["description"],
            "updated_at": now,
        })

    print("MongoDB seeding successfully completed!")

