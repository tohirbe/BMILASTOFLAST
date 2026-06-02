from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Subject, User
from app.schemas import SubjectCreate, SubjectOut
from app.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/subjects", tags=["Fanlar"])

@router.get("", response_model=List[SubjectOut])
def get_subjects(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    if current_user.rol.value == "oqituvchi":
        sids = [ts.subject_id for ts in current_user.teacher_subjects]
        return db.query(Subject).filter(Subject.id.in_(sids)).all()
    return db.query(Subject).order_by(Subject.nomi).all()

@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(subject_id: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    s = db.query(Subject).filter(Subject.id==subject_id).first()
    if not s: raise HTTPException(404,"Fan topilmadi")
    return s

@router.post("", response_model=SubjectOut)
def create_subject(subject: SubjectCreate, current_user: User=Depends(require_permission("manage_subjects")), db: Session=Depends(get_db)):
    db_s = Subject(**subject.model_dump()); db.add(db_s); db.commit(); db.refresh(db_s)
    return db_s

@router.delete("/{subject_id}")
def delete_subject(subject_id: int, current_user: User=Depends(require_permission("manage_subjects")), db: Session=Depends(get_db)):
    s = db.query(Subject).filter(Subject.id==subject_id).first()
    if not s: raise HTTPException(404,"Fan topilmadi")
    db.delete(s); db.commit()
    return {"message":"O'chirildi"}
