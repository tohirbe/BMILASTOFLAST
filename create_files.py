"""
Bu skript barcha qolgan backend va frontend fayllarini yaratadi.
Ishga tushirish: python create_files.py (loyiha root papkasidan)
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(BASE, "backend")
FRONTEND = os.path.join(BASE, "frontend")

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  OK: {os.path.relpath(path, BASE)}")

# =========================================================
# BACKEND - main.py
# =========================================================
write(os.path.join(BACKEND, "app", "main.py"), """
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.auth.router import router as auth_router
from app.routers.students import router as students_router
from app.routers.subjects import router as subjects_router
from app.routers.groups import router as groups_router
from app.routers.grades import router as grades_router
from app.routers.analytics import router as analytics_router
from app.routers.predictions import router as predictions_router
from app.routers.upload import router as upload_router
from app.routers.users import router as users_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BMI Talabalar O'zlashtirish Tizimi",
    description="Diplom loyihasi — talabalar o'zlashtirish tahlili",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(students_router)
app.include_router(subjects_router)
app.include_router(groups_router)
app.include_router(grades_router)
app.include_router(analytics_router)
app.include_router(predictions_router)
app.include_router(upload_router)
app.include_router(users_router)

@app.get("/")
def root():
    return {"message": "BMI Tizimi ishlamoqda", "docs": "/docs"}
""".strip())

# =========================================================
# BACKEND - analytics.py
# =========================================================
write(os.path.join(BACKEND, "app", "routers", "analytics.py"), """
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
from app.database import get_db
from app.models import Grade, Student, Subject, Group, User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Tahlil"])

def _df(db, cu, gid=None, sem=None):
    q = db.query(
        Grade.id, Grade.student_id, Grade.subject_id, Grade.semestr,
        Grade.ball, Grade.davomat_foizi, Student.ism, Student.familiya,
        Student.kurs, Student.jinsi,
        Group.nomi.label("guruh"), Subject.nomi.label("fan")
    ).join(Student, Grade.student_id==Student.id
    ).join(Group, Student.group_id==Group.id
    ).join(Subject, Grade.subject_id==Subject.id)
    if cu.rol.value == "talaba":
        q = q.filter(Grade.student_id == cu.student_id)
    elif cu.rol.value == "oqituvchi":
        sids = [ts.subject_id for ts in cu.teacher_subjects]
        q = q.filter(Grade.subject_id.in_(sids))
    if gid: q = q.filter(Student.group_id == gid)
    if sem: q = q.filter(Grade.semestr == sem)
    rows = q.all()
    if not rows: return pd.DataFrame()
    return pd.DataFrame(rows, columns=["id","student_id","subject_id","semestr","ball",
        "davomat_foizi","ism","familiya","kurs","jinsi","guruh","fan"])

@router.get("/overview")
def get_overview(group_id: Optional[int]=Query(None), semestr: Optional[int]=Query(None),
    cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, group_id, semestr)
    total = db.query(Student).count()
    if df.empty:
        return {"jami_talaba":total,"ortacha_gpa":0,"ozlashtirish_foizi":0,
                "xavf_ostida":0,"ortacha_davomat":0,"eng_yaxshi_guruh":"-","eng_zaif_guruh":"-"}
    ga = df.groupby("guruh")["ball"].mean()
    return {"jami_talaba":total,"ortacha_gpa":round(df["ball"].mean(),1),
            "ozlashtirish_foizi":round((df["ball"]>=56).sum()/len(df)*100,1),
            "xavf_ostida":int((df["ball"]<56).sum()),
            "ortacha_davomat":round(df["davomat_foizi"].mean(),1),
            "eng_yaxshi_guruh":ga.idxmax() if not ga.empty else "-",
            "eng_zaif_guruh":ga.idxmin() if not ga.empty else "-"}

@router.get("/trend")
def get_trend(group_id: Optional[int]=Query(None), cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, group_id, None)
    if df.empty: return []
    t = df.groupby("semestr")["ball"].mean().reset_index()
    return [{"semestr":int(r.semestr),"ortacha_ball":round(r.ball,1)} for _,r in t.iterrows()]

