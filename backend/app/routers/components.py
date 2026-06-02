# Baholash komponentlari: JN/ON/YN ulushi va ball kiritish
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.utils import ROLE_PERMISSIONS
from app.models import Subject, SubjectWeights, Grade, AcademicDebt, GradeWindow, DebtStatusEnum, User

router = APIRouter(prefix="/components", tags=["Baholash komponentlari"])

def _check_perm(user: User, perm: str):
    if perm not in ROLE_PERMISSIONS.get(user.rol.value, []):
        raise HTTPException(403, "Ruxsat yo'q")

def _calc_yakuniy(jn, on, yn, w_jn, w_on, w_yn) -> Optional[float]:
    if jn is None or on is None or yn is None:
        return None
    return round(jn * w_jn + on * w_on + yn * w_yn, 1)

def _sync_debt(db: Session, grade: Grade):
    """Yakuniy ball asosida qarzdorlikni avtomatik boshqarish"""
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
    elif existing and existing.holat == DebtStatusEnum.ochiq:
        existing.holat = DebtStatusEnum.yopilgan

# ─── Sxemalar ───────────────────────────────────────────────────────────────

class WeightsIn(BaseModel):
    jn_ulush: float
    on_ulush: float
    yn_ulush: float

class ComponentBallIn(BaseModel):
    jn_ball: Optional[float] = None
    on_ball: Optional[float] = None
    yn_ball: Optional[float] = None

# ─── Endpointlar ─────────────────────────────────────────────────────────────

@router.get("/weights/{subject_id}")
def get_weights(subject_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    w = db.query(SubjectWeights).filter_by(subject_id=subject_id).first()
    if not w:
        return {"subject_id": subject_id, "jn_ulush": 0.30, "on_ulush": 0.30, "yn_ulush": 0.40}
    return {"subject_id": subject_id, "jn_ulush": w.jn_ulush, "on_ulush": w.on_ulush, "yn_ulush": w.yn_ulush}

@router.put("/weights/{subject_id}")
def set_weights(subject_id: int, data: WeightsIn,
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "manage_subjects")
    if abs(data.jn_ulush + data.on_ulush + data.yn_ulush - 1.0) > 0.001:
        raise HTTPException(400, "Ulushlar yig'indisi 1.0 bo'lishi kerak")
    subj = db.query(Subject).filter_by(id=subject_id).first()
    if not subj:
        raise HTTPException(404, "Fan topilmadi")
    w = db.query(SubjectWeights).filter_by(subject_id=subject_id).first()
    if w:
        w.jn_ulush = data.jn_ulush
        w.on_ulush = data.on_ulush
        w.yn_ulush = data.yn_ulush
    else:
        w = SubjectWeights(subject_id=subject_id, **data.dict())
        db.add(w)
    db.commit()
    return {"ok": True}

@router.put("/grade/{grade_id}")
def update_components(grade_id: int, data: ComponentBallIn,
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "enter_grades")
    grade = db.query(Grade).filter_by(id=grade_id).first()
    if not grade:
        raise HTTPException(404, "Baho topilmadi")

    # Grade window tekshirish
    win = db.query(GradeWindow).filter_by(
        guruh_id=grade.student.group_id,
        fan_id=grade.subject_id,
        semestr=grade.semestr
    ).first()
    if win and win.holati == "yopiq":
        raise HTTPException(403, "Baholash oynasi yopiq")

    # O'qituvchi faqat o'z fanlarini o'zgartira oladi
    if current_user.rol.value == "oqituvchi":
        allowed = [ts.subject_id for ts in current_user.teacher_subjects]
        if grade.subject_id not in allowed:
            raise HTTPException(403, "Bu fan sizga biriktirilmagan")

    w = db.query(SubjectWeights).filter_by(subject_id=grade.subject_id).first()
    wj = w.jn_ulush if w else 0.30
    wo = w.on_ulush if w else 0.30
    wy = w.yn_ulush if w else 0.40

    if data.jn_ball is not None:
        grade.jn_ball = data.jn_ball
    if data.on_ball is not None:
        grade.on_ball = data.on_ball
    if data.yn_ball is not None:
        grade.yn_ball = data.yn_ball

    yak = _calc_yakuniy(grade.jn_ball, grade.on_ball, grade.yn_ball, wj, wo, wy)
    if yak is not None:
        grade.yakuniy_ball = yak
        grade.ball = yak   # backward compat

    db.commit()
    _sync_debt(db, grade)
    db.commit()
    return {
        "id": grade.id,
        "jn_ball": grade.jn_ball,
        "on_ball": grade.on_ball,
        "yn_ball": grade.yn_ball,
        "yakuniy_ball": grade.yakuniy_ball
    }
