# Analytics endpointlari - pandas bilan barcha grafik malumotlari
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
from app.database import get_db
from app.models import Grade, Student, Subject, Group, User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Tahlil"])

def _df(db, cu, gid=None, sem=None):
    q = db.query(Grade.id,Grade.student_id,Grade.subject_id,Grade.semestr,Grade.ball,Grade.davomat_foizi,Student.ism,Student.familiya,Student.kurs,Student.jinsi,Group.nomi.label("guruh"),Subject.nomi.label("fan")).join(Student,Grade.student_id==Student.id).join(Group,Student.group_id==Group.id).join(Subject,Grade.subject_id==Subject.id)
    if cu.rol.value=="talaba": q=q.filter(Grade.student_id==cu.student_id)
    elif cu.rol.value=="oqituvchi":
        sids=[ts.subject_id for ts in cu.teacher_subjects]; q=q.filter(Grade.subject_id.in_(sids))
    if gid: q=q.filter(Student.group_id==gid)
    if sem: q=q.filter(Grade.semestr==sem)
    rows=q.all()
    if not rows: return pd.DataFrame()
    return pd.DataFrame(rows,columns=["id","student_id","subject_id","semestr","ball","davomat_foizi","ism","familiya","kurs","jinsi","guruh","fan"])

@router.get("/overview")
def get_overview(group_id:Optional[int]=Query(None),semestr:Optional[int]=Query(None),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,group_id,semestr); total=db.query(Student).count()
    if df.empty: return {"jami_talaba":total,"ortacha_gpa":0,"ozlashtirish_foizi":0,"xavf_ostida":0,"ortacha_davomat":0,"eng_yaxshi_guruh":"-","eng_zaif_guruh":"-"}
    ga=df.groupby("guruh")["ball"].mean()
    return {"jami_talaba":total,"ortacha_gpa":round(df["ball"].mean(),1),"ozlashtirish_foizi":round((df["ball"]>=56).sum()/len(df)*100,1),"xavf_ostida":int((df["ball"]<56).sum()),"ortacha_davomat":round(df["davomat_foizi"].mean(),1),"eng_yaxshi_guruh":ga.idxmax() if not ga.empty else "-","eng_zaif_guruh":ga.idxmin() if not ga.empty else "-"}

@router.get("/trend")
def get_trend(group_id:Optional[int]=Query(None),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,group_id,None)
    if df.empty: return []
    t=df.groupby("semestr")["ball"].mean().reset_index()
    return [{"semestr":int(r.semestr),"ortacha_ball":round(r.ball,1)} for _,r in t.iterrows()]

@router.get("/subjects")
def get_subjects_analytics(group_id:Optional[int]=Query(None),semestr:Optional[int]=Query(None),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,group_id,semestr)
    if df.empty: return []
    agg=df.groupby("fan").agg(ortacha_ball=("ball","mean"),ozlashtirish=("ball",lambda x:round((x>=56).sum()/len(x)*100,1)),talabalar=("student_id","nunique")).reset_index()
    return [{"fan":r.fan,"ortacha_ball":round(r.ortacha_ball,1),"ozlashtirish":r.ozlashtirish,"talabalar":int(r.talabalar)} for _,r in agg.iterrows()]

@router.get("/groups")
def get_groups_analytics(semestr:Optional[int]=Query(None),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,None,semestr)
    if df.empty: return []
    agg=df.groupby("guruh").agg(ortacha_ball=("ball","mean"),ozlashtirish=("ball",lambda x:round((x>=56).sum()/len(x)*100,1)),ortacha_davomat=("davomat_foizi","mean")).reset_index()
    return [{"guruh":r.guruh,"ortacha_ball":round(r.ortacha_ball,1),"ozlashtirish":r.ozlashtirish,"ortacha_davomat":round(r.ortacha_davomat,1)} for _,r in agg.iterrows()]

@router.get("/distribution")
def get_distribution(group_id:Optional[int]=Query(None),semestr:Optional[int]=Query(None),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,group_id,semestr)
    if df.empty: return []
    def d(b):
        if b>=86: return "Alo (86-100)"
        elif b>=71: return "Yaxshi (71-85)"
        elif b>=56: return "Qoniqarli (56-70)"
        return "Qoniqarsiz (0-55)"
    df["daraja"]=df["ball"].apply(d); c=df["daraja"].value_counts().reset_index(); c.columns=["daraja","soni"]
    return c.to_dict("records")