@router.get("/subjects")
def get_subjects_analytics(group_id: Optional[int]=Query(None), semestr: Optional[int]=Query(None),
    cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, group_id, semestr)
    if df.empty: return []
    agg = df.groupby("fan").agg(
        ortacha_ball=("ball","mean"),
        ozlashtirish=("ball", lambda x: round((x>=56).sum()/len(x)*100,1)),
        talabalar=("student_id","nunique")
    ).reset_index()
    return [{"fan":r.fan,"ortacha_ball":round(r.ortacha_ball,1),
             "ozlashtirish":r.ozlashtirish,"talabalar":int(r.talabalar)}
            for _,r in agg.iterrows()]

@router.get("/groups")
def get_groups_analytics(semestr: Optional[int]=Query(None), cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, None, semestr)
    if df.empty: return []
    agg = df.groupby("guruh").agg(
        ortacha_ball=("ball","mean"),
        ozlashtirish=("ball", lambda x: round((x>=56).sum()/len(x)*100,1)),
        ortacha_davomat=("davomat_foizi","mean")
    ).reset_index()
    return [{"guruh":r.guruh,"ortacha_ball":round(r.ortacha_ball,1),
             "ozlashtirish":r.ozlashtirish,"ortacha_davomat":round(r.ortacha_davomat,1)}
            for _,r in agg.iterrows()]

@router.get("/distribution")
def get_distribution(group_id: Optional[int]=Query(None), semestr: Optional[int]=Query(None),
    cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, group_id, semestr)
    if df.empty: return []
    def d(b):
        if b>=86: return "Alo (86-100)"
        elif b>=71: return "Yaxshi (71-85)"
        elif b>=56: return "Qoniqarli (56-70)"
        return "Qoniqarsiz (0-55)"
    df["daraja"] = df["ball"].apply(d)
    c = df["daraja"].value_counts().reset_index()
    c.columns = ["daraja","soni"]
    return c.to_dict("records")

@router.get("/grade-histogram")
def get_histogram(group_id: Optional[int]=Query(None), semestr: Optional[int]=Query(None),
    cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, group_id, semestr)
    if df.empty: return []
    bins = list(range(0,101,10))
    labels = [f"{i}-{i+9}" for i in bins[:-1]]
    df["interval"] = pd.cut(df["ball"], bins=bins, labels=labels, right=True, include_lowest=True)
    c = df["interval"].value_counts().sort_index().reset_index()
    c.columns = ["interval","soni"]
    return c.to_dict("records")

@router.get("/attendance-vs-grade")
def get_attendance_grade(group_id: Optional[int]=Query(None), cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, group_id, None)
    if df.empty: return {"data":[],"korrelyatsiya":0}
    s = df.sample(min(200,len(df))) if len(df)>200 else df
    kr = round(float(df["davomat_foizi"].corr(df["ball"])),3)
    return {"data":[{"davomat":round(r.davomat_foizi,1),"ball":round(r.ball,1),
                     "ism":f"{r.ism} {r.familiya}","guruh":r.guruh}
                    for _,r in s.iterrows()], "korrelyatsiya": kr}

@router.get("/group-subject-matrix")
def get_heatmap(cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, None, None)
    if df.empty: return {"guruhlar":[],"fanlar":[],"matrix":[]}
    pivot = df.pivot_table(values="ball",index="guruh",columns="fan",aggfunc="mean").round(1)
    return {"guruhlar":list(pivot.index),"fanlar":list(pivot.columns),
            "matrix":pivot.fillna(0).values.tolist()}

@router.get("/semester-compare")
def get_semester_compare(sem1: int=Query(1), sem2: int=Query(2),
    cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, None, None)
    if df.empty: return []
    d1 = df[df["semestr"]==sem1].groupby("fan")["ball"].mean().round(1)
    d2 = df[df["semestr"]==sem2].groupby("fan")["ball"].mean().round(1)
    fanlar = list(set(d1.index)|set(d2.index))
    return [{"fan":f, f"sem_{sem1}":round(float(d1.get(f,0)),1),
              f"sem_{sem2}":round(float(d2.get(f,0)),1)} for f in fanlar]

