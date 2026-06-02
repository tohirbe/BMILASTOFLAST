# Akademik qarzdorlik moduli
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.utils import ROLE_PERMISSIONS
from app.models import AcademicDebt, Grade, DebtStatusEnum, User

router = APIRouter(prefix="/debts", tags=["Akademik qarzdorlik"])

def _check_perm(user: User, perm: str):
    if perm not in ROLE_PERMISSIONS.get(user.rol.value, []):
        raise HTTPException(403, "Ruxsat yo'q")

class RetakeIn(BaseModel):
    yangi_ball: float

def _debt_out(d: AcademicDebt):
    return {
        "id": d.id,
        "talaba_id": d.talaba_id,
        "talaba_ism": f"{d.student.familiya} {d.student.ism}",
        "guruh_nomi": d.student.group.nomi,
        "fan_id": d.fan_id,
        "fan_nomi": d.subject.nomi,
        "semestr": d.semestr,
        "holat": d.holat.value,
        "yuzaga_kelgan_sana": d.yuzaga_kelgan_sana.isoformat() if d.yuzaga_kelgan_sana else None,
        "qayta_topshirish_sana": d.qayta_topshirish_sana.isoformat() if d.qayta_topshirish_sana else None,
        "yangi_ball": d.yangi_ball
    }

@router.get("")
def list_debts(talaba_id: Optional[int] = None,
               fan_id: Optional[int] = None,
               guruh_id: Optional[int] = None,
               holat: Optional[str] = None,
               db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "view_debts")
    q = db.query(AcademicDebt)
    if current_user.rol.value == "talaba":
        if not current_user.student_id:
            return []
        q = q.filter(AcademicDebt.talaba_id == current_user.student_id)
    else:
        if talaba_id:
            q = q.filter(AcademicDebt.talaba_id == talaba_id)
        if fan_id:
            q = q.filter(AcademicDebt.fan_id == fan_id)
        if guruh_id:
            from app.models import Student
            q = q.join(Student, AcademicDebt.talaba_id == Student.id).filter(Student.group_id == guruh_id)
    if holat:
        q = q.filter(AcademicDebt.holat == holat)
    debts = q.order_by(AcademicDebt.yuzaga_kelgan_sana.desc()).all()
    return [_debt_out(d) for d in debts]

@router.get("/count/open")
def open_debts_count(db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "view_debts")
    count = db.query(AcademicDebt).filter(AcademicDebt.holat == DebtStatusEnum.ochiq).count()
    return {"ochiq_qarzdorliklar": count}

@router.post("/{debt_id}/retake")
def retake_debt(debt_id: int, data: RetakeIn,
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "manage_debts")
    debt = db.query(AcademicDebt).filter_by(id=debt_id).first()
    if not debt:
        raise HTTPException(404, "Qarzdorlik topilmadi")
    if debt.holat == DebtStatusEnum.yopilgan:
        raise HTTPException(400, "Bu qarzdorlik allaqachon yopilgan")
    debt.yangi_ball = data.yangi_ball
    debt.qayta_topshirish_sana = datetime.utcnow()
    if data.yangi_ball >= 56:
        debt.holat = DebtStatusEnum.yopilgan
    # Bahoni ham yangilaymiz
    if debt.grade_id:
        grade = db.query(Grade).filter_by(id=debt.grade_id).first()
        if grade:
            grade.ball = data.yangi_ball
            grade.yakuniy_ball = data.yangi_ball
    db.commit()
    return _debt_out(debt)
