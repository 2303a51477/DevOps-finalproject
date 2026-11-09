from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class VerificationRequestCreate(BaseModel):
    certificate_id: str
    requester_name: str
    requester_email: EmailStr
    requester_organization: Optional[str] = None
    notes: Optional[str] = None

class VerificationRequestResponse(BaseModel):
    id: int
    request_id: str
    requester_name: str
    requester_email: str
    requester_organization: Optional[str] = None
    certificate_id: str
    status: str
    notes: Optional[str] = None
    verified_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class SettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

class SettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