@router.get("/gender-stats")
def get_gender_stats(cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, None, None)
    if df.empty: return []
    agg = df.groupby("jinsi").agg(
        ortacha_ball=("ball","mean"),
        ozlashtirish=("ball", lambda x: round((x>=56).sum()/len(x)*100,1))
    ).reset_index()
    return [{"jinsi":r.jinsi,"ortacha_ball":round(r.ortacha_ball,1),
              "ozlashtirish":r.ozlashtirish} for _,r in agg.iterrows()]

@router.get("/course-stats")
def get_course_stats(cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, None, None)
    if df.empty: return []
    agg = df.groupby("kurs").agg(
        ortacha_ball=("ball","mean"),
        ozlashtirish=("ball", lambda x: round((x>=56).sum()/len(x)*100,1))
    ).reset_index()
    return [{"kurs":int(r.kurs),"ortacha_ball":round(r.ortacha_ball,1),
              "ozlashtirish":r.ozlashtirish} for _,r in agg.iterrows()]

@router.get("/top")
def get_top(limit: int=Query(10), cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, None, None)
    if df.empty: return []
    top = df.groupby(["student_id","ism","familiya","guruh"])["ball"].mean().round(1).reset_index()
    top = top.sort_values("ball",ascending=False).head(limit)
    return [{"student_id":int(r.student_id),"ism":r.ism,"familiya":r.familiya,
              "guruh":r.guruh,"gpa":r.ball} for _,r in top.iterrows()]

