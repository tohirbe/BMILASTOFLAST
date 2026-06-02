# CSV/Excel fayl yuklash endpointlari
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd, io
from app.database import get_db
from app.models import Grade, Student, Subject, User
from app.auth.dependencies import require_permission

router = APIRouter(prefix="/upload", tags=["Fayl yuklash"])
REQUIRED = {"student_id","subject_id","semestr","ball","davomat_foizi"}

@router.post("/grades")
async def upload_grades(file:UploadFile=File(...),cu:User=Depends(require_permission("upload_data")),db:Session=Depends(get_db)):
    if not file.filename.endswith((".csv",".xlsx",".xls")):
        raise HTTPException(400,"Faqat CSV yoki Excel fayl qabul qilinadi")
    content=await file.read()
    try:
        df=pd.read_csv(io.BytesIO(content)) if file.filename.endswith(".csv") else pd.read_excel(io.BytesIO(content))
    except Exception as e: raise HTTPException(400,f"Faylni oqishda xato: {e}")
    missing=REQUIRED-set(df.columns)
    if missing: raise HTTPException(400,f"Ustunlar yoq: {', '.join(missing)}")
    xatolar,qoshildi=[],0
    for idx,row in df.iterrows():
        try:
            if not db.query(Student).filter(Student.id==int(row["student_id"])).first():
                xatolar.append(f"Qator {idx+2}: student_id={row['student_id']} topilmadi"); continue
            if not db.query(Subject).filter(Subject.id==int(row["subject_id"])).first():
                xatolar.append(f"Qator {idx+2}: subject_id={row['subject_id']} topilmadi"); continue
            ball=float(row["ball"])
            if not 0<=ball<=100: xatolar.append(f"Qator {idx+2}: ball 0-100 orasida bolishi kerak"); continue
            db.add(Grade(student_id=int(row["student_id"]),subject_id=int(row["subject_id"]),semestr=int(row["semestr"]),ball=ball,davomat_foizi=float(row.get("davomat_foizi",85))))
            qoshildi+=1
        except Exception as e: xatolar.append(f"Qator {idx+2}: {e}")
    if qoshildi>0: db.commit()
    return {"qoshildi":qoshildi,"xato_soni":len(xatolar),"xatolar":xatolar[:20]}

@router.get("/template")
def get_template(cu:User=Depends(require_permission("upload_data"))):
    df=pd.DataFrame([{"student_id":1,"subject_id":1,"semestr":1,"ball":85.0,"davomat_foizi":92.0},{"student_id":2,"subject_id":1,"semestr":1,"ball":72.0,"davomat_foizi":88.0}])
    buf=io.BytesIO(); df.to_csv(buf,index=False); buf.seek(0)
    return StreamingResponse(buf,media_type="text/csv",headers={"Content-Disposition":"attachment; filename=shablon_baholar.csv"})
