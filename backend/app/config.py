import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env first (if present), then workspace .env as fallback
_BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_DIR / ".env")
load_dotenv()


class Settings:
    PROJECT_NAME: str = "Online Course Certification and Credential Verification Portal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    SECRET_KEY: str = os.getenv("SECRET_KEY", "credential-portal-super-secret-production-key-2026-98124")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database backend selection: "auto" (default), "mongodb", "mysql", or "sqlite"
    DB_BACKEND: str = os.getenv("DB_BACKEND", "auto").strip().lower()

    # MongoDB Atlas configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "").strip()
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "credential_portal").strip() or "credential_portal"

    # MySQL / SQLite fallback configuration
    MYSQL_USER: str = os.getenv("MYSQL_USER", "portal_user")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "portal_password123")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "credential_portal")

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
    )
    SQLITE_URL: str = "sqlite:///./credential_portal.db"

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()