@router.get("/bottom")
def get_bottom(limit: int=Query(10), cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    df = _df(db, cu, None, None)
    if df.empty: return []
    bot = df.groupby(["student_id","ism","familiya","guruh"])["ball"].mean().round(1).reset_index()
    bot = bot.sort_values("ball").head(limit)
    return [{"student_id":int(r.student_id),"ism":r.ism,"familiya":r.familiya,
              "guruh":r.guruh,"gpa":r.ball} for _,r in bot.iterrows()]
""".strip())

# =========================================================
# BACKEND - predictions.py
# =========================================================
write(os.path.join(BACKEND, "app", "routers", "predictions.py"), """
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

def feats(student_id, db):
    grades = db.query(Grade).filter(Grade.student_id==student_id).all()
    if not grades: return None
    balls = [g.ball for g in grades]
    davomatlar = [g.davomat_foizi for g in grades]
    sem_avg = {}
    for g in grades:
        sem_avg.setdefault(g.semestr,[]).append(g.ball)
    sm = [sum(sem_avg[s])/len(sem_avg[s]) for s in sorted(sem_avg.keys())]
    tend = sm[-1]-sm[-2] if len(sm)>=2 else 0
    return {"ortacha_ball":round(sum(balls)/len(balls),1),"davomat_foizi":round(sum(davomatlar)/len(davomatlar),1),"oldingi_sem_ball":round(sm[-2] if len(sm)>=2 else sm[-1],1),"tendensiya":round(tend,1)}

def sabab(f):
    r=[]
    if f["davomat_foizi"]<70: r.append("past davomat")
    if f["tendensiya"]<-5: r.append("pasayuvchi tendensiya")
    if f["ortacha_ball"]<60: r.append("past ortacha ball")
    return ", ".join(r) if r else "umumiy past korsatkich"

def xavf(f, model):
    if model:
        X=np.array([[f["ortacha_ball"],f["davomat_foizi"],f["oldingi_sem_ball"],f["tendensiya"]]])
        try: return round(float(model.predict_proba(X)[0][1]),3)
        except: pass
    return round(max(0,min(1,(60-f["ortacha_ball"])/60)),3)

@router.get("/at-risk")
def get_at_risk(cu: User=Depends(require_permission("view_predictions")), db: Session=Depends(get_db)):
    model = load_model()
    result = []
    for student in db.query(Student).all():
        f = feats(student.id, db)
        if not f: continue
        xe = xavf(f, model)
        if xe > 0.3:
            daraja = "yuqori" if xe>0.7 else "orta" if xe>0.5 else "past"
            rang = "red" if xe>0.7 else "orange" if xe>0.5 else "yellow"
            result.append({"student_id":student.id,"ism":student.ism,"familiya":student.familiya,
                "guruh":student.group.nomi if student.group else "-","xavf_ehtimoli":xe,
                "daraja":daraja,"rang":rang,"sabab":sabab(f),
                "ortacha_ball":f["ortacha_ball"],"davomat_foizi":f["davomat_foizi"]})
    result.sort(key=lambda x:x["xavf_ehtimoli"],reverse=True)
    return result

@router.get("/student/{student_id}")
def get_student_prediction(student_id: int, cu: User=Depends(get_current_user), db: Session=Depends(get_db)):
    if cu.rol.value=="talaba" and cu.student_id!=student_id:
        raise HTTPException(403,"Ruxsat yoq")
    student = db.query(Student).filter(Student.id==student_id).first()
    if not student: raise HTTPException(404,"Talaba topilmadi")
    f = feats(student_id, db)
    if not f: return {"xavf_ehtimoli":0,"sabab":"Malumot yoq","tavsiyalar":["Baholar kiritilmagan"]}
    model = load_model()
    xe = xavf(f, model)
    tavsiyalar=[]
    if f["davomat_foizi"]<70: tavsiyalar.append(f"Davomatni oshirish zarur (hozir {f['davomat_foizi']:.0f}%)")
    if f["tendensiya"]<-5: tavsiyalar.append("Ball pasayish tendensiyasi - qoshimcha oqish tavsiya etiladi")
    if f["ortacha_ball"]<60: tavsiyalar.append("Ortacha ball juda past - oqituvchi bilan ishlash kerak")
    if not tavsiyalar: tavsiyalar.append("Hozircha barqaror - rivojlanishni davom ettiring")
    return {"student_id":student_id,"ism":f"{student.ism} {student.familiya}",
            "xavf_ehtimoli":xe,"sabab":sabab(f),"tavsiyalar":tavsiyalar,"xususiyatlar":f}
""".strip())

# =========================================================
# BACKEND - upload.py
# =========================================================
write(os.path.join(BACKEND, "app", "routers", "upload.py"), """
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
async def upload_grades(file: UploadFile=File(...), cu: User=Depends(require_permission("upload_data")), db: Session=Depends(get_db)):
    if not file.filename.endswith((".csv",".xlsx",".xls")):
        raise HTTPException(400,"Faqat CSV yoki Excel fayl qabul qilinadi")
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content)) if file.filename.endswith(".csv") else pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400,f"Faylni oqishda xato: {e}")
    missing = REQUIRED - set(df.columns)
    if missing: raise HTTPException(400,f"Ustunlar yoq: {', '.join(missing)}")
    xatolar,qoshildi = [],0
    for idx,row in df.iterrows():
        try:
            if not db.query(Student).filter(Student.id==int(row["student_id"])).first():
                xatolar.append(f"Qator {idx+2}: student_id={row['student_id']} topilmadi"); continue
            if not db.query(Subject).filter(Subject.id==int(row["subject_id"])).first():
                xatolar.append(f"Qator {idx+2}: subject_id={row['subject_id']} topilmadi"); continue
            ball = float(row["ball"])
            if not 0<=ball<=100: xatolar.append(f"Qator {idx+2}: ball 0-100 orasida bolishi kerak"); continue
            db.add(Grade(student_id=int(row["student_id"]),subject_id=int(row["subject_id"]),semestr=int(row["semestr"]),ball=ball,davomat_foizi=float(row.get("davomat_foizi",85))))
            qoshildi+=1
        except Exception as e: xatolar.append(f"Qator {idx+2}: {e}")
    if qoshildi>0: db.commit()
    return {"qoshildi":qoshildi,"xato_soni":len(xatolar),"xatolar":xatolar[:20]}

