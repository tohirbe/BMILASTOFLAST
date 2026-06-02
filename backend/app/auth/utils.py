# JWT token yaratish va tekshirish, parol hash, RBAC permissions
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROLE_PERMISSIONS = {
    "admin": [
        "view_dashboard","manage_users","manage_students","manage_subjects",
        "enter_grades","edit_grades","manage_grade_windows","view_grade_audit",
        "upload_data","view_all_analytics","view_group_analytics","view_own_analytics",
        "view_predictions","export_reports","view_settings",
        "manage_attendance","view_attendance",
        "manage_debts","view_debts",
        "manage_schedule","view_schedule",
        "view_teacher_performance",
    ],
    "dekanat": [
        "view_dashboard","manage_students","manage_subjects",
        "manage_grade_windows","view_grade_audit",
        "view_all_analytics","view_group_analytics","view_own_analytics",
        "view_predictions","export_reports","view_settings",
        "view_attendance",
        "manage_debts","view_debts",
        "manage_schedule","view_schedule",
        "view_teacher_performance",
    ],
    "oqituvchi": [
        "view_dashboard","enter_grades","edit_grades",
        "view_group_analytics","view_own_analytics","view_settings",
        "manage_attendance","view_attendance",
        "manage_debts","view_debts",
        "view_schedule",
        "view_teacher_performance",
    ],
    "talaba": [
        "view_dashboard","view_own_analytics","view_settings",
        "view_attendance",
        "view_debts",
        "view_schedule",
    ]
}

ROLE_MENU = {
    "admin": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"students","label":"Talabalar","icon":"Users","path":"/students"},
        {"key":"subjects","label":"Fanlar","icon":"BookOpen","path":"/subjects"},
        {"key":"groups","label":"Guruhlar","icon":"Group","path":"/groups"},
        {"key":"grades","label":"Baho kiritish","icon":"ClipboardList","path":"/grades"},
        {"key":"attendance","label":"Davomat","icon":"CalendarCheck","path":"/attendance"},
        {"key":"debts","label":"Qarzdorliklar","icon":"AlertCircle","path":"/debts"},
        {"key":"schedule","label":"Dars jadvali","icon":"CalendarDays","path":"/schedule"},
        {"key":"teacher-performance","label":"O'qituvchi samaradorligi","icon":"TrendingUp","path":"/teacher-performance"},
        {"key":"risk","label":"Xavf tahlili","icon":"AlertTriangle","path":"/risk"},
        {"key":"reports","label":"Hisobotlar","icon":"BarChart2","path":"/reports"},
        {"key":"grade-windows","label":"Baholash oynalari","icon":"Calendar","path":"/grade-windows"},
        {"key":"upload","label":"Ma'lumot yuklash","icon":"Upload","path":"/upload"},
        {"key":"users","label":"Foydalanuvchilar","icon":"UserCog","path":"/users"},
        {"key":"settings","label":"Sozlamalar","icon":"Settings","path":"/settings"},
    ],
    "dekanat": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"students","label":"Talabalar","icon":"Users","path":"/students"},
        {"key":"subjects","label":"Fanlar","icon":"BookOpen","path":"/subjects"},
        {"key":"groups","label":"Guruhlar","icon":"Group","path":"/groups"},
        {"key":"attendance","label":"Davomat","icon":"CalendarCheck","path":"/attendance"},
        {"key":"debts","label":"Qarzdorliklar","icon":"AlertCircle","path":"/debts"},
        {"key":"schedule","label":"Dars jadvali","icon":"CalendarDays","path":"/schedule"},
        {"key":"teacher-performance","label":"O'qituvchi samaradorligi","icon":"TrendingUp","path":"/teacher-performance"},
        {"key":"risk","label":"Xavf tahlili","icon":"AlertTriangle","path":"/risk"},
        {"key":"reports","label":"Hisobotlar","icon":"BarChart2","path":"/reports"},
        {"key":"grade-windows","label":"Baholash oynalari","icon":"Calendar","path":"/grade-windows"},
        {"key":"settings","label":"Sozlamalar","icon":"Settings","path":"/settings"},
    ],
    "oqituvchi": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"students","label":"Talabalar","icon":"Users","path":"/students"},
        {"key":"grades","label":"Baho kiritish","icon":"ClipboardList","path":"/grades"},
        {"key":"attendance","label":"Davomat","icon":"CalendarCheck","path":"/attendance"},
        {"key":"debts","label":"Qarzdorliklar","icon":"AlertCircle","path":"/debts"},
        {"key":"schedule","label":"Dars jadvali","icon":"CalendarDays","path":"/schedule"},
        {"key":"teacher-performance","label":"Mening samaradorligim","icon":"TrendingUp","path":"/teacher-performance"},
        {"key":"settings","label":"Sozlamalar","icon":"Settings","path":"/settings"},
    ],
    "talaba": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"profile","label":"Profilim","icon":"UserCircle","path":"/profile"},
        {"key":"attendance","label":"Davomatim","icon":"CalendarCheck","path":"/attendance"},
        {"key":"debts","label":"Qarzdorliklarim","icon":"AlertCircle","path":"/debts"},
        {"key":"schedule","label":"Dars jadvali","icon":"CalendarDays","path":"/schedule"},
        {"key":"settings","label":"Sozlamalar","icon":"Settings","path":"/settings"},
    ]
}

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None