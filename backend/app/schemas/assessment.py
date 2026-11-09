from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class QuestionCreate(BaseModel):
    question_text: str
    options: List[str]
    correct_option_index: int
    explanation: Optional[str] = None

class QuestionResponse(BaseModel):
    id: int
    assessment_id: int
    question_text: str
    options: Any # List of strings
    # Do not leak correct_option_index during quiz taking, but can show in admin or review
    correct_option_index: Optional[int] = None
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

class AssessmentBase(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    passing_score: float = 70.0
    time_limit_mins: int = 30

class AssessmentCreate(AssessmentBase):
    questions: Optional[List[QuestionCreate]] = None

class AssessmentResponse(AssessmentBase):
    id: int
    created_at: datetime
    questions: Optional[List[QuestionResponse]] = []
    question_count: Optional[int] = 0

    class Config:
        from_attributes = True

class AssessmentSubmission(BaseModel):
    answers: Dict[int, int] # question_id -> chosen_option_index

class AssessmentResultResponse(BaseModel):
    id: int
    assessment_id: int
    user_id: int
    score: float
    total_questions: int
    passed: bool
    submitted_at: datetime
    certificate_eligible: Optional[bool] = False
    certificate_id: Optional[str] = None
    verification_id: Optional[str] = None

    class Config:
        from_attributes = True
