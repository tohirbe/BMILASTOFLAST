# JWT token yaratish va tekshirish, parol hash, RBAC permissions
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROLE_PERMISSIONS = {
    "admin": ["view_dashboard","manage_users","manage_students","manage_subjects","enter_grades","upload_data","view_all_analytics","view_group_analytics","view_own_analytics","view_predictions","export_reports","view_settings"],
    "dekanat": ["view_dashboard","manage_students","manage_subjects","view_all_analytics","view_group_analytics","view_own_analytics","view_predictions","export_reports","view_settings"],
    "oqituvchi": ["view_dashboard","enter_grades","view_group_analytics","view_own_analytics","view_settings"],
    "talaba": ["view_dashboard","view_own_analytics","view_settings"]
}

ROLE_MENU = {
    "admin": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"students","label":"Talabalar","icon":"Users","path":"/students"},
        {"key":"subjects","label":"Fanlar","icon":"BookOpen","path":"/subjects"},
        {"key":"groups","label":"Guruhlar","icon":"Group","path":"/groups"},
        {"key":"risk","label":"Xavf tahlili","icon":"AlertTriangle","path":"/risk"},
        {"key":"reports","label":"Hisobotlar","icon":"BarChart2","path":"/reports"},
        {"key":"upload","label":"Ma'lumot yuklash","icon":"Upload","path":"/upload"},
        {"key":"users","label":"Foydalanuvchilar","icon":"UserCog","path":"/users"},
        {"key":"settings","label":"Sozlamalar","icon":"Settings","path":"/settings"},
    ],
    "dekanat": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"students","label":"Talabalar","icon":"Users","path":"/students"},
        {"key":"subjects","label":"Fanlar","icon":"BookOpen","path":"/subjects"},
        {"key":"groups","label":"Guruhlar","icon":"Group","path":"/groups"},
        {"key":"risk","label":"Xavf tahlili","icon":"AlertTriangle","path":"/risk"},
        {"key":"reports","label":"Hisobotlar","icon":"BarChart2","path":"/reports"},
        {"key":"settings","label":"Sozlamalar","icon":"Settings","path":"/settings"},
    ],
    "oqituvchi": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"students","label":"Talabalar","icon":"Users","path":"/students"},
        {"key":"grades","label":"Baholar","icon":"ClipboardList","path":"/grades"},
        {"key":"settings","label":"Sozlamalar","icon":"Settings","path":"/settings"},
    ],
    "talaba": [
        {"key":"dashboard","label":"Dashboard","icon":"LayoutDashboard","path":"/"},
        {"key":"profile","label":"Profilim","icon":"UserCircle","path":"/profile"},
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
