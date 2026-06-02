# Dars jadvali moduli
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.utils import ROLE_PERMISSIONS
from app.models import ScheduleSlot, User

router = APIRouter(prefix="/schedule", tags=["Dars jadvali"])

HAFTA_KUNLARI = {1: "Dushanba", 2: "Seshanba", 3: "Chorshanba",
                 4: "Payshanba", 5: "Juma", 6: "Shanba"}

def _check_perm(user: User, perm: str):
    if perm not in ROLE_PERMISSIONS.get(user.rol.value, []):
        raise HTTPException(403, "Ruxsat yo'q")

class SlotIn(BaseModel):
    guruh_id: int
    fan_id: int
    oqituvchi_id: int
    hafta_kuni: int
    juftlik: int
    xona: Optional[str] = None

def _slot_out(s: ScheduleSlot):
    return {
        "id": s.id,
        "guruh_id": s.guruh_id,
        "guruh_nomi": s.group.nomi,
        "fan_id": s.fan_id,
        "fan_nomi": s.subject.nomi,
        "oqituvchi_id": s.oqituvchi_id,
        "oqituvchi_ism": f"{s.teacher.familiya} {s.teacher.ism}",
        "hafta_kuni": s.hafta_kuni,
        "hafta_kuni_nomi": HAFTA_KUNLARI.get(s.hafta_kuni, ""),
        "juftlik": s.juftlik,
        "xona": s.xona
    }

@router.get("")
def list_slots(guruh_id: Optional[int] = None, oqituvchi_id: Optional[int] = None,
               db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "view_schedule")
    q = db.query(ScheduleSlot)
    if current_user.rol.value == "talaba" and current_user.student_id:
        from app.models import Student
        st = db.query(Student).filter_by(id=current_user.student_id).first()
        if st:
            q = q.filter(ScheduleSlot.guruh_id == st.group_id)
    elif current_user.rol.value == "oqituvchi":
        q = q.filter(ScheduleSlot.oqituvchi_id == current_user.id)
    else:
        if guruh_id:
            q = q.filter(ScheduleSlot.guruh_id == guruh_id)
        if oqituvchi_id:
            q = q.filter(ScheduleSlot.oqituvchi_id == oqituvchi_id)
    slots = q.order_by(ScheduleSlot.hafta_kuni, ScheduleSlot.juftlik).all()
    return [_slot_out(s) for s in slots]

@router.post("")
def create_slot(data: SlotIn, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "manage_schedule")
    if data.hafta_kuni < 1 or data.hafta_kuni > 6:
        raise HTTPException(400, "Hafta kuni 1–6 oralig'ida bo'lishi kerak")
    if data.juftlik < 1 or data.juftlik > 7:
        raise HTTPException(400, "Juftlik 1–7 oralig'ida bo'lishi kerak")
    existing = db.query(ScheduleSlot).filter_by(
        guruh_id=data.guruh_id, hafta_kuni=data.hafta_kuni, juftlik=data.juftlik
    ).first()
    if existing:
        raise HTTPException(400, "Bu vaqtda guruh uchun jadval mavjud")
    slot = ScheduleSlot(**data.dict())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return _slot_out(slot)

@router.put("/{slot_id}")
def update_slot(slot_id: int, data: SlotIn, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "manage_schedule")
    slot = db.query(ScheduleSlot).filter_by(id=slot_id).first()
    if not slot:
        raise HTTPException(404, "Jadval topilmadi")
    conflict = db.query(ScheduleSlot).filter(
        ScheduleSlot.guruh_id == data.guruh_id,
        ScheduleSlot.hafta_kuni == data.hafta_kuni,
        ScheduleSlot.juftlik == data.juftlik,
        ScheduleSlot.id != slot_id
    ).first()
    if conflict:
        raise HTTPException(400, "Bu vaqtda guruh uchun jadval mavjud")
    for k, v in data.dict().items():
        setattr(slot, k, v)
    db.commit()
    return _slot_out(slot)

@router.delete("/{slot_id}")
def delete_slot(slot_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    _check_perm(current_user, "manage_schedule")
    slot = db.query(ScheduleSlot).filter_by(id=slot_id).first()
    if not slot:
        raise HTTPException(404, "Jadval topilmadi")
    db.delete(slot)
    db.commit()
    return {"ok": True}
