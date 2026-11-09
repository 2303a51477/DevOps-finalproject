from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.schemas.course import CourseResponse

class CertificateIssueRequest(BaseModel):
    learner_id: int
    course_id: int
    score: Optional[float] = 100.0

class CertificateRevokeRequest(BaseModel):
    revocation_reason: str

class CertificateResponse(BaseModel):
    id: int
    certificate_id: str
    verification_id: str
    learner_id: int
    course_id: int
    provider_id: int
    score: float
    issue_date: datetime
    completion_date: datetime
    status: str # valid, revoked
    revocation_reason: Optional[str] = None
    revoked_at: Optional[datetime] = None
    qr_code_data: Optional[str] = None
    learner: Optional[UserResponse] = None
    provider: Optional[UserResponse] = None
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True

class PublicVerificationResponse(BaseModel):
    verification_id: str
    certificate_id: Optional[str] = None
    status: str # 'valid', 'revoked', 'not_found'
    learner_name: Optional[str] = None
    course_name: Optional[str] = None
    provider_name: Optional[str] = None
    completion_date: Optional[datetime] = None
    issue_date: Optional[datetime] = None
    score: Optional[float] = None
    revocation_reason: Optional[str] = None
    revoked_at: Optional[datetime] = None
    qr_code_data: Optional[str] = None
    verified_at: datetime
