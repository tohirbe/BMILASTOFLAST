# Talabalar CRUD va profil endpointlari
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models import Student, Grade, User
from app.schemas import StudentCreate, StudentOut
from app.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/students", tags=["Talabalar"])

@router.get("", response_model=List[StudentOut])
def get_students(search: Optional[str]=Query(None), group_id: Optional[int]=Query(None), kurs: Optional[int]=Query(None), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    query = db.query(Student).options(joinedload(Student.group))
    if current_user.rol.value == "oqituvchi":
        tsids = [ts.subject_id for ts in current_user.teacher_subjects]
        sids = db.query(Grade.student_id).filter(Grade.subject_id.in_(tsids)).distinct().subquery()
        query = query.filter(Student.id.in_(sids))
    elif current_user.rol.value == "talaba":
        s = db.query(Student).options(joinedload(Student.group)).filter(Student.id==current_user.student_id).first()
        return [s] if s else []
    if search:
        query = query.filter((Student.ism.ilike(f"%{search}%"))|(Student.familiya.ilike(f"%{search}%")))
    if group_id:
        query = query.filter(Student.group_id == group_id)
    if kurs:
        query = query.filter(Student.kurs == kurs)
    return query.order_by(Student.familiya).all()

@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    student = db.query(Student).options(joinedload(Student.group)).filter(Student.id==student_id).first()
    if not student: raise HTTPException(404, "Talaba topilmadi")
    if current_user.rol.value=="talaba" and current_user.student_id!=student_id:
        raise HTTPException(403, "Ruxsat yo'q")
    return student

@router.get("/{student_id}/profile")
def get_student_profile(student_id: int, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    if current_user.rol.value=="talaba" and current_user.student_id!=student_id:
        raise HTTPException(403, "Ruxsat yo'q")
    student = db.query(Student).options(joinedload(Student.group)).filter(Student.id==student_id).first()
    if not student: raise HTTPException(404, "Talaba topilmadi")
    grades = db.query(Grade).filter(Grade.student_id==student_id).all()
    sem_data = {}
    for g in grades:
        sem_data.setdefault(g.semestr,[]).append(g.ball)
    semester_trend = [{"semestr":s,"ortacha_ball":round(sum(b)/len(b),1)} for s,b in sorted(sem_data.items())]
    subj_data = {}
    for g in grades:
        name = g.subject.nomi if g.subject else f"Fan {g.subject_id}"
        subj_data.setdefault(name,[]).append(g.ball)
    subject_radar = [{"fan":k,"ball":round(sum(v)/len(v),1)} for k,v in subj_data.items()]
    gpa = round(sum(g.ball for g in grades)/len(grades),1) if grades else 0
    davomat = round(sum(g.davomat_foizi for g in grades)/len(grades),1) if grades else 0
    return {"student":{"id":student.id,"ism":student.ism,"familiya":student.familiya,"kurs":student.kurs,"jinsi":student.jinsi.value,"guruh":student.group.nomi if student.group else ""},"gpa":gpa,"davomat":davomat,"semester_trend":semester_trend,"subject_radar":subject_radar,"jami_baholar":len(grades)}

@router.post("", response_model=StudentOut)
def create_student(student: StudentCreate, current_user: User=Depends(require_permission("manage_students")), db: Session=Depends(get_db)):
    db_s = Student(**student.model_dump()); db.add(db_s); db.commit(); db.refresh(db_s)
    return db_s

@router.delete("/{student_id}")
def delete_student(student_id: int, current_user: User=Depends(require_permission("manage_students")), db: Session=Depends(get_db)):
    s = db.query(Student).filter(Student.id==student_id).first()
    if not s: raise HTTPException(404,"Talaba topilmadi")
    db.delete(s); db.commit()
    return {"message":"O'chirildi"}
