import json
import logging
import re
from datetime import datetime
from types import SimpleNamespace
from typing import Any, Dict, List, Optional

from pymongo import ASCENDING, MongoClient, ReturnDocument
from pymongo.database import Database

from app.config import settings

logger = logging.getLogger("credential_portal.mongodb")


class Record(SimpleNamespace):
    """Lightweight attribute container compatible with Pydantic from_attributes=True."""
    pass


def is_mongo_db(db: Any) -> bool:
    """Return True if db handle is a PyMongo Database (or compatible test stub)."""
    return isinstance(db, Database) or bool(getattr(db, "_is_mongo_db", False))


def redact_mongo_uri(uri: str) -> str:
    """Redact username and password from MongoDB URI for safe logging."""
    if not uri:
        return ""
    return re.sub(r"://([^:@/]+):([^@/]+)@", "://***:***@", uri)


def doc_to_record(doc: Optional[Dict[str, Any]], defaults: Optional[Dict[str, Any]] = None) -> Optional[Record]:
    if doc is None:
        return None
    data = {k: v for k, v in doc.items() if k != "_id"}
    if defaults:
        for k, v in defaults.items():
            data.setdefault(k, v)
    return Record(**data)


def next_seq(mdb: Any, sequence_name: str) -> int:
    res = mdb["counters"].find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(res["seq"])


def ensure_mongo_indexes(mdb: Any) -> None:
    """Create unique and query indexes across all portal collections."""
    mdb["users"].create_index([("id", ASCENDING)], unique=True)
    mdb["users"].create_index([("email", ASCENDING)], unique=True)

    mdb["courses"].create_index([("id", ASCENDING)], unique=True)
    mdb["courses"].create_index([("provider_id", ASCENDING)])
    mdb["courses"].create_index([("status", ASCENDING)])

    mdb["course_modules"].create_index([("id", ASCENDING)], unique=True)
    mdb["course_modules"].create_index([("course_id", ASCENDING), ("order_index", ASCENDING)])

    mdb["enrollments"].create_index([("id", ASCENDING)], unique=True)
    mdb["enrollments"].create_index([("user_id", ASCENDING), ("course_id", ASCENDING)], unique=True)

    mdb["assessments"].create_index([("id", ASCENDING)], unique=True)
    mdb["assessments"].create_index([("course_id", ASCENDING)])

    mdb["assessment_questions"].create_index([("id", ASCENDING)], unique=True)
    mdb["assessment_questions"].create_index([("assessment_id", ASCENDING)])

    mdb["assessment_results"].create_index([("id", ASCENDING)], unique=True)
    mdb["assessment_results"].create_index([("assessment_id", ASCENDING), ("user_id", ASCENDING)])

    mdb["certificates"].create_index([("id", ASCENDING)], unique=True)
    mdb["certificates"].create_index([("certificate_id", ASCENDING)], unique=True)
    mdb["certificates"].create_index([("verification_id", ASCENDING)], unique=True)

    mdb["verification_requests"].create_index([("id", ASCENDING)], unique=True)
    mdb["verification_requests"].create_index([("request_id", ASCENDING)], unique=True)

    mdb["system_settings"].create_index([("id", ASCENDING)], unique=True)
    mdb["system_settings"].create_index([("key", ASCENDING)], unique=True)


class MongoConnectionManager:
    def __init__(self) -> None:
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self.connected: bool = False
        self.last_error: Optional[str] = None

    def connect(self) -> Optional[Database]:
        uri = settings.MONGODB_URI
        if not uri:
            self.connected = False
            self.last_error = "MONGODB_URI is not configured"
            return None

        try:
            logger.info(f"Connecting to MongoDB Atlas ({redact_mongo_uri(uri)}) -> db={settings.MONGODB_DB_NAME}")
            client = MongoClient(uri, serverSelectionTimeoutMS=8000, connectTimeoutMS=8000)
            client.admin.command("ping")
            mdb = client[settings.MONGODB_DB_NAME]
            ensure_mongo_indexes(mdb)
            self.client = client
            self.db = mdb
            self.connected = True
            self.last_error = None
            logger.info(f"Successfully connected to MongoDB database '{settings.MONGODB_DB_NAME}'.")
            return mdb
        except Exception as exc:
            self.connected = False
            self.last_error = str(exc)
            logger.error(f"MongoDB Atlas connection failed: {exc}")
            return None

    def close(self) -> None:
        if self.client is not None:
            self.client.close()
            self.client = None
            self.db = None
            self.connected = False


mongo_manager = MongoConnectionManager()


# -----------------------------
# Hydration Helpers
# -----------------------------

USER_DEFAULTS = {
    "organization": None,
    "is_active": True,
    "updated_at": None,
}

MODULE_DEFAULTS = {
    "description": None,
    "content_type": "document",
    "content_url": None,
    "reading_time_mins": 15,
    "order_index": 1,
}

COURSE_DEFAULTS = {
    "description": None,
    "category": "Technology",
    "difficulty": "Beginner",
    "duration_hours": 10,
    "passing_percentage": 70.0,
    "status": "approved",
    "thumbnail_url": None,
    "updated_at": None,
    "provider": None,
    "modules": [],
    "enrollment_count": 0,
}


def hydrate_user(doc: Optional[Dict[str, Any]]) -> Optional[Record]:
    return doc_to_record(doc, USER_DEFAULTS)


def hydrate_module(doc: Optional[Dict[str, Any]]) -> Optional[Record]:
    return doc_to_record(doc, MODULE_DEFAULTS)