@router.get("/template")
def get_template(cu: User=Depends(require_permission("upload_data"))):
    df = pd.DataFrame([{"student_id":1,"subject_id":1,"semestr":1,"ball":85.0,"davomat_foizi":92.0},{"student_id":2,"subject_id":1,"semestr":1,"ball":72.0,"davomat_foizi":88.0}])
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv", headers={"Content-Disposition":"attachment; filename=shablon_baholar.csv"})
""".strip())

# =========================================================
# BACKEND - ml/train.py
# =========================================================
write(os.path.join(BACKEND, "app", "ml", "train.py"), """
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from app.database import SessionLocal
from app.models import Grade, Student

def build_dataset(db):
    X_list, y_list = [], []
    for student in db.query(Student).all():
        grades = db.query(Grade).filter(Grade.student_id==student.id).all()
        if len(grades)<2: continue
        balls=[g.ball for g in grades]; davomatlar=[g.davomat_foizi for g in grades]
        sem_avg={}
        for g in grades: sem_avg.setdefault(g.semestr,[]).append(g.ball)
        sm=[sum(sem_avg[s])/len(sem_avg[s]) for s in sorted(sem_avg.keys())]
        tend=sm[-1]-sm[-2] if len(sm)>=2 else 0
        ortacha=sum(balls)/len(balls)
        X_list.append([ortacha,sum(davomatlar)/len(davomatlar),sm[-2] if len(sm)>=2 else sm[-1],tend])
        y_list.append(1 if ortacha<56 else 0)
    return np.array(X_list), np.array(y_list)

def train():
    db = SessionLocal()
    print("Malumotlar tayyorlanmoqda...")
    X, y = build_dataset(db)
    db.close()
    if len(X)<10:
        print("Yetarli malumot yoq. Avval seed.py ni ishga tushiring.")
        return
    print(f"Jami: {len(X)}, Xavf ostidagilar: {y.sum()}")
    strat = y if y.sum()>1 else None
    X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2,random_state=42,stratify=strat)
    model = RandomForestClassifier(n_estimators=100,max_depth=5,random_state=42)
    model.fit(X_train,y_train)
    y_pred = model.predict(X_test)
    print("\\n=== Model natijalari ===")
    print(f"Accuracy:  {accuracy_score(y_test,y_pred):.3f}")
    print(f"Precision: {precision_score(y_test,y_pred,zero_division=0):.3f}")
    print(f"Recall:    {recall_score(y_test,y_pred,zero_division=0):.3f}")
    print(f"F1-score:  {f1_score(y_test,y_pred,zero_division=0):.3f}")
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    joblib.dump(model, model_path)
    print(f"\\nModel saqlandi: {model_path}")

if __name__ == "__main__":
    train()
""".strip())

# =========================================================
# BACKEND - seed.py
# =========================================================
write(os.path.join(BACKEND, "seed.py"), """
import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))
from app.database import SessionLocal, Base, engine
from app.models import Group, Subject, Student, Grade, User, TeacherSubject, GenderEnum, RoleEnum
from app.auth.utils import hash_password

random.seed(42)

ERKAK = ["Sardor","Jasur","Bobur","Sherzod","Ulugbek","Nodir","Dilshod","Sanjar","Eldor","Firdavs","Ravshan","Otabek","Mirzo","Doniyor","Kamol"]
AYOL = ["Nodira","Malika","Zilola","Feruza","Hulkar","Sabohat","Dilorom","Mohira","Gulnora","Shahnoza","Barno","Maftuna","Zulfiya","Nasiba","Yulduz"]
FAMILIYA = ["Aliyev","Karimov","Rahimov","Umarov","Xasanov","Toshmatov","Yusupov","Mirzayev","Qodirov","Nazarov","Ergashev","Abdullayev","Razzaqov","Holiqov","Xolmatov","Normatov","Sotvoldiyev","Baxtiyorov","Ismoilov","Azimov"]

