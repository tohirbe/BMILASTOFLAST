# BMI — Talabalar O'zlashtirish Tahlil Tizimi

Diplom loyihasi: Talabalarning o'zlashtirish ko'rsatkichlarini grafik tahlil qiluvchi,
RBAC (rol asosida kirish nazorati) va ML bashoratni qo'llab-quvvatlovchi to'liq web platforma.

## Tezkor ishga tushirish

### Backend (Python FastAPI)
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python -m app.ml.train
uvicorn app.main:app --reload
```
API: http://localhost:8000 | Swagger: http://localhost:8000/docs

### Frontend (React + Vite)
```cmd
cd frontend
npm install
npm run dev
```
Ilova: http://localhost:5173

## Demo loginlar

| Login       | Parol       | Rol            | Ruxsatlar             |
|-------------|-------------|----------------|-----------------------|
| admin       | admin123    | Administrator  | To'liq huquq          |
| dekanat     | dekan123    | Dekanat        | Ko'rish + hisobot     |
| oqituvchi   | teacher123  | O'qituvchi     | O'z fanlari + baholar |
| talaba      | student123  | Talaba         | Faqat o'z profili     |

## Texnologiyalar

**Backend:** Python, FastAPI, SQLAlchemy, SQLite, JWT auth, pandas, scikit-learn  
**Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router v6, Axios

## Sahifalar

- Dashboard — KPI + 8+ grafik (area, bar, pie/donut, scatter, radar, histogram, heatmap)
- Talabalar — Qidiruv + filtr jadvali + profil
- Talaba profili — Semestr dinamikasi + Radar + ML xavf gauge
- Fanlar — Bar + Pie tahlil
- Guruhlar — Bar + Radar + Heatmap
- Xavf tahlili — ML bashorat, rangli indikatorlar
- Hisobotlar — Jins, kurs, semestr taqqoslash + CSV eksport
- Ma'lumot yuklash — CSV/Excel import + shablon
- Foydalanuvchilar — CRUD (faqat admin)
- Sozlamalar — Profil + parol o'zgartirish

## Loyiha tuzilmasi

```
BMI T/
├── backend/
│   ├── app/
│   │   ├── auth/        — JWT, RBAC, dependencies
│   │   ├── routers/     — students, subjects, groups, grades,
│   │   │                  analytics, predictions, upload, users
│   │   ├── ml/          — train.py (RandomForest)
│   │   ├── main.py, models.py, schemas.py, database.py, config.py
│   └── seed.py          — Demo ma'lumotlar
└── frontend/
    └── src/
        ├── contexts/    — AuthContext (RBAC)
        ├── components/  — Sidebar, Header, Heatmap, Loader
        ├── pages/       — 10+ sahifa
        ├── services/    — api.js (axios)
        └── hooks/       — usePermission
```