def hydrate_courses_list(mdb: Any, course_docs: List[Dict[str, Any]], include_enrollment_count: bool = True) -> List[Record]:
    if not course_docs:
        return []

    course_ids = [c["id"] for c in course_docs]
    provider_ids = list({c["provider_id"] for c in course_docs if c.get("provider_id") is not None})

    providers_map: Dict[int, Record] = {}
    if provider_ids:
        for u in mdb["users"].find({"id": {"$in": provider_ids}}):
            providers_map[u["id"]] = hydrate_user(u)

    modules_by_course: Dict[int, List[Record]] = {cid: [] for cid in course_ids}
    for m in mdb["course_modules"].find({"course_id": {"$in": course_ids}}).sort([("order_index", ASCENDING), ("id", ASCENDING)]):
        rec = hydrate_module(m)
        modules_by_course.setdefault(m["course_id"], []).append(rec)

    counts_map: Dict[int, int] = {}
    if include_enrollment_count:
        for e in mdb["enrollments"].find({"course_id": {"$in": course_ids}}, {"course_id": 1}):
            cid = e["course_id"]
            counts_map[cid] = counts_map.get(cid, 0) + 1

    records: List[Record] = []
    for c in course_docs:
        rec = doc_to_record(c, COURSE_DEFAULTS)
        rec.provider = providers_map.get(c["provider_id"])
        rec.modules = modules_by_course.get(c["id"], [])
        rec.enrollment_count = counts_map.get(c["id"], 0)
        records.append(rec)
    return records


def hydrate_course(mdb: Any, course_doc: Optional[Dict[str, Any]]) -> Optional[Record]:
    if not course_doc:
        return None
    return hydrate_courses_list(mdb, [course_doc])[0]


def _serialize_completed_modules(val: Any) -> str:
    if isinstance(val, str):
        return val
    if isinstance(val, list):
        return json.dumps(val)
    return "[]"


def hydrate_enrollments_list(mdb: Any, enrollment_docs: List[Dict[str, Any]]) -> List[Record]:
    if not enrollment_docs:
        return []

    user_ids = list({e["user_id"] for e in enrollment_docs})
    course_ids = list({e["course_id"] for e in enrollment_docs})

    users_map = {
        u["id"]: hydrate_user(u)
        for u in mdb["users"].find({"id": {"$in": user_ids}})
    } if user_ids else {}

    course_docs = list(mdb["courses"].find({"id": {"$in": course_ids}})) if course_ids else []
    courses_map = {c.id: c for c in hydrate_courses_list(mdb, course_docs)}

    records: List[Record] = []
    for e in enrollment_docs:
        rec = doc_to_record(e, {
            "status": "in_progress",
            "progress_percentage": 0.0,
            "completed_modules": "[]",
            "completed_at": None,
        })
        rec.completed_modules = _serialize_completed_modules(rec.completed_modules)
        rec.user = users_map.get(e["user_id"])
        rec.course = courses_map.get(e["course_id"])
        records.append(rec)
    return records


def hydrate_assessments_list(mdb: Any, assessment_docs: List[Dict[str, Any]], mask_answers: bool = False) -> List[Record]:
    if not assessment_docs:
        return []

    assessment_ids = [a["id"] for a in assessment_docs]
    questions_by_assessment: Dict[int, List[Record]] = {aid: [] for aid in assessment_ids}

    for q in mdb["assessment_questions"].find({"assessment_id": {"$in": assessment_ids}}).sort("id", ASCENDING):
        opts = q.get("options", [])
        if isinstance(opts, str):
            try:
                opts = json.loads(opts)
            except Exception:
                opts = []
        q_rec = doc_to_record(q, {"explanation": None})
        q_rec.options = opts
        if mask_answers:
            q_rec.correct_option_index = None
            q_rec.explanation = None
        questions_by_assessment.setdefault(q["assessment_id"], []).append(q_rec)

    records: List[Record] = []
    for a in assessment_docs:
        qs = questions_by_assessment.get(a["id"], [])
        rec = doc_to_record(a, {
            "description": None,
            "passing_score": 70.0,
            "time_limit_mins": 30,
        })
        rec.questions = qs
        rec.question_count = len(qs)
        records.append(rec)
    return records


def hydrate_certificates_list(mdb: Any, cert_docs: List[Dict[str, Any]]) -> List[Record]:
    if not cert_docs:
        return []

    user_ids = list({
        uid
        for c in cert_docs
        for uid in (c.get("learner_id"), c.get("provider_id"))
        if uid is not None
    })
    course_ids = list({c["course_id"] for c in cert_docs if c.get("course_id") is not None})

    users_map = {
        u["id"]: hydrate_user(u)
        for u in mdb["users"].find({"id": {"$in": user_ids}})
    } if user_ids else {}

    course_docs = list(mdb["courses"].find({"id": {"$in": course_ids}})) if course_ids else []
    courses_map = {c.id: c for c in hydrate_courses_list(mdb, course_docs, include_enrollment_count=False)}

    records: List[Record] = []
    for c in cert_docs:
        rec = doc_to_record(c, {
            "score": 100.0,
            "status": "valid",
            "revocation_reason": None,
            "revoked_at": None,
            "qr_code_data": None,
        })
        rec.learner = users_map.get(c["learner_id"])
        rec.provider = users_map.get(c["provider_id"])
        rec.course = courses_map.get(c["course_id"])
        records.append(rec)
    return records


def hydrate_verification_request(doc: Optional[Dict[str, Any]]) -> Optional[Record]:
    return doc_to_record(doc, {
        "requester_organization": None,
        "status": "verified",
        "notes": None,
    })

