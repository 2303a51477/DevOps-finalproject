from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.user import User
from app.mongo_db import is_mongo_db
from app import mongo_repo
from app.schemas.user import UserCreate, UserResponse, TokenResponse, LoginRequest
from app.services.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Any = Depends(get_db)):
    valid_roles = ["admin", "provider", "learner", "verifier"]
    role = user_in.role.lower() if user_in.role else "learner"
    if role not in valid_roles:
        role = "learner"

    if is_mongo_db(db):
        new_user = mongo_repo.create_user(
            db,
            name=user_in.name,
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            role=role,
            organization=user_in.organization,
            is_active=True,
        )
        access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
        return {"access_token": access_token, "token_type": "bearer", "user": new_user}

    # Check if email exists
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        password_hash=get_password_hash(user_in.password),
        role=role,
        organization=user_in.organization.strip() if user_in.organization else None,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
    }


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Any = Depends(get_db)):
    if is_mongo_db(db):
        user = mongo_repo.get_user_by_email(db, login_data.email)
    else:
        user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated. Contact administrator.")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Any = Depends(get_current_user)):
    return current_user
