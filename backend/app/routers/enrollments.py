import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.course import Course, CourseModule
from app.models.enrollment import Enrollment
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse, ProgressUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.get("", response_model=List[EnrollmentResponse])
def get_enrollments(
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Enrollment)
    if current_user.role == "learner":
        query = query.filter(Enrollment.user_id == current_user.id)
    elif current_user.role == "provider":
        query = query.join(Course).filter(Course.provider_id == current_user.id)
        
    if course_id:
        query = query.filter(Enrollment.course_id == course_id)
        
    return query.order_by(Enrollment.enrolled_at.desc()).all()

@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
        
    if current_user.role == "learner" and enrollment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    return enrollment

@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_course(
    enroll_in: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == enroll_in.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == enroll_in.course_id
    ).first()
    
    if existing:
        return existing
        
    new_enrollment = Enrollment(
        user_id=current_user.id,
        course_id=enroll_in.course_id,
        status="in_progress",
        progress_percentage=0.0,
        completed_modules="[]",
        enrolled_at=datetime.utcnow()
    )
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)
    return new_enrollment

@router.put("/{enrollment_id}/progress", response_model=EnrollmentResponse)
def update_progress(
    enrollment_id: int,
    prog_in: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
        
    if current_user.role != "admin" and enrollment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Get total modules for course
    total_modules = db.query(CourseModule).filter(CourseModule.course_id == enrollment.course_id).count()
    if total_modules == 0:
        total_modules = 1 # Avoid division by zero
        
    try:
        completed_set = set(json.loads(enrollment.completed_modules or "[]"))
    except Exception:
        completed_set = set()
        
    if prog_in.completed:
        completed_set.add(prog_in.module_id)
    else:
        completed_set.discard(prog_in.module_id)
        
    enrollment.completed_modules = json.dumps(list(completed_set))
    calc_pct = (len(completed_set) / total_modules) * 100.0
    enrollment.progress_percentage = min(100.0, round(calc_pct, 1))
    
    if enrollment.progress_percentage >= 100.0:
        enrollment.status = "completed"
        if not enrollment.completed_at:
            enrollment.completed_at = datetime.utcnow()
    else:
        enrollment.status = "in_progress"
        enrollment.completed_at = None
        
    db.commit()
    db.refresh(enrollment)
    return enrollment
