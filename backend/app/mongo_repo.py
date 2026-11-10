import json
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING

from app.mongo_db import (
    Record,
    doc_to_record,
    hydrate_assessments_list,
    hydrate_certificates_list,
    hydrate_course,
    hydrate_courses_list,
    hydrate_enrollments_list,
    hydrate_module,
    hydrate_user,
    hydrate_verification_request,
    next_seq,
)


# -----------------------------
# Auth & Users
# -----------------------------

def get_user_by_id(mdb: Any, user_id: int) -> Optional[Record]:
    return hydrate_user(mdb["users"].find_one({"id": user_id}))


def get_user_by_email(mdb: Any, email: str) -> Optional[Record]:
    return hydrate_user(mdb["users"].find_one({"email": email.lower().strip()}))


def create_user(
    mdb: Any,
    name: str,
    email: str,
    password_hash: str,
    role: str,
    organization: Optional[str] = None,
    is_active: bool = True,
    created_at: Optional[datetime] = None,
) -> Record:
    clean_email = email.lower().strip()
    if mdb["users"].find_one({"email": clean_email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    now = created_at or datetime.utcnow()
    doc = {
        "id": next_seq(mdb, "users"),
        "name": name.strip(),
        "email": clean_email,
        "password_hash": password_hash,
        "role": role,
        "organization": organization.strip() if organization else None,
        "is_active": is_active,
        "created_at": now,
        "updated_at": now,
    }
    mdb["users"].insert_one(doc)
    return hydrate_user(doc)


def list_users(
    mdb: Any,
    role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Record]:
    filt: Dict[str, Any] = {}
    if role and role.lower() != "all":
        filt["role"] = role.lower()
    if search:
        pattern = re.escape(search.strip())
        filt["$or"] = [
            {"name": {"$regex": pattern, "$options": "i"}},
            {"email": {"$regex": pattern, "$options": "i"}},
            {"organization": {"$regex": pattern, "$options": "i"}},
        ]
    docs = list(mdb["users"].find(filt).sort("id", DESCENDING).skip(offset).limit(limit))
    return [hydrate_user(d) for d in docs]


def update_user(
    mdb: Any,
    user_id: int,
    updates: Dict[str, Any],
) -> Record:
    existing = mdb["users"].find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if "email" in updates and updates["email"] is not None:
        clean_email = updates["email"].lower().strip()
        dup = mdb["users"].find_one({"email": clean_email, "id": {"$ne": user_id}})
        if dup:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already taken")
        updates["email"] = clean_email

    updates["updated_at"] = datetime.utcnow()
    mdb["users"].update_one({"id": user_id}, {"$set": updates})
    return get_user_by_id(mdb, user_id)


def delete_user(mdb: Any, user_id: int) -> None:
    existing = mdb["users"].find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Cascade courses owned by provider
    for c in mdb["courses"].find({"provider_id": user_id}, {"id": 1}):
        delete_course(mdb, c["id"])

    mdb["enrollments"].delete_many({"user_id": user_id})
    mdb["assessment_results"].delete_many({"user_id": user_id})
    mdb["certificates"].delete_many({"$or": [{"learner_id": user_id}, {"provider_id": user_id}]})
    mdb["users"].delete_one({"id": user_id})


# -----------------------------
# Courses & Modules
# -----------------------------

def list_courses(
    mdb: Any,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    provider_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Record]:
    filt: Dict[str, Any] = {}
    if status_filter and status_filter.lower() != "all":
        filt["status"] = status_filter.lower()
    else:
        if not provider_id and not status_filter:
            filt["status"] = "approved"

    if provider_id:
        filt["provider_id"] = provider_id
    if category and category.lower() != "all":
        filt["category"] = category
    if difficulty and difficulty.lower() != "all":
        filt["difficulty"] = difficulty
    if search:
        pattern = re.escape(search.strip())
        filt["$or"] = [
            {"title": {"$regex": pattern, "$options": "i"}},
            {"description": {"$regex": pattern, "$options": "i"}},
        ]

    docs = list(mdb["courses"].find(filt).sort("id", DESCENDING).skip(offset).limit(limit))
    return hydrate_courses_list(mdb, docs)


def get_course(mdb: Any, course_id: int) -> Optional[Record]:
    doc = mdb["courses"].find_one({"id": course_id})
    return hydrate_course(mdb, doc)


def create_course(mdb: Any, provider_id: int, course_in: Any, status_val: str = "approved") -> Record:
    now = datetime.utcnow()
    course_id = next_seq(mdb, "courses")
    course_doc = {
        "id": course_id,
        "title": course_in.title.strip(),
        "description": course_in.description,
        "provider_id": provider_id,
        "category": course_in.category,
        "difficulty": course_in.difficulty,
        "duration_hours": course_in.duration_hours,
        "passing_percentage": course_in.passing_percentage,
        "status": status_val,
        "thumbnail_url": course_in.thumbnail_url,
        "created_at": now,
        "updated_at": now,
    }
    mdb["courses"].insert_one(course_doc)

    if getattr(course_in, "modules", None):
        for idx, mod in enumerate(course_in.modules):
            mod_doc = {
                "id": next_seq(mdb, "course_modules"),
                "course_id": course_id,
                "title": mod.title,
                "description": mod.description,
                "content_type": mod.content_type,
                "content_url": mod.content_url,
                "reading_time_mins": mod.reading_time_mins,
                "order_index": mod.order_index or (idx + 1),
                "created_at": now,
            }
            mdb["course_modules"].insert_one(mod_doc)

    return get_course(mdb, course_id)


def update_course(mdb: Any, course_id: int, current_user: Any, updates: Dict[str, Any]) -> Record:
    course = mdb["courses"].find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course["provider_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this course")

    if updates:
        updates["updated_at"] = datetime.utcnow()
        mdb["courses"].update_one({"id": course_id}, {"$set": updates})
    return get_course(mdb, course_id)


def delete_course(mdb: Any, course_id: int, current_user: Any = None) -> None:
    course = mdb["courses"].find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user is not None and current_user.role != "admin" and course["provider_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this course")

    assessment_ids = [a["id"] for a in mdb["assessments"].find({"course_id": course_id}, {"id": 1})]
    if assessment_ids:
        mdb["assessment_questions"].delete_many({"assessment_id": {"$in": assessment_ids}})
        mdb["assessment_results"].delete_many({"assessment_id": {"$in": assessment_ids}})
        mdb["assessments"].delete_many({"course_id": course_id})

    mdb["course_modules"].delete_many({"course_id": course_id})
    mdb["enrollments"].delete_many({"course_id": course_id})
    mdb["certificates"].delete_many({"course_id": course_id})
    mdb["courses"].delete_one({"id": course_id})


def set_course_status(mdb: Any, course_id: int, new_status: str) -> Record:
    course = mdb["courses"].find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    mdb["courses"].update_one(
        {"id": course_id},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}},
    )
    return get_course(mdb, course_id)


