# Davomat moduli
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.utils import ROLE_PERMISSIONS
from app.models import LessonSession, Attendance, Student, Group, AttendanceEnum, User, TeacherSubject

router = APIRouter(prefix="/attendance", tags=["Davomat"])

def _check_perm(user: User, perm: str):
    if perm not in ROLE_PERMISSIONS.get(user.rol.value, []):
        raise HTTPException(403, "Ruxsat yo'q")

# ─── Sxemalar ────────────────────────────────────────────────────────────────

class LessonIn(BaseModel):
    guruh_id: int
    fan_id: int
    sana: date
    mavzu: Optional[str] = None

class AttendanceItem(BaseModel):
    talaba_id: int
    holat: str  # keldi/kelmadi/kechikdi/sababli

class AttendanceBulkIn(BaseModel):
    records: List[AttendanceItem]

# ─── Endpointlar ─────────────────────────────────────────────────────────────

@router.post("/lessons")
def create_lesson(data: LessonIn, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "manage_attendance")
    if current_user.rol.value == "oqituvchi":
        allowed = [ts.subject_id for ts in current_user.teacher_subjects]
        if data.fan_id not in allowed:
            raise HTTPException(403, "Bu fan sizga biriktirilmagan")
    lesson = LessonSession(
        guruh_id=data.guruh_id,
        fan_id=data.fan_id,
        oqituvchi_id=current_user.id,
        sana=data.sana,
        mavzu=data.mavzu
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {"id": lesson.id, "sana": str(lesson.sana), "mavzu": lesson.mavzu}

@router.get("/lessons")
def list_lessons(guruh_id: Optional[int] = None, fan_id: Optional[int] = None,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "view_attendance")
    q = db.query(LessonSession)
    if current_user.rol.value == "oqituvchi":
        q = q.filter(LessonSession.oqituvchi_id == current_user.id)
    if guruh_id:
        q = q.filter(LessonSession.guruh_id == guruh_id)
    if fan_id:
        q = q.filter(LessonSession.fan_id == fan_id)
    lessons = q.order_by(LessonSession.sana.desc()).all()
    return [{"id": l.id, "guruh_id": l.guruh_id, "fan_id": l.fan_id,
             "sana": str(l.sana), "mavzu": l.mavzu,
             "guruh_nomi": l.group.nomi, "fan_nomi": l.subject.nomi} for l in lessons]

@router.post("/lessons/{lesson_id}/records")
def save_attendance(lesson_id: int, data: AttendanceBulkIn,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "manage_attendance")
    lesson = db.query(LessonSession).filter_by(id=lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Dars topilmadi")
    if current_user.rol.value == "oqituvchi" and lesson.oqituvchi_id != current_user.id:
        raise HTTPException(403, "Bu dars sizga tegishli emas")
    for item in data.records:
        try:
            holat_enum = AttendanceEnum(item.holat)
        except ValueError:
            raise HTTPException(400, f"Noto'g'ri holat: {item.holat}")
        existing = db.query(Attendance).filter_by(dars_id=lesson_id, talaba_id=item.talaba_id).first()
        if existing:
            existing.holat = holat_enum
        else:
            db.add(Attendance(dars_id=lesson_id, talaba_id=item.talaba_id, holat=holat_enum))
    db.commit()
    return {"ok": True, "saqlanganlar": len(data.records)}

@router.get("/lessons/{lesson_id}/records")
def get_lesson_records(lesson_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "view_attendance")
    lesson = db.query(LessonSession).filter_by(id=lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Dars topilmadi")
    group_students = db.query(Student).filter_by(group_id=lesson.guruh_id).all()
    att_map = {a.talaba_id: a.holat.value for a in db.query(Attendance).filter_by(dars_id=lesson_id).all()}
    return [{
        "talaba_id": s.id,
        "ism": s.ism,
        "familiya": s.familiya,
        "holat": att_map.get(s.id, "kelmadi")
    } for s in group_students]

@router.get("/stats/student/{student_id}")
def student_attendance_stats(student_id: int, fan_id: Optional[int] = None,
                              db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "view_attendance")
    if current_user.rol.value == "talaba":
        if not current_user.student_id or current_user.student_id != student_id:
            raise HTTPException(403, "Faqat o'z ma'lumotlarini ko'rish mumkin")

    q = db.query(Attendance).join(LessonSession).filter(Attendance.talaba_id == student_id)
    if fan_id:
        q = q.filter(LessonSession.fan_id == fan_id)
    records = q.all()

    if not records:
        return {"talaba_id": student_id, "jami": 0, "keldi": 0, "foiz": 0.0, "fanlar": []}

    jami = len(records)
    keldi = sum(1 for r in records if r.holat.value in ("keldi", "kechikdi"))
    foiz = round(keldi / jami * 100, 1) if jami else 0

    # Fan bo'yicha
    fan_stats = {}
    for r in records:
        fid = r.lesson.fan_id
        fname = r.lesson.subject.nomi
        if fid not in fan_stats:
            fan_stats[fid] = {"fan_id": fid, "fan_nomi": fname, "jami": 0, "keldi": 0}
        fan_stats[fid]["jami"] += 1
        if r.holat.value in ("keldi", "kechikdi"):
            fan_stats[fid]["keldi"] += 1

    for v in fan_stats.values():
        v["foiz"] = round(v["keldi"] / v["jami"] * 100, 1) if v["jami"] else 0

    return {"talaba_id": student_id, "jami": jami, "keldi": keldi, "foiz": foiz,
            "fanlar": list(fan_stats.values())}

@router.get("/stats/group/{group_id}")
def group_attendance_stats(group_id: int, fan_id: Optional[int] = None,
                            db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "view_attendance")
    q = db.query(Attendance).join(LessonSession).filter(LessonSession.guruh_id == group_id)
    if fan_id:
        q = q.filter(LessonSession.fan_id == fan_id)
    records = q.all()
    jami = len(records)
    keldi = sum(1 for r in records if r.holat.value in ("keldi", "kechikdi"))
    foiz = round(keldi / jami * 100, 1) if jami else 0.0
    return {"group_id": group_id, "jami": jami, "keldi": keldi, "o_rtacha_foiz": foiz}

@router.get("/stats/overview")
def attendance_overview(db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    """Dashboard uchun umumiy davomat statistikasi"""
    _check_perm(current_user, "view_attendance")
    total = db.query(Attendance).count()
    if total == 0:
        return {"o_rtacha_foiz": 0.0, "jami_darslar": 0}
    keldi = db.query(Attendance).filter(
        Attendance.holat.in_([AttendanceEnum.keldi, AttendanceEnum.kechikdi])
    ).count()
    jami_darslar = db.query(LessonSession).count()
    return {
        "o_rtacha_foiz": round(keldi / total * 100, 1),
        "jami_darslar": jami_darslar,
        "jami_yozuvlar": total
    }
