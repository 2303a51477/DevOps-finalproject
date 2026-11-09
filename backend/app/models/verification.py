from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "VR-2026-0042"
    requester_name = Column(String(150), nullable=False)
    requester_email = Column(String(191), nullable=False)
    requester_organization = Column(String(200), nullable=True)
    certificate_id = Column(String(64), nullable=False)
    status = Column(String(50), default="verified") # verified, pending, rejected
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