GURUHLAR = [("KI-21-01",3,"Kompyuter injiniringi"),("KI-21-02",3,"Kompyuter injiniringi"),("DT-22-01",2,"Dasturiy taminot"),("DT-22-02",2,"Dasturiy taminot"),("AT-23-01",1,"Axborot texnologiyalari"),("AT-23-02",1,"Axborot texnologiyalari"),("IS-20-01",4,"Intellektual tizimlar"),("IS-20-02",4,"Intellektual tizimlar")]
FANLAR = [("Dasturlash asoslari",4,1),("Matematik analiz",5,1),("Fizika",4,2),("Malumotlar bazasi",4,3),("Veb-texnologiyalar",3,4),("Operatsion tizimlar",3,3),("Algoritmlar va malumotlar strukturasi",4,4),("Ingliz tili",2,1),("Falsafa",2,2),("Kompyuter grafikasi",3,5)]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    for model in [TeacherSubject,Grade,User,Student,Subject,Group]:
        db.query(model).delete()
    db.commit()
    print("Baza tozalandi.")

    groups = []
    for nomi,kurs,yonalish in GURUHLAR:
        g = Group(nomi=nomi,kurs=kurs,yonalish=yonalish); db.add(g); groups.append(g)
    db.commit(); print(f"{len(groups)} ta guruh.")

    subjects = []
    for nomi,kredit,sem in FANLAR:
        s = Subject(nomi=nomi,kredit=kredit,semestr=sem); db.add(s); subjects.append(s)
    db.commit(); print(f"{len(subjects)} ta fan.")

    students = []
    for group in groups:
        for _ in range(random.randint(15,20)):
            jinsi = random.choice([GenderEnum.erkak,GenderEnum.ayol])
            ism = random.choice(ERKAK if jinsi==GenderEnum.erkak else AYOL)
            s = Student(ism=ism,familiya=random.choice(FAMILIYA),group_id=group.id,kurs=group.kurs,jinsi=jinsi,qabul_yili=2024-group.kurs+1)
            db.add(s); students.append(s)
    db.commit(); print(f"{len(students)} ta talaba.")

    grades_n = 0
    for student in students:
        qobiliyat = random.gauss(72,15)
        max_sem = min(student.kurs*2,8)
        semlar = list(range(1,max_sem+1))
        for fan in random.sample(subjects,min(len(subjects),random.randint(4,8))):
            sem = random.choice(semlar)
            ball = max(20,min(100,qobiliyat+random.gauss(0,8)))
            davomat = min(100,max(40,ball*0.9+random.gauss(10,10)))
            db.add(Grade(student_id=student.id,subject_id=fan.id,semestr=sem,ball=round(ball,1),davomat_foizi=round(davomat,1)))
            grades_n+=1
    db.commit(); print(f"{grades_n} ta baho.")

    admin = User(login="admin",parol_hash=hash_password("admin123"),ism="Admin",familiya="Tizim",rol=RoleEnum.admin)
    dekanat = User(login="dekanat",parol_hash=hash_password("dekan123"),ism="Sarvar",familiya="Rahmatullayev",rol=RoleEnum.dekanat)
    teacher = User(login="oqituvchi",parol_hash=hash_password("teacher123"),ism="Anvar",familiya="Xolmatov",rol=RoleEnum.oqituvchi)
    db.add_all([admin,dekanat,teacher]); db.commit()

    for subj in random.sample(subjects,3):
        db.add(TeacherSubject(teacher_id=teacher.id,subject_id=subj.id))

    s_ref = students[0]
    db.add(User(login="talaba",parol_hash=hash_password("student123"),ism=s_ref.ism,familiya=s_ref.familiya,rol=RoleEnum.talaba,student_id=s_ref.id))
    db.commit()

    print("\\nDemo loginlar:")
    print("  admin / admin123 | dekanat / dekan123 | oqituvchi / teacher123 | talaba / student123")
    print("Seed tugadi!")

if __name__ == "__main__":
    seed()
""".strip())

# =========================================================
# FRONTEND - pages
# =========================================================
pages_dir = os.path.join(FRONTEND, "src", "pages")

print("\nBarcha fayllar muvaffaqiyatli yaratildi!")
print(f"\nKeyingi qadamlar:")
print(f"  Backend: cd backend && pip install -r requirements.txt && python seed.py && uvicorn app.main:app --reload")
print(f"  Frontend: cd frontend && npm install && npm run dev")