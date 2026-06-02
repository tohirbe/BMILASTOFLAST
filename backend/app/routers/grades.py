from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Grade, User
from app.schemas import GradeCreate, GradeOut
from app.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/grades", tags=["Baholar"])

@router.get("", response_model=List[GradeOut])
def get_grades(student_id: Optional[int]=Query(None), subject_id: Optional[int]=Query(None), semestr: Optional[int]=Query(None), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    query = db.query(Grade)
    if current_user.rol.value == "talaba":
        query = query.filter(Grade.student_id == current_user.student_id)
    if student_id: query = query.filter(Grade.student_id == student_id)
    if subject_id: query = query.filter(Grade.subject_id == subject_id)
    if semestr: query = query.filter(Grade.semestr == semestr)
    return query.all()

@router.post("", response_model=GradeOut)
def create_grade(grade: GradeCreate, current_user: User=Depends(require_permission("enter_grades")), db: Session=Depends(get_db)):
    if current_user.rol.value == "oqituvchi":
        tsids = [ts.subject_id for ts in current_user.teacher_subjects]
        if grade.subject_id not in tsids:
            raise HTTPException(403,"Bu fanga baho qo'yish ruxsatingiz yo'q")
    db_g = Grade(**grade.model_dump()); db.add(db_g); db.commit(); db.refresh(db_g)
    return db_g

@router.delete("/{grade_id}")
def delete_grade(grade_id: int, current_user: User=Depends(require_permission("enter_grades")), db: Session=Depends(get_db)):
    g = db.query(Grade).filter(Grade.id==grade_id).first()
    if not g: raise HTTPException(404,"Baho topilmadi")
    db.delete(g); db.commit()
    return {"message":"O'chirildi"}
