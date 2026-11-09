import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.certificate import Certificate
from app.schemas.certificate import (
    CertificateResponse,
    CertificateIssueRequest,
    CertificateRevokeRequest
)
from app.services.auth import get_current_user, require_roles
from app.services.pdf_service import generate_certificate_pdf
from app.config import settings

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.get("", response_model=List[CertificateResponse])
def get_certificates(
    status_filter: Optional[str] = None,
    course_id: Optional[int] = None,
    learner_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Certificate)
    
    if current_user.role == "learner":
        query = query.filter(Certificate.learner_id == current_user.id)
    elif current_user.role == "provider":
        query = query.filter(Certificate.provider_id == current_user.id)
        
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Certificate.status == status_filter.lower())
    if course_id:
        query = query.filter(Certificate.course_id == course_id)
    if learner_id and current_user.role in ["admin", "provider"]:
        query = query.filter(Certificate.learner_id == learner_id)
        
    return query.order_by(Certificate.issue_date.desc()).all()

@router.get("/{cert_id}", response_model=CertificateResponse)
def get_certificate_by_id(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
        
    if current_user.role == "learner" and cert.learner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == "provider" and cert.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    return cert

@router.post("/issue", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
def issue_certificate(
    issue_in: CertificateIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "provider"]))
):
    course = db.query(Course).filter(Course.id == issue_in.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    if current_user.role != "admin" and course.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
        
    learner = db.query(User).filter(User.id == issue_in.learner_id).first()
    if not learner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learner not found")
        
    unique_suffix = uuid.uuid4().hex[:6].upper()
    year_now = datetime.utcnow().year
    cert_id_str = f"CERT-{year_now}-{unique_suffix}"
    vfy_id_str = f"VFY-{uuid.uuid4().hex[:10].upper()}"

    new_cert = Certificate(
        certificate_id=cert_id_str,
        verification_id=vfy_id_str,
        learner_id=issue_in.learner_id,
        course_id=issue_in.course_id,
        provider_id=course.provider_id,
        score=issue_in.score or 100.0,
        issue_date=datetime.utcnow(),
        completion_date=datetime.utcnow(),
        status="valid",
        qr_code_data=f"/verify/{vfy_id_str}"
    )
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)
    return new_cert

@router.put("/{cert_id}/revoke", response_model=CertificateResponse)
def revoke_certificate(
    cert_id: int,
    revoke_in: CertificateRevokeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "provider"]))
):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
        
    if current_user.role != "admin" and cert.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
        
    cert.status = "revoked"
    cert.revocation_reason = revoke_in.revocation_reason.strip()
    cert.revoked_at = datetime.utcnow()
    
    db.commit()
    db.refresh(cert)
    return cert

@router.get("/{cert_id}/download")
def download_certificate_pdf(
    cert_id: int,
    db: Session = Depends(get_db)
):
    # Publicly accessible via cert id or verification download
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
        
    learner_name = cert.learner.name if cert.learner else "Valued Scholar"
    course_title = cert.course.title if cert.course else "Advanced Curriculum"
    provider_name = cert.provider.organization or cert.provider.name if cert.provider else "Accredited Academy"

    pdf_stream = generate_certificate_pdf(
        learner_name=learner_name,
        course_title=course_title,
        provider_name=provider_name,
        certificate_id=cert.certificate_id,
        verification_id=cert.verification_id,
        issue_date=cert.issue_date,
        score=cert.score,
        status=cert.status,
        frontend_verify_url=f"{settings.FRONTEND_URL}/verify"
    )

    filename = f"{cert.certificate_id}_{learner_name.replace(' ', '_')}.pdf"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return StreamingResponse(pdf_stream, media_type="application/pdf", headers=headers)
