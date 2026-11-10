from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel

class CertificateIssuanceItem(BaseModel):
    id: int
    certificate_id: str
    verification_id: str
    learner_name: str
    learner_email: str
    course_name: str
    provider_name: str
    issue_date: datetime
    status: str
    score: float

class CourseCompletionItem(BaseModel):
    course_id: int
    course_name: str
    category: str
    provider_name: str
    total_learners: int
    completed_learners: int
    pending_learners: int
    completion_percentage: float

class VerificationRequestItem(BaseModel):
    id: int
    request_id: str
    requester_name: str
    requester_email: str
    requester_organization: Optional[str]
    certificate_id: str
    request_date: datetime
    verification_result: str

class LearnerProgressItem(BaseModel):
    user_id: int
    learner_name: str
    learner_email: str
    course_id: int
    course_name: str
    completed_modules: int
    total_modules: int
    assessment_score: Optional[float] = None
    progress_percentage: float
    status: str

class ReportResponse(BaseModel):
    report_title: str
    generated_at: datetime
    total_records: int
    summary_metrics: Dict[str, Any]
    chart_data: Dict[str, Any]
    records: List[Any]

