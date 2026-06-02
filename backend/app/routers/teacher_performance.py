# O'qituvchi samaradorligi tahlili
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.utils import ROLE_PERMISSIONS
from app.models import User, TeacherSubject, Grade, Attendance, LessonSession, AcademicDebt, RoleEnum, DebtStatusEnum

router = APIRouter(prefix="/analytics/teachers", tags=["O'qituvchi samaradorligi"])

def _check_perm(user: User, perm: str):
    if perm not in ROLE_PERMISSIONS.get(user.rol.value, []):
        raise HTTPException(403, "Ruxsat yo'q")

def _teacher_stats(teacher: User, db: Session) -> dict:
    subject_ids = [ts.subject_id for ts in teacher.teacher_subjects]
    if not subject_ids:
        return {
            "teacher_id": teacher.id,
            "ism": f"{teacher.familiya} {teacher.ism}",
            "fanlar_soni": 0,
            "o_rtacha_ball": None,
            "ozlashtirish_foizi": None,
            "o_rtacha_davomat": None,
            "ochiq_qarzlar": 0
        }

    grades = db.query(Grade).filter(Grade.subject_id.in_(subject_ids)).all()
    total = len(grades)
    if total == 0:
        avg_ball = None
        ozlashtirish = None
    else:
        balls = [g.yakuniy_ball if g.yakuniy_ball is not None else g.ball for g in grades]
        avg_ball = round(sum(balls) / len(balls), 1)
        o_tganlar = sum(1 for b in balls if b >= 56)
        ozlashtirish = round(o_tganlar / total * 100, 1)

    # Davomat
    lesson_ids = [l.id for l in db.query(LessonSession).filter(
        LessonSession.oqituvchi_id == teacher.id).all()]
    if lesson_ids:
        att_total = db.query(Attendance).filter(Attendance.dars_id.in_(lesson_ids)).count()
        att_keldi = db.query(Attendance).filter(
            Attendance.dars_id.in_(lesson_ids),
            Attendance.holat.in_(["keldi", "kechikdi"])
        ).count()
        avg_davomat = round(att_keldi / att_total * 100, 1) if att_total else None
    else:
        avg_davomat = None

    ochiq_qarz = db.query(AcademicDebt).filter(
        AcademicDebt.fan_id.in_(subject_ids),
        AcademicDebt.holat == DebtStatusEnum.ochiq
    ).count()

    return {
        "teacher_id": teacher.id,
        "ism": f"{teacher.familiya} {teacher.ism}",
        "fanlar_soni": len(subject_ids),
        "o_rtacha_ball": avg_ball,
        "ozlashtirish_foizi": ozlashtirish,
        "o_rtacha_davomat": avg_davomat,
        "ochiq_qarzlar": ochiq_qarz
    }

@router.get("")
def all_teachers_performance(db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    if current_user.rol.value == "oqituvchi":
        stats = _teacher_stats(current_user, db)
        return [stats]
    _check_perm(current_user, "view_teacher_performance")
    teachers = db.query(User).filter(User.rol == RoleEnum.oqituvchi).all()
    return [_teacher_stats(t, db) for t in teachers]

@router.get("/{teacher_id}")
def teacher_performance(teacher_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    if current_user.rol.value == "oqituvchi" and current_user.id != teacher_id:
        raise HTTPException(403, "Faqat o'z ko'rsatkichlarini ko'rish mumkin")
    if current_user.rol.value not in ("oqituvchi",):
        _check_perm(current_user, "view_teacher_performance")
    teacher = db.query(User).filter_by(id=teacher_id, rol=RoleEnum.oqituvchi).first()
    if not teacher:
        raise HTTPException(404, "O'qituvchi topilmadi")

    base = _teacher_stats(teacher, db)

    # Fanlar bo'yicha tafsilot
    subject_ids = [ts.subject_id for ts in teacher.teacher_subjects]
    fan_tafsilot = []
    for sid in subject_ids:
        grades = db.query(Grade).filter_by(subject_id=sid).all()
        if grades:
            balls = [g.yakuniy_ball if g.yakuniy_ball is not None else g.ball for g in grades]
            avg = round(sum(balls) / len(balls), 1)
            o_td = round(sum(1 for b in balls if b >= 56) / len(balls) * 100, 1)
            fan_tafsilot.append({
                "fan_id": sid,
                "fan_nomi": grades[0].subject.nomi,
                "o_rtacha_ball": avg,
                "ozlashtirish_foizi": o_td,
                "talabalar_soni": len(grades)
            })

    base["fan_tafsilot"] = fan_tafsilot
    return base
