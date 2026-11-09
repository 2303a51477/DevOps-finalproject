from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.courses import router as courses_router
from app.routers.enrollments import router as enrollments_router
from app.routers.assessments import router as assessments_router
from app.routers.certificates import router as certificates_router
from app.routers.verification import router as verification_router
from app.routers.reports import router as reports_router
from app.routers.settings import router as settings_router

__all__ = [
    "auth_router",
    "users_router",
    "courses_router",
    "enrollments_router",
    "assessments_router",
    "certificates_router",
    "verification_router",
    "reports_router",
    "settings_router",
]
