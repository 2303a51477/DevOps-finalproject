import json
import uuid
from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentResult
from app.models.certificate import Certificate
from app.mongo_db import is_mongo_db
from app import mongo_repo
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentSubmission,
    AssessmentResultResponse,
)
from app.services.auth import get_current_user, require_roles

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.get("", response_model=List[AssessmentResponse])
def get_assessments(course_id: Optional[int] = None, db: Any = Depends(get_db)):
    if is_mongo_db(db):
        return mongo_repo.list_assessments(db, course_id=course_id)

    query = db.query(Assessment)
    if course_id:
        query = query.filter(Assessment.course_id == course_id)
    assessments = query.all()
    for a in assessments:
        a.question_count = len(a.questions)
        for q in a.questions:
            if isinstance(q.options, str):
                try:
                    q.options = json.loads(q.options)
                except Exception:
                    q.options = []
    return assessments


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    if is_mongo_db(db):
        return mongo_repo.get_assessment(db, assessment_id, current_user)

    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    assessment.question_count = len(assessment.questions)
    for q in assessment.questions:
        if isinstance(q.options, str):
            try:
                q.options = json.loads(q.options)
            except Exception:
                q.options = []
        # If learner is taking quiz, hide correct_option_index
        if current_user.role == "learner":
            q.correct_option_index = None
            q.explanation = None

    return assessment


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment_in: AssessmentCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin", "provider"])),
):
    if is_mongo_db(db):
        return mongo_repo.create_assessment(db, current_user, assessment_in)

    course = db.query(Course).filter(Course.id == assessment_in.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if current_user.role != "admin" and course.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    new_assessment = Assessment(
        course_id=assessment_in.course_id,
        title=assessment_in.title.strip(),
        description=assessment_in.description,
        passing_score=assessment_in.passing_score,
        time_limit_mins=assessment_in.time_limit_mins,
        created_at=datetime.utcnow(),
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)

    if assessment_in.questions:
        for q in assessment_in.questions:
            opts = q.options if isinstance(q.options, str) else json.dumps(q.options)
            q_rec = AssessmentQuestion(
                assessment_id=new_assessment.id,
                question_text=q.question_text,
                options=opts,
                correct_option_index=q.correct_option_index,
                explanation=q.explanation,
            )
            db.add(q_rec)
        db.commit()
        db.refresh(new_assessment)

    for q in new_assessment.questions:
        if isinstance(q.options, str):
            q.options = json.loads(q.options)

    return new_assessment


@router.post("/{assessment_id}/submit", response_model=AssessmentResultResponse)
def submit_assessment(
    assessment_id: int,
    submission: AssessmentSubmission,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    if is_mongo_db(db):
        return mongo_repo.submit_assessment(db, assessment_id, current_user, submission.answers)

    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment_id).all()
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assessment has no questions")

    correct_count = 0
    for q in questions:
        if q.id in submission.answers:
            selected = submission.answers[q.id]
        elif str(q.id) in submission.answers:
            selected = submission.answers[str(q.id)]
        else:
            selected = None
        if selected is not None and int(selected) == q.correct_option_index:
            correct_count += 1

    score_pct = round((correct_count / len(questions)) * 100.0, 1)
    passed = score_pct >= assessment.passing_score

    result = AssessmentResult(
        assessment_id=assessment_id,
        user_id=current_user.id,
        score=score_pct,
        total_questions=len(questions),
        passed=passed,
        submitted_at=datetime.utcnow(),
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    # Automatic certificate issuance check
    cert_id = None
    vfy_id = None
    cert_eligible = False

    if passed:
        # Check enrollment or mark course completed
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == assessment.course_id,
        ).first()

        if enrollment:
            enrollment.progress_percentage = 100.0
            enrollment.status = "completed"
            if not enrollment.completed_at:
                enrollment.completed_at = datetime.utcnow()
            db.commit()

        cert_eligible = True

        # Check if certificate already exists
        existing_cert = db.query(Certificate).filter(
            Certificate.learner_id == current_user.id,
            Certificate.course_id == assessment.course_id,
            Certificate.status == "valid",
        ).first()

        if existing_cert:
            cert_id = existing_cert.certificate_id
            vfy_id = existing_cert.verification_id
        else:
            # Issue certificate automatically
            unique_suffix = uuid.uuid4().hex[:6].upper()
            year_now = datetime.utcnow().year
            new_cert_num = f"CERT-{year_now}-{unique_suffix}"
            new_vfy_num = f"VFY-{uuid.uuid4().hex[:10].upper()}"

            course = db.query(Course).filter(Course.id == assessment.course_id).first()
            provider_id = course.provider_id if course else 1

            new_cert = Certificate(
                certificate_id=new_cert_num,
                verification_id=new_vfy_num,
                learner_id=current_user.id,
                course_id=assessment.course_id,
                provider_id=provider_id,
                score=score_pct,
                issue_date=datetime.utcnow(),
                completion_date=datetime.utcnow(),
                status="valid",
                qr_code_data=f"/verify/{new_vfy_num}",
            )
            db.add(new_cert)
            db.commit()
            cert_id = new_cert_num
            vfy_id = new_vfy_num

    return {
        "id": result.id,
        "assessment_id": result.assessment_id,
        "user_id": result.user_id,
        "score": result.score,
        "total_questions": result.total_questions,
        "passed": result.passed,
        "submitted_at": result.submitted_at,
        "certificate_eligible": cert_eligible,
        "certificate_id": cert_id,
        "verification_id": vfy_id,
    }
