from typing import Any, Dict
from fastapi import APIRouter, Depends

from app.database import get_db
from app.models.verification import SystemSetting
from app.mongo_db import is_mongo_db
from app import mongo_repo
from app.schemas.verification import SettingUpdate
from app.services.auth import require_roles

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_SETTINGS = {
    "platform_name": "Online Course Certification and Credential Verification Portal",
    "default_passing_percentage": "75.0",
    "auto_issue_certificates": "true",
    "verification_mode": "instant",
    "support_email": "support@credentialverify.local",
    "security_seal_enabled": "true",
    "qr_code_resolution": "high",
}


@router.get("", response_model=Dict[str, str])
def get_settings(db: Any = Depends(get_db)):
    if is_mongo_db(db):
        settings_records = mongo_repo.list_settings(db)
    else:
        settings_records = db.query(SystemSetting).all()

    results = dict(DEFAULT_SETTINGS)
    for s in settings_records:
        results[s.key] = s.value
    return results


@router.put("/{key}", response_model=Dict[str, str])
def update_setting(
    key: str,
    update_data: SettingUpdate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin"])),
):
    if is_mongo_db(db):
        mongo_repo.upsert_setting(db, key, update_data.value, update_data.description)
        return {"status": "success", "key": key, "value": update_data.value}

    record = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not record:
        record = SystemSetting(key=key, value=update_data.value, description=update_data.description)
        db.add(record)
    else:
        record.value = update_data.value
        if update_data.description:
            record.description = update_data.description

    db.commit()
    return {"status": "success", "key": key, "value": update_data.value}
