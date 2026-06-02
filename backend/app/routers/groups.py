from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Group, User
from app.schemas import GroupCreate, GroupOut
from app.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/groups", tags=["Guruhlar"])

@router.get("", response_model=List[GroupOut])
def get_groups(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    return db.query(Group).order_by(Group.nomi).all()

@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    g = db.query(Group).filter(Group.id==group_id).first()
    if not g: raise HTTPException(404,"Guruh topilmadi")
    return g

@router.post("", response_model=GroupOut)
def create_group(group: GroupCreate, current_user: User=Depends(require_permission("manage_students")), db: Session=Depends(get_db)):
    db_g = Group(**group.model_dump()); db.add(db_g); db.commit(); db.refresh(db_g)
    return db_g
