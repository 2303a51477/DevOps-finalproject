import csv
import io
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.course import Course, CourseModule
from app.models.enrollment import Enrollment
from app.models.assessment import Assessment, AssessmentResult
from app.models.certificate import Certificate
from app.models.verification import VerificationRequest

def get_certificate_issuance_report_data(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(Certificate)
    if start_date:
        query = query.filter(Certificate.issue_date >= start_date)
    if end_date:
        query = query.filter(Certificate.issue_date <= end_date)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Certificate.status == status_filter.lower())
        
    certificates = query.order_by(Certificate.issue_date.desc()).all()
    
    total_issued = len(certificates)
    valid_count = sum(1 for c in certificates if c.status.lower() == "valid")
    revoked_count = sum(1 for c in certificates if c.status.lower() == "revoked")
    avg_score = (sum(c.score for c in certificates) / total_issued) if total_issued > 0 else 0.0
    
    records = []
    # Monthly aggregation for Chart.js
    monthly_data: Dict[str, int] = {}
    
    for c in certificates:
        month_key = c.issue_date.strftime("%b %Y")
        monthly_data[month_key] = monthly_data.get(month_key, 0) + 1
        
        records.append({
            "id": c.id,
            "certificate_id": c.certificate_id,
            "verification_id": c.verification_id,
            "learner_name": c.learner.name if c.learner else "N/A",
            "learner_email": c.learner.email if c.learner else "N/A",
            "course_name": c.course.title if c.course else "N/A",
            "provider_name": c.provider.name if c.provider else "N/A",
            "issue_date": c.issue_date.isoformat(),
            "status": c.status,
            "score": round(c.score, 1),
            "revocation_reason": c.revocation_reason
        })
        
    return {
        "report_title": "Certificate Issuance Report",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": total_issued,
        "summary_metrics": {
            "total_issued": total_issued,
            "valid_count": valid_count,
            "revoked_count": revoked_count,
            "average_score": round(avg_score, 1)
        },
        "chart_data": {
            "labels": list(monthly_data.keys()),
            "values": list(monthly_data.values()),
            "status_breakdown": {
                "Valid": valid_count,
                "Revoked": revoked_count
            }
        },
        "records": records
    }