@router.get("/grade-histogram")
def get_histogram(group_id:Optional[int]=Query(None),semestr:Optional[int]=Query(None),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,group_id,semestr)
    if df.empty: return []
    bins=list(range(0,101,10)); labels=[f"{i}-{i+9}" for i in bins[:-1]]
    df["interval"]=pd.cut(df["ball"],bins=bins,labels=labels,right=True,include_lowest=True)
    c=df["interval"].value_counts().sort_index().reset_index(); c.columns=["interval","soni"]
    return c.to_dict("records")

@router.get("/attendance-vs-grade")
def get_attendance_grade(group_id:Optional[int]=Query(None),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,group_id,None)
    if df.empty: return {"data":[],"korrelyatsiya":0}
    s=df.sample(min(200,len(df))) if len(df)>200 else df
    return {"data":[{"davomat":round(r.davomat_foizi,1),"ball":round(r.ball,1),"ism":f"{r.ism} {r.familiya}","guruh":r.guruh} for _,r in s.iterrows()],"korrelyatsiya":round(float(df["davomat_foizi"].corr(df["ball"])),3)}

@router.get("/group-subject-matrix")
def get_heatmap(cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,None,None)
    if df.empty: return {"guruhlar":[],"fanlar":[],"matrix":[]}
    pivot=df.pivot_table(values="ball",index="guruh",columns="fan",aggfunc="mean").round(1)
    return {"guruhlar":list(pivot.index),"fanlar":list(pivot.columns),"matrix":pivot.fillna(0).values.tolist()}

@router.get("/semester-compare")
def get_semester_compare(sem1:int=Query(1),sem2:int=Query(2),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,None,None)
    if df.empty: return []
    d1=df[df["semestr"]==sem1].groupby("fan")["ball"].mean().round(1)
    d2=df[df["semestr"]==sem2].groupby("fan")["ball"].mean().round(1)
    fanlar=list(set(d1.index)|set(d2.index))
    return [{"fan":f,f"sem_{sem1}":round(float(d1.get(f,0)),1),f"sem_{sem2}":round(float(d2.get(f,0)),1)} for f in fanlar]

@router.get("/gender-stats")
def get_gender_stats(cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,None,None)
    if df.empty: return []
    agg=df.groupby("jinsi").agg(ortacha_ball=("ball","mean"),ozlashtirish=("ball",lambda x:round((x>=56).sum()/len(x)*100,1))).reset_index()
    return [{"jinsi":r.jinsi,"ortacha_ball":round(r.ortacha_ball,1),"ozlashtirish":r.ozlashtirish} for _,r in agg.iterrows()]

@router.get("/course-stats")
def get_course_stats(cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,None,None)
    if df.empty: return []
    agg=df.groupby("kurs").agg(ortacha_ball=("ball","mean"),ozlashtirish=("ball",lambda x:round((x>=56).sum()/len(x)*100,1))).reset_index()
    return [{"kurs":int(r.kurs),"ortacha_ball":round(r.ortacha_ball,1),"ozlashtirish":r.ozlashtirish} for _,r in agg.iterrows()]

@router.get("/top")
def get_top(limit:int=Query(10),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,None,None)
    if df.empty: return []
    top=df.groupby(["student_id","ism","familiya","guruh"])["ball"].mean().round(1).reset_index()
    top=top.sort_values("ball",ascending=False).head(limit)
    return [{"student_id":int(r.student_id),"ism":r.ism,"familiya":r.familiya,"guruh":r.guruh,"gpa":r.ball} for _,r in top.iterrows()]

@router.get("/bottom")
def get_bottom(limit:int=Query(10),cu:User=Depends(get_current_user),db:Session=Depends(get_db)):
    df=_df(db,cu,None,None)
    if df.empty: return []
    bot=df.groupby(["student_id","ism","familiya","guruh"])["ball"].mean().round(1).reset_index()
    bot=bot.sort_values("ball").head(limit)
    return [{"student_id":int(r.student_id),"ism":r.ism,"familiya":r.familiya,"guruh":r.guruh,"gpa":r.ball} for _,r in bot.iterrows()]
