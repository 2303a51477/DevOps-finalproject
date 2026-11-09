import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.certificate import Certificate
from app.models.verification import VerificationRequest
from app.schemas.certificate import PublicVerificationResponse
from app.schemas.verification import VerificationRequestCreate, VerificationRequestResponse
from app.services.auth import get_current_user, require_roles

router = APIRouter(tags=["Verification"])

@router.get("/verify/{verification_id}", response_model=PublicVerificationResponse)
def verify_credential(verification_id: str, db: Session = Depends(get_db)):
    clean_id = verification_id.strip()
    
    # Check by verification_id or certificate_id
    cert = db.query(Certificate).filter(
        (Certificate.verification_id.ilike(clean_id)) | 
        (Certificate.certificate_id.ilike(clean_id))
    ).first()

    now = datetime.utcnow()

    if not cert:
        return {
            "verification_id": clean_id,
            "certificate_id": None,
            "status": "not_found",
            "learner_name": None,
            "course_name": None,
            "provider_name": None,
            "completion_date": None,
            "issue_date": None,
            "score": None,
            "revocation_reason": "No record exists with this credential identifier.",
            "revoked_at": None,
            "qr_code_data": None,
            "verified_at": now
        }

    learner_name = cert.learner.name if cert.learner else "N/A"
    course_name = cert.course.title if cert.course else "N/A"
    provider_name = cert.provider.organization or cert.provider.name if cert.provider else "N/A"

    return {
        "verification_id": cert.verification_id,
        "certificate_id": cert.certificate_id,
        "status": cert.status.lower(), # 'valid' or 'revoked'
        "learner_name": learner_name,
        "course_name": course_name,
        "provider_name": provider_name,
        "completion_date": cert.completion_date,
        "issue_date": cert.issue_date,
        "score": cert.score,
        "revocation_reason": cert.revocation_reason if cert.status == "revoked" else None,
        "revoked_at": cert.revoked_at if cert.status == "revoked" else None,
        "qr_code_data": cert.qr_code_data,
        "verified_at": now
    }

@router.post("/verification-requests", response_model=VerificationRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_verification_request(
    req_in: VerificationRequestCreate,
    db: Session = Depends(get_db)
):
    # Check if certificate exists to evaluate result
    cert = db.query(Certificate).filter(
        (Certificate.certificate_id.ilike(req_in.certificate_id.strip())) |
        (Certificate.verification_id.ilike(req_in.certificate_id.strip()))
    ).first()

    status_result = "verified" if (cert and cert.status == "valid") else ("rejected" if (cert and cert.status == "revoked") else "pending")
    
    unique_req_id = f"VR-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"

    new_req = VerificationRequest(
        request_id=unique_req_id,
        requester_name=req_in.requester_name.strip(),
        requester_email=req_in.requester_email.lower().strip(),
        requester_organization=req_in.requester_organization.strip() if req_in.requester_organization else None,
        certificate_id=req_in.certificate_id.strip(),
        status=status_result,
        notes=req_in.notes,
        verified_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

@router.get("/verification-requests", response_model=List[VerificationRequestResponse])
def get_verification_requests(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(VerificationRequest)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(VerificationRequest.status == status_filter.lower())
    if search:
        s = f"%{search}%"
        query = query.filter(
            (VerificationRequest.request_id.ilike(s)) |
            (VerificationRequest.requester_name.ilike(s)) |
            (VerificationRequest.certificate_id.ilike(s)) |
            (VerificationRequest.requester_organization.ilike(s))
        )
    return query.order_by(VerificationRequest.created_at.desc()).all()
