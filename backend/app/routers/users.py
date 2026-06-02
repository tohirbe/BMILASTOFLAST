from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserOut, UserUpdate
from app.auth.dependencies import require_permission
from app.auth.utils import hash_password

router = APIRouter(prefix="/users", tags=["Foydalanuvchilar"])

@router.get("", response_model=List[UserOut])
def get_users(current_user: User=Depends(require_permission("manage_users")), db: Session=Depends(get_db)):
    return db.query(User).order_by(User.familiya).all()

@router.post("", response_model=UserOut)
def create_user(user: UserCreate, current_user: User=Depends(require_permission("manage_users")), db: Session=Depends(get_db)):
    if db.query(User).filter(User.login==user.login).first():
        raise HTTPException(400,"Bu login allaqachon mavjud")
    db_u = User(login=user.login,parol_hash=hash_password(user.parol),ism=user.ism,familiya=user.familiya,rol=user.rol,student_id=user.student_id)
    db.add(db_u); db.commit(); db.refresh(db_u)
    return db_u

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user_data: UserUpdate, current_user: User=Depends(require_permission("manage_users")), db: Session=Depends(get_db)):
    u = db.query(User).filter(User.id==user_id).first()
    if not u: raise HTTPException(404,"Foydalanuvchi topilmadi")
    if user_data.ism: u.ism=user_data.ism
    if user_data.familiya: u.familiya=user_data.familiya
    if user_data.rol: u.rol=user_data.rol
    if user_data.parol: u.parol_hash=hash_password(user_data.parol)
    db.commit(); db.refresh(u)
    return u

@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: User=Depends(require_permission("manage_users")), db: Session=Depends(get_db)):
    u = db.query(User).filter(User.id==user_id).first()
    if not u: raise HTTPException(404,"Foydalanuvchi topilmadi")
    if u.id==current_user.id: raise HTTPException(400,"O'z akkauntingizni o'chira olmaysiz")
    db.delete(u); db.commit()
    return {"message":"O'chirildi"}
