from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.auth import get_current_user, require_roles, get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    query = db.query(User)
    if role and role.lower() != "all":
        query = query.filter(User.role == role.lower())
    if search:
        s = f"%{search}%"
        query = query.filter((User.name.ilike(s)) | (User.email.ilike(s)) | (User.organization.ilike(s)))
        
    return query.order_by(User.id.desc()).offset(offset).limit(limit).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin can view anyone, normal users can only view their own profile
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user_in.name is not None:
        user.name = user_in.name.strip()
    if user_in.email is not None:
        existing = db.query(User).filter(User.email == user_in.email.lower().strip(), User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already taken")
        user.email = user_in.email.lower().strip()
    if user_in.organization is not None:
        user.organization = user_in.organization.strip()
    if user_in.password:
        user.password_hash = get_password_hash(user_in.password)
        
    # Only admin can change role and active status
    if current_user.role == "admin":
        if user_in.role is not None:
            user.role = user_in.role.lower()
        if user_in.is_active is not None:
            user.is_active = user_in.is_active
            
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    db.delete(user)
    db.commit()
    return None
