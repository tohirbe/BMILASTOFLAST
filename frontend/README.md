# BMI Frontend — React + Vite + Tailwind

## Ishga tushirish

```bash
cd frontend
npm install
npm run dev
```

Ilova: http://localhost:5173

## Texnologiyalar

- **React 18** — UI framework
- **Vite** — build tool
- **Tailwind CSS** — styling
- **React Router v6** — routing
- **Recharts** — grafiklar (Line, Area, Bar, Pie, Scatter, Radar, RadialBar)
- **Axios** — HTTP so'rovlar
- **Lucide React** — ikonalar

## Sahifalar

| Sahifa | Yo'l | Ruxsat |
|--------|------|--------|
| Dashboard | `/` | view_dashboard |
| Talabalar | `/students` | - |
| Talaba profili | `/students/:id` | - |
| Fanlar | `/subjects` | - |
| Guruhlar | `/groups` | - |
| Xavf tahlili | `/risk` | view_predictions |
| Hisobotlar | `/reports` | - |
| Ma'lumot yuklash | `/upload` | upload_data |
| Foydalanuvchilar | `/users` | manage_users |
| Sozlamalar | `/settings` | - |

## Komponentlar

- `AuthContext` — token, user, permissions holati
- `PrivateRoute` — ruxsatni tekshiradi
- `Sidebar` — dinamik menyu (/auth/me dan)
- `Header` — sarlavha va foydalanuvchi profili
- `Heatmap` — custom div-based heatmap
- `Loader/EmptyState/ErrorState` — UI holat komponentlar

## RBAC

Frontend ruxsatlarni `/auth/me` dan oladi. `usePermission(perm)` hook orqali sahifalar va tugmalar nazorat qilinadi. Sidebar menyu ham shunday dinamik.