import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("credential_portal.database")

Base = declarative_base()

def get_engine():
    # If explicit SQLITE override or in test environment without MySQL
    force_sqlite = os.getenv("USE_SQLITE", "false").lower() == "true"
    
    if not force_sqlite:
        try:
            mysql_url = settings.DATABASE_URL
            engine = create_engine(
                mysql_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 3}
            )
            # Test connection
            with engine.connect() as conn:
                logger.info("Successfully connected to MySQL database.")
            return engine
        except Exception as e:
            logger.warning(f"Could not connect to MySQL ({e}). Falling back to local SQLite database for standalone execution.")
            
    # SQLite fallback
    engine = create_engine(
        settings.SQLITE_URL,
        connect_args={"check_same_thread": False}
    )
    logger.info("Using SQLite database at credential_portal.db")
    return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
