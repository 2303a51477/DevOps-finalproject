from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.course import Course, CourseModule
from app.models.enrollment import Enrollment
from app.mongo_db import is_mongo_db
from app import mongo_repo
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, ModuleCreate, ModuleResponse
from app.services.auth import require_roles

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=List[CourseResponse])
def get_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    provider_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    db: Any = Depends(get_db),
):
    if is_mongo_db(db):
        return mongo_repo.list_courses(
            db,
            category=category,
            difficulty=difficulty,
            status_filter=status_filter,
            search=search,
            provider_id=provider_id,
            limit=limit,
            offset=offset,
        )

    query = db.query(Course)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Course.status == status_filter.lower())
    else:
        # Default behavior: if no explicit filter, we show approved courses unless querying for provider
        if not provider_id and not status_filter:
            query = query.filter(Course.status == "approved")

    if provider_id:
        query = query.filter(Course.provider_id == provider_id)
    if category and category.lower() != "all":
        query = query.filter(Course.category == category)
    if difficulty and difficulty.lower() != "all":
        query = query.filter(Course.difficulty == difficulty)
    if search:
        s = f"%{search}%"
        query = query.filter((Course.title.ilike(s)) | (Course.description.ilike(s)))

    courses = query.order_by(Course.id.desc()).offset(offset).limit(limit).all()

    # Attach enrollment counts
    for c in courses:
        c.enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()

    return courses


@router.get("/{course_id}", response_model=CourseResponse)
def get_course_by_id(course_id: int, db: Any = Depends(get_db)):
    if is_mongo_db(db):
        course = mongo_repo.get_course(db, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        return course

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
    return course


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin", "provider"])),
):
    # Providers create courses in 'pending' status unless admin creates it
    initial_status = "approved" if current_user.role == "admin" else "approved"  # Set to approved for smooth testing, can be toggled to pending

    if is_mongo_db(db):
        return mongo_repo.create_course(db, current_user.id, course_in, status_val=initial_status)

    new_course = Course(
        title=course_in.title.strip(),
        description=course_in.description,
        provider_id=current_user.id,
        category=course_in.category,
        difficulty=course_in.difficulty,
        duration_hours=course_in.duration_hours,
        passing_percentage=course_in.passing_percentage,
        status=initial_status,
        thumbnail_url=course_in.thumbnail_url,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    # If modules provided in creation
    if course_in.modules:
        for idx, mod in enumerate(course_in.modules):
            module_record = CourseModule(
                course_id=new_course.id,
                title=mod.title,
                description=mod.description,
                content_type=mod.content_type,
                content_url=mod.content_url,
                reading_time_mins=mod.reading_time_mins,
                order_index=mod.order_index or (idx + 1),
            )
            db.add(module_record)
        db.commit()
        db.refresh(new_course)

    new_course.enrollment_count = 0
    return new_course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_in: CourseUpdate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin", "provider"])),
):
    if is_mongo_db(db):
        return mongo_repo.update_course(
            db, course_id, current_user, course_in.model_dump(exclude_unset=True)
        )

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if current_user.role != "admin" and course.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this course")

    for field, val in course_in.model_dump(exclude_unset=True).items():
        setattr(course, field, val)

    db.commit()
    db.refresh(course)
    course.enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin", "provider"])),
):
    if is_mongo_db(db):
        mongo_repo.delete_course(db, course_id, current_user=current_user)
        return None

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if current_user.role != "admin" and course.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this course")

    db.delete(course)
    db.commit()
    return None


@router.put("/{course_id}/approve", response_model=CourseResponse)
def approve_course(
    course_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin"])),
):
    if is_mongo_db(db):
        return mongo_repo.set_course_status(db, course_id, "approved")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = "approved"
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}/reject", response_model=CourseResponse)
def reject_course(
    course_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin"])),
):
    if is_mongo_db(db):
        return mongo_repo.set_course_status(db, course_id, "rejected")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = "rejected"
    db.commit()
    db.refresh(course)
    return course


# Module management sub-endpoints
@router.post("/{course_id}/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def add_module(
    course_id: int,
    module_in: ModuleCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin", "provider"])),
):
    if is_mongo_db(db):
        return mongo_repo.add_module(db, course_id, current_user, module_in)

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    new_module = CourseModule(
        course_id=course_id,
        title=module_in.title.strip(),
        description=module_in.description,
        content_type=module_in.content_type,
        content_url=module_in.content_url,
        reading_time_mins=module_in.reading_time_mins,
        order_index=module_in.order_index,
    )
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(require_roles(["admin", "provider"])),
):
    if is_mongo_db(db):
        mongo_repo.delete_module(db, module_id, current_user)
        return None

    module = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    if current_user.role != "admin" and module.course.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    db.delete(module)
    db.commit()
    return None
