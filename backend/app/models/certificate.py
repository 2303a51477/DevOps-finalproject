from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    certificate_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "CERT-2026-88192"
    verification_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "VFY-7D8E9F10A"
    learner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=100.0)
    issue_date = Column(DateTime, default=datetime.utcnow)
    completion_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="valid") # valid, revoked
    revocation_reason = Column(Text, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    qr_code_data = Column(Text, nullable=True) # Data URL or verification URL string

    learner = relationship("User", foreign_keys=[learner_id], back_populates="earned_certificates")
    provider = relationship("User", foreign_keys=[provider_id], back_populates="issued_certificates")
    course = relationship("Course", back_populates="certificates")