def get_course_completion_report_data(
    db: Session,
    category_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(Course)
    if category_filter and category_filter.lower() != "all":
        query = query.filter(Course.category == category_filter)
        
    courses = query.all()
    records = []
    
    total_enrollments_all = 0
    total_completed_all = 0
    chart_labels = []
    chart_completion_rates = []
    chart_enrolled = []
    
    for course in courses:
        enrollments = db.query(Enrollment).filter(Enrollment.course_id == course.id).all()
        total_learners = len(enrollments)
        completed_learners = sum(1 for e in enrollments if e.status == "completed" or e.progress_percentage >= 100.0)
        pending_learners = total_learners - completed_learners
        completion_pct = round((completed_learners / total_learners * 100.0), 1) if total_learners > 0 else 0.0
        
        total_enrollments_all += total_learners
        total_completed_all += completed_learners
        
        chart_labels.append(course.title[:20] + "...")
        chart_completion_rates.append(completion_pct)
        chart_enrolled.append(total_learners)
        
        records.append({
            "course_id": course.id,
            "course_name": course.title,
            "category": course.category,
            "difficulty": course.difficulty,
            "provider_name": course.provider.name if course.provider else "N/A",
            "total_learners": total_learners,
            "completed_learners": completed_learners,
            "pending_learners": pending_learners,
            "completion_percentage": completion_pct
        })
        
    overall_rate = round((total_completed_all / total_enrollments_all * 100.0), 1) if total_enrollments_all > 0 else 0.0
    
    return {
        "report_title": "Course Completion Report",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": len(courses),
        "summary_metrics": {
            "total_courses": len(courses),
            "total_enrollments": total_enrollments_all,
            "total_completed": total_completed_all,
            "overall_completion_rate": overall_rate
        },
        "chart_data": {
            "labels": chart_labels,
            "completion_rates": chart_completion_rates,
            "enrolled_counts": chart_enrolled
        },
        "records": records
    }

def get_verification_requests_report_data(
    db: Session,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(VerificationRequest)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(VerificationRequest.status == status_filter.lower())
        
    requests = query.order_by(VerificationRequest.created_at.desc()).all()
    total_requests = len(requests)
    verified_count = sum(1 for r in requests if r.status.lower() == "verified")
    pending_count = sum(1 for r in requests if r.status.lower() == "pending")
    rejected_count = sum(1 for r in requests if r.status.lower() == "rejected")
    
    records = []
    for r in requests:
        records.append({
            "id": r.id,
            "request_id": r.request_id,
            "requester_name": r.requester_name,
            "requester_email": r.requester_email,
            "requester_organization": r.requester_organization or "Independent",
            "certificate_id": r.certificate_id,
            "request_date": r.created_at.isoformat(),
            "verification_result": r.status,
            "notes": r.notes
        })
        
    return {
        "report_title": "Verification Requests Report",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": total_requests,
        "summary_metrics": {
            "total_requests": total_requests,
            "verified_count": verified_count,
            "pending_count": pending_count,
            "rejected_count": rejected_count
        },
        "chart_data": {
            "labels": ["Verified", "Pending", "Rejected"],
            "values": [verified_count, pending_count, rejected_count]
        },
        "records": records
    }

def get_learner_progress_report_data(
    db: Session,
    course_id: Optional[int] = None
) -> Dict[str, Any]:
    query = db.query(Enrollment)
    if course_id:
        query = query.filter(Enrollment.course_id == course_id)
        
    enrollments = query.all()
    records = []
    
    progress_buckets = {"0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0}
    total_progress_sum = 0.0
    
    for e in enrollments:
        total_modules = len(e.course.modules) if e.course and e.course.modules else 0
        try:
            completed_list = json.loads(e.completed_modules or "[]")
            completed_count = len(completed_list)
        except Exception:
            completed_count = 0
            
        # Get highest assessment score if any
        res = db.query(AssessmentResult).join(Assessment).filter(
            Assessment.course_id == e.course_id,
            AssessmentResult.user_id == e.user_id
        ).order_by(AssessmentResult.score.desc()).first()
        
        score_val = res.score if res else None
        pct = round(e.progress_percentage, 1)
        total_progress_sum += pct
        
        if pct <= 25:
            progress_buckets["0-25%"] += 1
        elif pct <= 50:
            progress_buckets["26-50%"] += 1
        elif pct <= 75:
            progress_buckets["51-75%"] += 1
        else:
            progress_buckets["76-100%"] += 1
            
        records.append({
            "enrollment_id": e.id,
            "user_id": e.user_id,
            "learner_name": e.user.name if e.user else "N/A",
            "learner_email": e.user.email if e.user else "N/A",
            "course_id": e.course_id,
            "course_name": e.course.title if e.course else "N/A",
            "completed_modules": completed_count,
            "total_modules": total_modules,
            "assessment_score": score_val,
            "progress_percentage": pct,
            "status": e.status,
            "enrolled_at": e.enrolled_at.isoformat()
        })
        
    avg_prog = round(total_progress_sum / len(enrollments), 1) if enrollments else 0.0
    
    return {
        "report_title": "Learner Progress Report",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": len(enrollments),
        "summary_metrics": {
            "total_enrolled_learners": len(enrollments),
            "average_progress": avg_prog,
            "high_achievers": sum(1 for r in records if r["assessment_score"] and r["assessment_score"] >= 90)
        },
        "chart_data": {
            "labels": list(progress_buckets.keys()),
            "values": list(progress_buckets.values())
        },
        "records": records
    }

def generate_csv_from_records(records: List[Dict[str, Any]], fieldnames: List[str]) -> io.StringIO:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for row in records:
        writer.writerow(row)
    output.seek(0)
    return output
