# BMI Backend — FastAPI

## Ishga tushirish

```bash
cd backend

# Virtual muhit yaratish
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Kerakli paketlarni o'rnatish
pip install -r requirements.txt

# Bazani to'ldirish (demo ma'lumotlar)
python seed.py

# ML modelini o'qitish
python -m app.ml.train

# Serverni ishga tushirish
uvicorn app.main:app --reload
```

API hujjatlar: http://localhost:8000/docs

## Demo loginlar

| Login       | Parol       | Rol          |
|-------------|-------------|--------------|
| admin       | admin123    | Administrator |
| dekanat     | dekan123    | Dekanat      |
| oqituvchi   | teacher123  | O'qituvchi   |
| talaba      | student123  | Talaba       |

## Asosiy endpointlar

- `POST /auth/login` — JWT token olish
- `GET /auth/me` — foydalanuvchi + permissions + menyu
- `GET /analytics/overview` — KPI statistika
- `GET /analytics/trend` — semestr dinamikasi
- `GET /analytics/subjects` — fanlar tahlili
- `GET /analytics/groups` — guruhlar taqqoslashi
- `GET /analytics/distribution` — baho taqsimoti
- `GET /analytics/grade-histogram` — histogramma
- `GET /analytics/attendance-vs-grade` — scatter + korrelyatsiya
- `GET /analytics/group-subject-matrix` — heatmap
- `GET /analytics/semester-compare` — semestr taqqoslash
- `GET /analytics/gender-stats` — jins kesimida
- `GET /analytics/course-stats` — kurs kesimida
- `GET /analytics/top` — eng yuqori GPA
- `GET /analytics/bottom` — eng past o'zlashtiruvchilar
- `GET /prediction/at-risk` — xavf ostidagilar (ML)
- `POST /upload/grades` — CSV/Excel yuklash

## Loyiha tuzilmasi

```
backend/
├── app/
│   ├── main.py          # FastAPI app + routerlar
│   ├── config.py        # Konfiguratsiya
│   ├── database.py      # SQLAlchemy sessiya
│   ├── models.py        # ORM modellari
│   ├── schemas.py       # Pydantic sxemalari
│   ├── auth/
│   │   ├── router.py    # /auth/login, /auth/me
│   │   ├── utils.py     # JWT, hash, RBAC
│   │   └── dependencies.py  # get_current_user, require_permission
│   ├── routers/
│   │   ├── students.py  analytics.py  groups.py
│   │   ├── subjects.py  grades.py     users.py
│   │   ├── predictions.py             upload.py
│   └── ml/
│       └── train.py     # ML model o'qitish
├── seed.py              # Demo ma'lumotlar
└── requirements.txt
```