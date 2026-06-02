from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Grade, User, Student, GradeWindow, GradeAudit, AcademicDebt, DebtStatusEnum, SubjectWeights
from app.schemas import GradeCreate, GradeOut
from app.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/grades", tags=["Baholar"])

def _check_window(db: Session, student_id: int, subject_id: int, semestr: int):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return False, "Talaba topilmadi"
    window = db.query(GradeWindow).filter(
        GradeWindow.guruh_id == student.group_id,
        GradeWindow.fan_id == subject_id,
        GradeWindow.semestr == semestr
    ).first()
    if not window:
        return True, None
    if window.holati == "yopiq":
        return False, "Baholash oynasi yopilgan — o'zgartirish mumkin emas"
    return True, None

def _sync_debt(db: Session, grade: Grade):
    """Yakuniy ball asosida qarzdorlikni boshqarish"""
    ball = grade.yakuniy_ball if grade.yakuniy_ball is not None else grade.ball
    existing = db.query(AcademicDebt).filter_by(
        talaba_id=grade.student_id,
        fan_id=grade.subject_id,
        semestr=grade.semestr
    ).first()
    if ball is not None and ball < 56:
        if not existing:
            db.add(AcademicDebt(
                talaba_id=grade.student_id,
                fan_id=grade.subject_id,
                semestr=grade.semestr,
                holat=DebtStatusEnum.ochiq,
                grade_id=grade.id
            ))
    elif existing and existing.holat == DebtStatusEnum.ochiq and ball >= 56:
        existing.holat = DebtStatusEnum.yopilgan

def _calc_yakuniy(grade: Grade, db: Session) -> Optional[float]:
    if grade.jn_ball is None or grade.on_ball is None or grade.yn_ball is None:
        return None
    w = db.query(SubjectWeights).filter_by(subject_id=grade.subject_id).first()
    wj = w.jn_ulush if w else 0.30
    wo = w.on_ulush if w else 0.30
    wy = w.yn_ulush if w else 0.40
    return round(grade.jn_ball * wj + grade.on_ball * wo + grade.yn_ball * wy, 1)

@router.get("", response_model=List[GradeOut])
def get_grades(
    student_id: Optional[int]=Query(None),
    subject_id: Optional[int]=Query(None),
    semestr: Optional[int]=Query(None),
    current_user: User=Depends(get_current_user),
    db: Session=Depends(get_db)
):
    query = db.query(Grade)
    if current_user.rol.value == "talaba":
        query = query.filter(Grade.student_id == current_user.student_id)
    if student_id: query = query.filter(Grade.student_id == student_id)
    if subject_id: query = query.filter(Grade.subject_id == subject_id)
    if semestr: query = query.filter(Grade.semestr == semestr)
    return query.all()

@router.post("", response_model=GradeOut)
def create_grade(
    grade: GradeCreate,
    current_user: User=Depends(require_permission("enter_grades")),
    db: Session=Depends(get_db)
):
    if current_user.rol.value == "oqituvchi":
        tsids = [ts.subject_id for ts in current_user.teacher_subjects]
        if grade.subject_id not in tsids:
            raise HTTPException(403, "Bu fanga baho qo'yish ruxsatingiz yo'q")
        ok, msg = _check_window(db, grade.student_id, grade.subject_id, grade.semestr)
        if not ok:
            raise HTTPException(403, msg)
    db_g = Grade(**grade.model_dump())
    db.add(db_g)
    db.commit()
    db.refresh(db_g)
    _sync_debt(db, db_g)
    db.commit()
    return db_g

@router.put("/{grade_id}", response_model=GradeOut)
def update_grade(
    grade_id: int,
    grade: GradeCreate,
    izoh: Optional[str] = Query(None),
    current_user: User=Depends(require_permission("edit_grades")),
    db: Session=Depends(get_db)
):
    db_g = db.query(Grade).filter(Grade.id == grade_id).first()
    if not db_g:
        raise HTTPException(404, "Baho topilmadi")
    if current_user.rol.value == "oqituvchi":
        tsids = [ts.subject_id for ts in current_user.teacher_subjects]
        if db_g.subject_id not in tsids:
            raise HTTPException(403, "Bu fan sizga biriktirilmagan")
    ok, msg = _check_window(db, db_g.student_id, db_g.subject_id, db_g.semestr)
    if not ok:
        raise HTTPException(403, msg)
    audit = GradeAudit(
        grade_id=grade_id,
        o_zgartirgan_user_id=current_user.id,
        eski_ball=db_g.ball,
        yangi_ball=grade.ball,
        eski_davomat=db_g.davomat_foizi,
        yangi_davomat=grade.davomat_foizi,
        izoh=izoh
    )
    db.add(audit)
    db_g.ball = grade.ball
    db_g.davomat_foizi = grade.davomat_foizi
    yak = _calc_yakuniy(db_g, db)
    if yak is not None:
        db_g.yakuniy_ball = yak
        db_g.ball = yak
    db.commit()
    db.refresh(db_g)
    _sync_debt(db, db_g)
    db.commit()
    return db_g

@router.get("/{grade_id}/history")
def get_grade_history(
    grade_id: int,
    current_user: User=Depends(require_permission("view_grade_audit")),
    db: Session=Depends(get_db)
):
    logs = db.query(GradeAudit).filter(GradeAudit.grade_id == grade_id)\
        .order_by(GradeAudit.sana.desc()).all()
    result = []
    for log in logs:
        u = db.query(User).filter(User.id == log.o_zgartirgan_user_id).first()
        result.append({
            "id": log.id,
            "sana": log.sana.isoformat() if log.sana else None,
            "kim": f"{u.ism} {u.familiya}" if u else "Noma'lum",
            "rol": u.rol.value if u else "",
            "eski_ball": log.eski_ball,
            "yangi_ball": log.yangi_ball,
            "eski_davomat": log.eski_davomat,
            "yangi_davomat": log.yangi_davomat,
            "izoh": log.izoh
        })
    return result

@router.delete("/{grade_id}")
def delete_grade(
    grade_id: int,
    current_user: User=Depends(require_permission("enter_grades")),
    db: Session=Depends(get_db)
):
    g = db.query(Grade).filter(Grade.id == grade_id).first()
    if not g: raise HTTPException(404, "Baho topilmadi")
    db.delete(g)
    db.commit()
    return {"message": "O'chirildi"}
