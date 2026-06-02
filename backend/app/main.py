from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.auth.router import router as auth_router
from app.routers.students import router as students_router
from app.routers.subjects import router as subjects_router
from app.routers.groups import router as groups_router
from app.routers.grades import router as grades_router
from app.routers.analytics import router as analytics_router
from app.routers.predictions import router as predictions_router
from app.routers.upload import router as upload_router
from app.routers.users import router as users_router
from app.routers.grade_windows import router as grade_windows_router
from app.routers.components import router as components_router
from app.routers.attendance import router as attendance_router
from app.routers.debts import router as debts_router
from app.routers.schedule import router as schedule_router
from app.routers.teacher_performance import router as teacher_perf_router
from app.auth.dependencies import get_current_user
from app.models import User, Subject, TeacherSubject

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BMI Talabalar O'zlashtirish Tizimi",
    description="Diplom loyihasi - talabalar ozlashtirish tahlili",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
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
app.include_router(grade_windows_router)
app.include_router(components_router)
app.include_router(attendance_router)
app.include_router(debts_router)
app.include_router(schedule_router)
app.include_router(teacher_perf_router)

@app.get("/me/assignments", tags=["Profil"])
def get_my_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.rol.value != "oqituvchi":
        return []
    result = []
    for ts in current_user.teacher_subjects:
        subj = db.query(Subject).filter(Subject.id == ts.subject_id).first()
        if subj:
            result.append({"subject_id": subj.id, "subject_nomi": subj.nomi, "semestr": subj.semestr})
    return result

@app.get("/")
def root():
    return {"message": "BMI Tizimi ishlamoqda v2.0", "docs": "/docs"}
