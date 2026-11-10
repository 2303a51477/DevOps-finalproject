import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app import database as db_module
from app.mongo_db import mongo_manager
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
from app.seed_data import seed_database, seed_mongo_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("credential_portal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema/indexes are initialized & seeded
    try:
        if db_module.ACTIVE_DB_BACKEND == "mongodb":
            if mongo_manager.db is None:
                mongo_manager.connect()
            if mongo_manager.db is not None:
                seed_mongo_database(mongo_manager.db)
                logger.info("MongoDB database initialized and verified successfully.")
            else:
                logger.error(f"MongoDB startup initialization failed: {mongo_manager.last_error}")
        else:
            logger.info("Initializing database schema...")
            db_module.Base.metadata.create_all(bind=db_module.engine)
            logger.info("Database tables initialized successfully.")

            # Seed initial production demo data
            db = db_module.SessionLocal()
            try:
                seed_database(db)
            finally:
                db.close()
    except Exception as e:
        logger.error(f"Database initialization warning: {e}")
    yield
    # Shutdown
    mongo_manager.close()
    logger.info("Application shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade Online Course Certification and Credential Verification Portal REST API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
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
        "database_backend": db_module.ACTIVE_DB_BACKEND,
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
            "settings": f"{settings.API_V1_STR}/settings",
        },
    }


@app.get("/health")
def health_check():
    if db_module.ACTIVE_DB_BACKEND == "mongodb":
        connected = mongo_manager.connected and mongo_manager.db is not None
        return {
            "status": "healthy" if connected else "degraded",
            "service": "credential-portal-backend",
            "database": "mongodb",
            "db_name": settings.MONGODB_DB_NAME,
            "db_connected": connected,
        }

    return {
        "status": "healthy",
        "service": "credential-portal-backend",
        "database": db_module.ACTIVE_DB_BACKEND,
        "db_connected": True,
    }
