# Baholash oynalarini boshqarish endpointlari
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import GradeWindow, Group, Subject, User, TeacherSubject
from app.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/grade-windows", tags=["Baholash oynalari"])

def _get_or_create_window(db: Session, guruh_id: int, fan_id: int, semestr: int) -> GradeWindow:
    """Oyna mavjud bo'lmasa yangi (ochiq) oyna yaratadi"""
    win = db.query(GradeWindow).filter(
        GradeWindow.guruh_id == guruh_id,
        GradeWindow.fan_id == fan_id,
        GradeWindow.semestr == semestr
    ).first()
    if not win:
        win = GradeWindow(guruh_id=guruh_id, fan_id=fan_id, semestr=semestr, holati="ochiq")
        db.add(win); db.commit(); db.refresh(win)
    return win

def _format_window(win: GradeWindow, db: Session) -> dict:
    group = db.query(Group).filter(Group.id == win.guruh_id).first()
    subject = db.query(Subject).filter(Subject.id == win.fan_id).first()
    changed_by = db.query(User).filter(User.id == win.o_zgartirgan_user_id).first() if win.o_zgartirgan_user_id else None
    return {
        "id": win.id,
        "guruh_id": win.guruh_id,
        "guruh": group.nomi if group else "-",
        "fan_id": win.fan_id,
        "fan": subject.nomi if subject else "-",
        "semestr": win.semestr,
        "holati": win.holati,
        "o_zgartirgan": f"{changed_by.ism} {changed_by.familiya}" if changed_by else None,
        "yangilangan_sana": win.yangilangan_sana.isoformat() if win.yangilangan_sana else None
    }

@router.get("")
def get_windows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Barcha baholash oynalari — dekanat/admin barchasini, o'qituvchi faqat o'zinikini ko'radi"""
    query = db.query(GradeWindow)

    if current_user.rol.value == "oqituvchi":
        # Faqat o'ziga biriktirilgan fan IDlari
        my_fan_ids = [ts.subject_id for ts in current_user.teacher_subjects]
        if not my_fan_ids:
            return []
        query = query.filter(GradeWindow.fan_id.in_(my_fan_ids))
    elif current_user.rol.value not in ("admin", "dekanat"):
        raise HTTPException(403, "Ruxsat yo'q")

    windows = query.order_by(GradeWindow.guruh_id, GradeWindow.fan_id, GradeWindow.semestr).all()

    # Mavjud oynalarni ro'yxat qilamiz; kerakli kombinatsiyalar uchun avtomatik ochiq yaratamiz
    result = [_format_window(w, db) for w in windows]
    return result

@router.get("/check")
def check_window(
    guruh_id: int,
    fan_id: int,
    semestr: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Berilgan guruh+fan+semestr oynasining holatini tekshiradi"""
    win = db.query(GradeWindow).filter(
        GradeWindow.guruh_id == guruh_id,
        GradeWindow.fan_id == fan_id,
        GradeWindow.semestr == semestr
    ).first()
    if not win:
        return {"holati": "ochiq", "mavjud": False}
    return {"holati": win.holati, "mavjud": True, "id": win.id}

@router.post("/{window_id}/lock")
def lock_window(
    window_id: int,
    current_user: User = Depends(require_permission("manage_grade_windows")),
    db: Session = Depends(get_db)
):
    """Baholash oynasini yopish — o'qituvchi baho o'zgartira olmaydi"""
    win = db.query(GradeWindow).filter(GradeWindow.id == window_id).first()
    if not win:
        raise HTTPException(404, "Oyna topilmadi")
    if win.holati == "yopiq":
        raise HTTPException(400, "Oyna allaqachon yopiq")
    win.holati = "yopiq"
    win.o_zgartirgan_user_id = current_user.id
    win.yangilangan_sana = datetime.utcnow()
    db.commit()
    return {"xabar": "Baholash oynasi yopildi", "holati": "yopiq"}

@router.post("/{window_id}/unlock")
def unlock_window(
    window_id: int,
    current_user: User = Depends(require_permission("manage_grade_windows")),
    db: Session = Depends(get_db)
):
    """Baholash oynasini ochish — o'qituvchi yana baho o'zgartira oladi"""
    win = db.query(GradeWindow).filter(GradeWindow.id == window_id).first()
    if not win:
        raise HTTPException(404, "Oyna topilmadi")
    if win.holati == "ochiq":
        raise HTTPException(400, "Oyna allaqachon ochiq")
    win.holati = "ochiq"
    win.o_zgartirgan_user_id = current_user.id
    win.yangilangan_sana = datetime.utcnow()
    db.commit()
    return {"xabar": "Baholash oynasi ochildi", "holati": "ochiq"}

@router.post("/ensure")
def ensure_window(
    guruh_id: int,
    fan_id: int,
    semestr: int,
    current_user: User = Depends(require_permission("manage_grade_windows")),
    db: Session = Depends(get_db)
):
    """Oyna mavjud bo'lmasa yaratadi (ochiq holda)"""
    win = _get_or_create_window(db, guruh_id, fan_id, semestr)
    return _format_window(win, db)

@router.get("/me/assignments")
def get_my_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """O'qituvchining biriktirilgan fan va guruhlari"""
    if current_user.rol.value != "oqituvchi":
        raise HTTPException(403, "Faqat o'qituvchilar uchun")
    assignments = []
    for ts in current_user.teacher_subjects:
        subj = db.query(Subject).filter(Subject.id == ts.subject_id).first()
        if subj:
            assignments.append({"subject_id": subj.id, "subject_nomi": subj.nomi, "semestr": subj.semestr})
    return assignments
