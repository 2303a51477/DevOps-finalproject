from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.course import CourseResponse
from app.schemas.user import UserResponse

class EnrollmentCreate(BaseModel):
    course_id: int

class ProgressUpdate(BaseModel):
    module_id: int
    completed: bool = True

class EnrollmentResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    status: str
    progress_percentage: float
    completed_modules: str
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    course: Optional[CourseResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True
