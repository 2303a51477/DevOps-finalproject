from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserResponse

class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str = "document" # video, document, interactive
    content_url: Optional[str] = None
    reading_time_mins: int = 15
    order_index: int = 1

class ModuleCreate(ModuleBase):
    pass

class ModuleResponse(ModuleBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Technology"
    difficulty: str = "Beginner"
    duration_hours: int = 10
    passing_percentage: float = 70.0
    thumbnail_url: Optional[str] = None

class CourseCreate(CourseBase):
    modules: Optional[List[ModuleCreate]] = None

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration_hours: Optional[int] = None
    passing_percentage: Optional[float] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None

class CourseResponse(CourseBase):
    id: int
    provider_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    provider: Optional[UserResponse] = None
    modules: Optional[List[ModuleResponse]] = []
    enrollment_count: Optional[int] = 0

    class Config:
        from_attributes = True
