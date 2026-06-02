# ML bashorat endpointlari
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os, joblib, numpy as np
from app.database import get_db
from app.models import Grade, Student, User
from app.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/prediction", tags=["ML Bashorat"])
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../ml/model.pkl")

def load_model():
    try: return joblib.load(MODEL_PATH)
    except: return None

def get_feats(student_id, db):
    grades = db.query(Grade).filter(Grade.student_id==student_id).all()
    if not grades: return None
    balls=[g.ball for g in grades]; davomatlar=[g.davomat_foizi for g in grades]
    sem_avg={}
    for g in grades: sem_avg.setdefault(g.semestr,[]).append(g.ball)
    sm=[sum(sem_avg[s])/len(sem_avg[s]) for s in sorted(sem_avg.keys())]
    tend=sm[-1]-sm[-2] if len(sm)>=2 else 0
    return {"ortacha_ball":round(sum(balls)/len(balls),1),"davomat_foizi":round(sum(davomatlar)/len(davomatlar),1),"oldingi_sem_ball":round(sm[-2] if len(sm)>=2 else sm[-1],1),"tendensiya":round(tend,1)}

def calc_xavf(f, model):
    if model:
        X=np.array([[f["ortacha_ball"],f["davomat_foizi"],f["oldingi_sem_ball"],f["tendensiya"]]])
        try: return round(float(model.predict_proba(X)[0][1]),3)
        except: pass
    return round(max(0,min(1,(60-f["ortacha_ball"])/60)),3)

def sabab(f):
    r=[]
    if f["davomat_foizi"]<70: r.append("past davomat")
    if f["tendensiya"]<-5: r.append("pasayuvchi tendensiya")
    if f["ortacha_ball"]<60: r.append("past ortacha ball")
    return ", ".join(r) if r else "umumiy past korsatkich"

@router.get("/at-risk")
def get_at_risk(cu:User=Depends(require_permission("view_predictions")),db:Session=Depends(get_db)):
    model=load_model(); result=[]
    for student in db.query(Student).all():
        f=get_feats(student.id,db)
        if not f: continue
        xe=calc_xavf(f,model)
        if xe>0.3:
            daraja="yuqori" if xe>0.7 else "orta" if xe>0.5 else "past"
            rang="red" if xe>0.7 else "orange" if xe>0.5 else "yellow"
            result.append({"student_id":student.id,"ism":student.ism,"familiya":student.familiya,"guruh":student.group.nomi if student.group else "-","xavf_ehtimoli":xe,"daraja":daraja,"rang":rang,"sabab":sabab(f),"ortacha_ball":f["ortacha_ball"],"davomat_foizi":f["davomat_foizi"]})
    result.sort(key=lambda x:x["xavf_ehtimoli"],reverse=True)
    return result

@router.get("/student/{student_id}")
def get_student_prediction(student_id:int,cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    if cu.rol.value=="talaba" and cu.student_id!=student_id: raise HTTPException(403,"Ruxsat yoq")
    student=db.query(Student).filter(Student.id==student_id).first()
    if not student: raise HTTPException(404,"Talaba topilmadi")
    f=get_feats(student_id,db)
    if not f: return {"xavf_ehtimoli":0,"sabab":"Malumot yoq","tavsiyalar":["Baholar kiritilmagan"]}
    model=load_model(); xe=calc_xavf(f,model)
    tavsiyalar=[]
    if f["davomat_foizi"]<70: tavsiyalar.append(f"Davomatni oshirish zarur (hozir {f['davomat_foizi']:.0f}%)")
    if f["tendensiya"]<-5: tavsiyalar.append("Ball pasayish tendensiyasi - qoshimcha oqish tavsiya etiladi")
    if f["ortacha_ball"]<60: tavsiyalar.append("Ortacha ball juda past - oqituvchi bilan ishlash kerak")
    if not tavsiyalar: tavsiyalar.append("Hozircha barqaror - rivojlanishni davom ettiring")
    return {"student_id":student_id,"ism":f"{student.ism} {student.familiya}","xavf_ehtimoli":xe,"sabab":sabab(f),"tavsiyalar":tavsiyalar,"xususiyatlar":f}