def add_module(mdb: Any, course_id: int, current_user: Any, module_in: Any) -> Record:
    course = mdb["courses"].find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course["provider_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    mod_doc = {
        "id": next_seq(mdb, "course_modules"),
        "course_id": course_id,
        "title": module_in.title.strip(),
        "description": module_in.description,
        "content_type": module_in.content_type,
        "content_url": module_in.content_url,
        "reading_time_mins": module_in.reading_time_mins,
        "order_index": module_in.order_index,
        "created_at": datetime.utcnow(),
    }
    mdb["course_modules"].insert_one(mod_doc)
    return hydrate_module(mod_doc)


def delete_module(mdb: Any, module_id: int, current_user: Any) -> None:
    module = mdb["course_modules"].find_one({"id": module_id})
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    course = mdb["courses"].find_one({"id": module["course_id"]})
    if current_user.role != "admin" and (not course or course["provider_id"] != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    mdb["course_modules"].delete_one({"id": module_id})


# -----------------------------
# Enrollments
# -----------------------------

def list_enrollments(mdb: Any, current_user: Any, course_id: Optional[int] = None) -> List[Record]:
    filt: Dict[str, Any] = {}
    if current_user.role == "learner":
        filt["user_id"] = current_user.id
    elif current_user.role == "provider":
        owned_ids = [c["id"] for c in mdb["courses"].find({"provider_id": current_user.id}, {"id": 1})]
        filt["course_id"] = {"$in": owned_ids}

    if course_id:
        if "course_id" in filt and isinstance(filt["course_id"], dict):
            if course_id not in filt["course_id"]["$in"]:
                return []
        filt["course_id"] = course_id

    docs = list(mdb["enrollments"].find(filt).sort("enrolled_at", DESCENDING))
    return hydrate_enrollments_list(mdb, docs)


def get_enrollment(mdb: Any, enrollment_id: int, current_user: Any) -> Record:
    doc = mdb["enrollments"].find_one({"id": enrollment_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    if current_user.role == "learner" and doc["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return hydrate_enrollments_list(mdb, [doc])[0]


def enroll_course(mdb: Any, user_id: int, course_id: int) -> Record:
    course = mdb["courses"].find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = mdb["enrollments"].find_one({"user_id": user_id, "course_id": course_id})
    if existing:
        return hydrate_enrollments_list(mdb, [existing])[0]

    doc = {
        "id": next_seq(mdb, "enrollments"),
        "user_id": user_id,
        "course_id": course_id,
        "status": "in_progress",
        "progress_percentage": 0.0,
        "completed_modules": "[]",
        "enrolled_at": datetime.utcnow(),
        "completed_at": None,
    }
    mdb["enrollments"].insert_one(doc)
    return hydrate_enrollments_list(mdb, [doc])[0]


def update_enrollment_progress(mdb: Any, enrollment_id: int, current_user: Any, module_id: int, completed: bool) -> Record:
    doc = mdb["enrollments"].find_one({"id": enrollment_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    if current_user.role != "admin" and doc["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    total_modules = mdb["course_modules"].count_documents({"course_id": doc["course_id"]})
    if total_modules == 0:
        total_modules = 1

    raw_comp = doc.get("completed_modules", "[]")
    try:
        completed_list = raw_comp if isinstance(raw_comp, list) else json.loads(raw_comp or "[]")
        completed_set = set(completed_list)
    except Exception:
        completed_set = set()

    if completed:
        completed_set.add(module_id)
    else:
        completed_set.discard(module_id)

    calc_pct = min(100.0, round((len(completed_set) / total_modules) * 100.0, 1))
    if calc_pct >= 100.0:
        new_status = "completed"
        completed_at = doc.get("completed_at") or datetime.utcnow()
    else:
        new_status = "in_progress"
        completed_at = None

    mdb["enrollments"].update_one(
        {"id": enrollment_id},
        {
            "$set": {
                "completed_modules": json.dumps(list(completed_set)),
                "progress_percentage": calc_pct,
                "status": new_status,
                "completed_at": completed_at,
            }
        },
    )
    updated = mdb["enrollments"].find_one({"id": enrollment_id})
    return hydrate_enrollments_list(mdb, [updated])[0]


# -----------------------------
# Assessments
# -----------------------------

def list_assessments(mdb: Any, course_id: Optional[int] = None) -> List[Record]:
    filt = {"course_id": course_id} if course_id else {}
    docs = list(mdb["assessments"].find(filt).sort("id", ASCENDING))
    return hydrate_assessments_list(mdb, docs, mask_answers=False)


def get_assessment(mdb: Any, assessment_id: int, current_user: Any) -> Record:
    doc = mdb["assessments"].find_one({"id": assessment_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return hydrate_assessments_list(mdb, [doc], mask_answers=(current_user.role == "learner"))[0]


def create_assessment(mdb: Any, current_user: Any, assessment_in: Any) -> Record:
    course = mdb["courses"].find_one({"id": assessment_in.course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course["provider_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    assessment_id = next_seq(mdb, "assessments")
    a_doc = {
        "id": assessment_id,
        "course_id": assessment_in.course_id,
        "title": assessment_in.title.strip(),
        "description": assessment_in.description,
        "passing_score": assessment_in.passing_score,
        "time_limit_mins": assessment_in.time_limit_mins,
        "created_at": datetime.utcnow(),
    }
    mdb["assessments"].insert_one(a_doc)

    if getattr(assessment_in, "questions", None):
        for q in assessment_in.questions:
            opts = q.options if isinstance(q.options, list) else json.loads(q.options)
            q_doc = {
                "id": next_seq(mdb, "assessment_questions"),
                "assessment_id": assessment_id,
                "question_text": q.question_text,
                "options": opts,
                "correct_option_index": q.correct_option_index,
                "explanation": q.explanation,
            }
            mdb["assessment_questions"].insert_one(q_doc)

    return hydrate_assessments_list(mdb, [a_doc], mask_answers=False)[0]


def submit_assessment(mdb: Any, assessment_id: int, current_user: Any, answers: Dict[Any, int]) -> Dict[str, Any]:
    assessment = mdb["assessments"].find_one({"id": assessment_id})
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    questions = list(mdb["assessment_questions"].find({"assessment_id": assessment_id}).sort("id", ASCENDING))
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assessment has no questions")

    correct_count = 0
    for q in questions:
        qid = q["id"]
        if qid in answers:
            selected = answers[qid]
        elif str(qid) in answers:
            selected = answers[str(qid)]
        else:
            selected = None

        if selected is not None and int(selected) == int(q["correct_option_index"]):
            correct_count += 1

    score_pct = round((correct_count / len(questions)) * 100.0, 1)
    passed = score_pct >= float(assessment.get("passing_score", 70.0))

    now = datetime.utcnow()
    result_doc = {
        "id": next_seq(mdb, "assessment_results"),
        "assessment_id": assessment_id,
        "user_id": current_user.id,
        "score": score_pct,
        "total_questions": len(questions),
        "passed": passed,
        "submitted_at": now,
    }
    mdb["assessment_results"].insert_one(result_doc)

    cert_id = None
    vfy_id = None
    cert_eligible = False

    if passed:
        enrollment = mdb["enrollments"].find_one({"user_id": current_user.id, "course_id": assessment["course_id"]})
        if enrollment:
            mdb["enrollments"].update_one(
                {"id": enrollment["id"]},
                {
                    "$set": {
                        "progress_percentage": 100.0,
                        "status": "completed",
                        "completed_at": enrollment.get("completed_at") or now,
                    }
                },
            )

        cert_eligible = True
        existing_cert = mdb["certificates"].find_one({
            "learner_id": current_user.id,
            "course_id": assessment["course_id"],
            "status": "valid",
        })
        if existing_cert:
            cert_id = existing_cert["certificate_id"]
            vfy_id = existing_cert["verification_id"]
        else:
            unique_suffix = uuid.uuid4().hex[:6].upper()
            new_cert_num = f"CERT-{now.year}-{unique_suffix}"
            new_vfy_num = f"VFY-{uuid.uuid4().hex[:10].upper()}"
            course = mdb["courses"].find_one({"id": assessment["course_id"]})
            provider_id = course["provider_id"] if course else 1
            cert_doc = {
                "id": next_seq(mdb, "certificates"),
                "certificate_id": new_cert_num,
                "verification_id": new_vfy_num,
                "learner_id": current_user.id,
                "course_id": assessment["course_id"],
                "provider_id": provider_id,
                "score": score_pct,
                "issue_date": now,
                "completion_date": now,
                "status": "valid",
                "revocation_reason": None,
                "revoked_at": None,
                "qr_code_data": f"/verify/{new_vfy_num}",
            }
            mdb["certificates"].insert_one(cert_doc)
            cert_id = new_cert_num
            vfy_id = new_vfy_num

    return {
        "id": result_doc["id"],
        "assessment_id": assessment_id,
        "user_id": current_user.id,
        "score": score_pct,
        "total_questions": len(questions),
        "passed": passed,
        "submitted_at": now,
        "certificate_eligible": cert_eligible,
        "certificate_id": cert_id,
        "verification_id": vfy_id,
    }


# -----------------------------
# Certificates & Public Verification
# -----------------------------

def list_certificates(
    mdb: Any,
    current_user: Any,
    status_filter: Optional[str] = None,
    course_id: Optional[int] = None,
    learner_id: Optional[int] = None,
) -> List[Record]:
    filt: Dict[str, Any] = {}
    if current_user.role == "learner":
        filt["learner_id"] = current_user.id
    elif current_user.role == "provider":
        filt["provider_id"] = current_user.id

    if status_filter and status_filter.lower() != "all":
        filt["status"] = status_filter.lower()
    if course_id:
        filt["course_id"] = course_id
    if learner_id and current_user.role in ["admin", "provider"]:
        filt["learner_id"] = learner_id

    docs = list(mdb["certificates"].find(filt).sort("issue_date", DESCENDING))
    return hydrate_certificates_list(mdb, docs)


def get_certificate_by_id(mdb: Any, cert_id: int, current_user: Any = None) -> Record:
    doc = mdb["certificates"].find_one({"id": cert_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    if current_user is not None:
        if current_user.role == "learner" and doc["learner_id"] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if current_user.role == "provider" and doc["provider_id"] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return hydrate_certificates_list(mdb, [doc])[0]


def issue_certificate(mdb: Any, current_user: Any, learner_id: int, course_id: int, score: float = 100.0) -> Record:
    course = mdb["courses"].find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course["provider_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    learner = mdb["users"].find_one({"id": learner_id})
    if not learner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learner not found")

    now = datetime.utcnow()
    unique_suffix = uuid.uuid4().hex[:6].upper()
    cert_id_str = f"CERT-{now.year}-{unique_suffix}"
    vfy_id_str = f"VFY-{uuid.uuid4().hex[:10].upper()}"
    doc = {
        "id": next_seq(mdb, "certificates"),
        "certificate_id": cert_id_str,
        "verification_id": vfy_id_str,
        "learner_id": learner_id,
        "course_id": course_id,
        "provider_id": course["provider_id"],
        "score": score,
        "issue_date": now,
        "completion_date": now,
        "status": "valid",
        "revocation_reason": None,
        "revoked_at": None,
        "qr_code_data": f"/verify/{vfy_id_str}",
    }
    mdb["certificates"].insert_one(doc)
    return hydrate_certificates_list(mdb, [doc])[0]


def revoke_certificate(mdb: Any, cert_id: int, current_user: Any, revocation_reason: str) -> Record:
    doc = mdb["certificates"].find_one({"id": cert_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    if current_user.role != "admin" and doc["provider_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    mdb["certificates"].update_one(
        {"id": cert_id},
        {
            "$set": {
                "status": "revoked",
                "revocation_reason": revocation_reason.strip(),
                "revoked_at": datetime.utcnow(),
            }
        },
    )
    updated = mdb["certificates"].find_one({"id": cert_id})
    return hydrate_certificates_list(mdb, [updated])[0]


def find_certificate_by_code(mdb: Any, identifier: str) -> Optional[Record]:
    clean_id = identifier.strip()
    regex_exact = {"$regex": f"^{re.escape(clean_id)}$", "$options": "i"}
    doc = mdb["certificates"].find_one({
        "$or": [
            {"verification_id": regex_exact},
            {"certificate_id": regex_exact},
        ]
    })
    if not doc:
        return None
    return hydrate_certificates_list(mdb, [doc])[0]


def create_verification_request(mdb: Any, req_in: Any) -> Record:
    cert = find_certificate_by_code(mdb, req_in.certificate_id)
    if cert and cert.status == "valid":
        status_result = "verified"
    elif cert and cert.status == "revoked":
        status_result = "rejected"
    else:
        status_result = "pending"

    now = datetime.utcnow()
    unique_req_id = f"VR-{now.year}-{uuid.uuid4().hex[:6].upper()}"
    doc = {
        "id": next_seq(mdb, "verification_requests"),
        "request_id": unique_req_id,
        "requester_name": req_in.requester_name.strip(),
        "requester_email": req_in.requester_email.lower().strip(),
        "requester_organization": req_in.requester_organization.strip() if req_in.requester_organization else None,
        "certificate_id": req_in.certificate_id.strip(),
        "status": status_result,
        "notes": req_in.notes,
        "verified_at": now,
        "created_at": now,
    }
    mdb["verification_requests"].insert_one(doc)
    return hydrate_verification_request(doc)


def list_verification_requests(mdb: Any, status_filter: Optional[str] = None, search: Optional[str] = None) -> List[Record]:
    filt: Dict[str, Any] = {}
    if status_filter and status_filter.lower() != "all":
        filt["status"] = status_filter.lower()
    if search:
        pattern = re.escape(search.strip())
        filt["$or"] = [
            {"request_id": {"$regex": pattern, "$options": "i"}},
            {"requester_name": {"$regex": pattern, "$options": "i"}},
            {"certificate_id": {"$regex": pattern, "$options": "i"}},
            {"requester_organization": {"$regex": pattern, "$options": "i"}},
        ]
    docs = list(mdb["verification_requests"].find(filt).sort("created_at", DESCENDING))
    return [hydrate_verification_request(d) for d in docs]


# -----------------------------
# Settings
# -----------------------------

def list_settings(mdb: Any) -> List[Record]:
    return [doc_to_record(d, {"description": None}) for d in mdb["system_settings"].find({})]


def upsert_setting(mdb: Any, key: str, value: str, description: Optional[str] = None) -> None:
    now = datetime.utcnow()
    existing = mdb["system_settings"].find_one({"key": key})
    if not existing:
        mdb["system_settings"].insert_one({
            "id": next_seq(mdb, "system_settings"),
            "key": key,
            "value": value,
            "description": description,
            "updated_at": now,
        })
    else:
        updates: Dict[str, Any] = {"value": value, "updated_at": now}
        if description:
            updates["description"] = description
        mdb["system_settings"].update_one({"key": key}, {"$set": updates})


# -----------------------------
# Reports
# -----------------------------

def get_certificate_issuance_report_data(
    mdb: Any,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status_filter: Optional[str] = None,
) -> Dict[str, Any]:
    filt: Dict[str, Any] = {}
    date_cond: Dict[str, Any] = {}
    if start_date:
        date_cond["$gte"] = start_date
    if end_date:
        date_cond["$lte"] = end_date
    if date_cond:
        filt["issue_date"] = date_cond
    if status_filter and status_filter.lower() != "all":
        filt["status"] = status_filter.lower()

    cert_docs = list(mdb["certificates"].find(filt).sort("issue_date", DESCENDING))
    certificates = hydrate_certificates_list(mdb, cert_docs)

    total_issued = len(certificates)
    valid_count = sum(1 for c in certificates if c.status.lower() == "valid")
    revoked_count = sum(1 for c in certificates if c.status.lower() == "revoked")
    avg_score = (sum(c.score for c in certificates) / total_issued) if total_issued > 0 else 0.0

    records = []
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
            "revocation_reason": c.revocation_reason,
        })

    return {
        "report_title": "Certificate Issuance Report",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": total_issued,
        "summary_metrics": {
            "total_issued": total_issued,
            "valid_count": valid_count,
            "revoked_count": revoked_count,
            "average_score": round(avg_score, 1),
        },
        "chart_data": {
            "labels": list(monthly_data.keys()),
            "values": list(monthly_data.values()),
            "status_breakdown": {"Valid": valid_count, "Revoked": revoked_count},
        },
        "records": records,
    }


def get_course_completion_report_data(mdb: Any, category_filter: Optional[str] = None) -> Dict[str, Any]:
    filt: Dict[str, Any] = {}
    if category_filter and category_filter.lower() != "all":
        filt["category"] = category_filter

    course_docs = list(mdb["courses"].find(filt).sort("id", ASCENDING))
    courses = hydrate_courses_list(mdb, course_docs, include_enrollment_count=False)

    all_enrollments = list(mdb["enrollments"].find({}, {"course_id": 1, "status": 1, "progress_percentage": 1}))
    enrollments_by_course: Dict[int, List[Dict[str, Any]]] = {}
    for e in all_enrollments:
        enrollments_by_course.setdefault(e["course_id"], []).append(e)

    records = []
    total_enrollments_all = 0
    total_completed_all = 0
    chart_labels = []
    chart_completion_rates = []
    chart_enrolled = []

    for course in courses:
        c_enrolls = enrollments_by_course.get(course.id, [])
        total_learners = len(c_enrolls)
        completed_learners = sum(
            1 for e in c_enrolls if e.get("status") == "completed" or float(e.get("progress_percentage", 0.0)) >= 100.0
        )
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
            "completion_percentage": completion_pct,
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
            "overall_completion_rate": overall_rate,
        },
        "chart_data": {
            "labels": chart_labels,
            "completion_rates": chart_completion_rates,
            "enrolled_counts": chart_enrolled,
        },
        "records": records,
    }


def get_verification_requests_report_data(mdb: Any, status_filter: Optional[str] = None) -> Dict[str, Any]:
    filt: Dict[str, Any] = {}
    if status_filter and status_filter.lower() != "all":
        filt["status"] = status_filter.lower()

    requests = [hydrate_verification_request(d) for d in mdb["verification_requests"].find(filt).sort("created_at", DESCENDING)]
    total_requests = len(requests)
    verified_count = sum(1 for r in requests if r.status.lower() == "verified")
    pending_count = sum(1 for r in requests if r.status.lower() == "pending")
    rejected_count = sum(1 for r in requests if r.status.lower() == "rejected")

    records = [
        {
            "id": r.id,
            "request_id": r.request_id,
            "requester_name": r.requester_name,
            "requester_email": r.requester_email,
            "requester_organization": r.requester_organization or "Independent",
            "certificate_id": r.certificate_id,
            "request_date": r.created_at.isoformat(),
            "verification_result": r.status,
            "notes": r.notes,
        }
        for r in requests
    ]

    return {
        "report_title": "Verification Requests Report",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": total_requests,
        "summary_metrics": {
            "total_requests": total_requests,
            "verified_count": verified_count,
            "pending_count": pending_count,
            "rejected_count": rejected_count,
        },
        "chart_data": {
            "labels": ["Verified", "Pending", "Rejected"],
            "values": [verified_count, pending_count, rejected_count],
        },
        "records": records,
    }


def get_learner_progress_report_data(mdb: Any, course_id: Optional[int] = None) -> Dict[str, Any]:
    filt = {"course_id": course_id} if course_id else {}
    enrollment_docs = list(mdb["enrollments"].find(filt).sort("id", ASCENDING))
    enrollments = hydrate_enrollments_list(mdb, enrollment_docs)

    assessments_by_course: Dict[int, List[int]] = {}
    for a in mdb["assessments"].find({}, {"id": 1, "course_id": 1}):
        assessments_by_course.setdefault(a["course_id"], []).append(a["id"])

    results_by_pair: Dict[tuple, float] = {}
    for res in mdb["assessment_results"].find({}, {"assessment_id": 1, "user_id": 1, "score": 1}):
        key = (res["assessment_id"], res["user_id"])
        sc = float(res["score"])
        if key not in results_by_pair or sc > results_by_pair[key]:
            results_by_pair[key] = sc

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

        course_assessment_ids = assessments_by_course.get(e.course_id, [])
        scores = [
            results_by_pair[(aid, e.user_id)]
            for aid in course_assessment_ids
            if (aid, e.user_id) in results_by_pair
        ]
        score_val = max(scores) if scores else None
        pct = round(float(e.progress_percentage), 1)
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
            "enrolled_at": e.enrolled_at.isoformat(),
        })

    avg_prog = round(total_progress_sum / len(enrollments), 1) if enrollments else 0.0

    return {
        "report_title": "Learner Progress Report",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": len(enrollments),
        "summary_metrics": {
            "total_enrolled_learners": len(enrollments),
            "average_progress": avg_prog,
            "high_achievers": sum(1 for r in records if r["assessment_score"] and r["assessment_score"] >= 90),
        },
        "chart_data": {
            "labels": list(progress_buckets.keys()),
            "values": list(progress_buckets.values()),
        },
        "records": records,
    }

