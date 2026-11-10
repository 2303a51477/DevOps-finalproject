import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings
from app.mongo_db import mongo_manager

logger = logging.getLogger("credential_portal.database")

Base = declarative_base()

ACTIVE_DB_BACKEND = "sqlite"
engine = None
SessionLocal = None


def _init_sqlalchemy_engine():
    force_sqlite = settings.DB_BACKEND == "sqlite" or os.getenv("USE_SQLITE", "false").lower() == "true"

    if not force_sqlite:
        try:
            mysql_url = settings.DATABASE_URL
            eng = create_engine(
                mysql_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 3},
            )
            with eng.connect():
                logger.info("Successfully connected to MySQL database.")
            return eng, "mysql"
        except Exception as e:
            logger.warning(
                f"Could not connect to MySQL ({e}). Falling back to local SQLite database for standalone execution."
            )

    eng = create_engine(
        settings.SQLITE_URL,
        connect_args={"check_same_thread": False},
    )
    logger.info("Using SQLite database at credential_portal.db")
    return eng, "sqlite"


def configure_database():
    global ACTIVE_DB_BACKEND, engine, SessionLocal

    use_mongo = settings.DB_BACKEND == "mongodb" or (
        settings.DB_BACKEND == "auto" and bool(settings.MONGODB_URI)
    )

    if use_mongo:
        ACTIVE_DB_BACKEND = "mongodb"
        mdb = mongo_manager.connect()
        if mdb is not None:
            return
        logger.error("MongoDB mode requested, but connection could not be established.")
        return

    engine, ACTIVE_DB_BACKEND = _init_sqlalchemy_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


configure_database()


def get_db():
    if ACTIVE_DB_BACKEND == "mongodb":
        if mongo_manager.db is None:
            mongo_manager.connect()
        if mongo_manager.db is None:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"MongoDB connection unavailable: {mongo_manager.last_error or 'Check MONGODB_URI credentials in backend/.env'}",
            )
        yield mongo_manager.db
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
