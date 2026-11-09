import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import (
    auth_router,
    users_router,
    courses_router,
    enrollments_router,
    assessments_router,
    certificates_router,
    verification_router,
    reports_router,
    settings_router,
)
from app.seed_data import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("credential_portal")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created & seeded
    try:
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Seed initial production demo data
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database initialization warning: {e}")
    yield
    # Shutdown
    logger.info("Application shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade Online Course Certification and Credential Verification Portal REST API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(courses_router, prefix=settings.API_V1_STR)
app.include_router(enrollments_router, prefix=settings.API_V1_STR)
app.include_router(assessments_router, prefix=settings.API_V1_STR)
app.include_router(certificates_router, prefix=settings.API_V1_STR)
app.include_router(verification_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "portal": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "api_docs": "/docs",
        "endpoints": {
            "auth": f"{settings.API_V1_STR}/auth",
            "users": f"{settings.API_V1_STR}/users",
            "courses": f"{settings.API_V1_STR}/courses",
            "enrollments": f"{settings.API_V1_STR}/enrollments",
            "assessments": f"{settings.API_V1_STR}/assessments",
            "certificates": f"{settings.API_V1_STR}/certificates",
            "verification": f"{settings.API_V1_STR}/verify/{{verification_id}}",
            "reports": f"{settings.API_V1_STR}/reports",
            "settings": f"{settings.API_V1_STR}/settings"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "credential-portal-backend"}
