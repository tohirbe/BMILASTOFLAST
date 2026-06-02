# FastAPI asosiy ilova - barcha routerlar biriktiriladi
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
    description="Diplom loyihasi - talabalar ozlashtirish tahlili",
    version="1.0.0"
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

@app.get("/")
def root():
    return {"message": "BMI Tizimi ishlamoqda", "docs": "/docs"}
