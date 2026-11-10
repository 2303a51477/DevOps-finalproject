from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.database import get_db
from app.schemas.report import ReportResponse
from app.services.report_service import (
    get_certificate_issuance_report_data,
    get_course_completion_report_data,
    get_verification_requests_report_data,
    get_learner_progress_report_data,
    generate_csv_from_records
)

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/certificate-issuance", response_model=ReportResponse)
def certificate_issuance_report(
    status_filter: Optional[str] = None,
    db: Any = Depends(get_db)
):
    return get_certificate_issuance_report_data(db, status_filter=status_filter)

@router.get("/course-completion", response_model=ReportResponse)
def course_completion_report(
    category: Optional[str] = None,
    db: Any = Depends(get_db)
):
    return get_course_completion_report_data(db, category_filter=category)

@router.get("/verification-requests", response_model=ReportResponse)
def verification_requests_report(
    status_filter: Optional[str] = None,
    db: Any = Depends(get_db)
):
    return get_verification_requests_report_data(db, status_filter=status_filter)

@router.get("/learner-progress", response_model=ReportResponse)
def learner_progress_report(
    course_id: Optional[int] = None,
    db: Any = Depends(get_db)
):
    return get_learner_progress_report_data(db, course_id=course_id)

@router.get("/export/csv/{report_type}")
def export_report_csv(
    report_type: str,
    db: Any = Depends(get_db)
):
    clean_type = report_type.lower().strip()
    
    if clean_type in ["certificate-issuance", "certificate", "certificates"]:
        data = get_certificate_issuance_report_data(db)
        fieldnames = ["certificate_id", "verification_id", "learner_name", "learner_email", "course_name", "provider_name", "issue_date", "status", "score"]
        filename = f"Certificate_Issuance_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        
    elif clean_type in ["course-completion", "courses", "completion"]:
        data = get_course_completion_report_data(db)
        fieldnames = ["course_id", "course_name", "category", "difficulty", "provider_name", "total_learners", "completed_learners", "pending_learners", "completion_percentage"]
        filename = f"Course_Completion_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        
    elif clean_type in ["verification-requests", "verifications", "verification"]:
        data = get_verification_requests_report_data(db)
        fieldnames = ["request_id", "requester_name", "requester_email", "requester_organization", "certificate_id", "request_date", "verification_result", "notes"]
        filename = f"Verification_Requests_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        
    elif clean_type in ["learner-progress", "learners", "progress"]:
        data = get_learner_progress_report_data(db)
        fieldnames = ["enrollment_id", "learner_name", "learner_email", "course_name", "completed_modules", "total_modules", "assessment_score", "progress_percentage", "status"]
        filename = f"Learner_Progress_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid report type: {report_type}")

    csv_buf = generate_csv_from_records(data["records"], fieldnames)
    return Response(
        content=csv_buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

