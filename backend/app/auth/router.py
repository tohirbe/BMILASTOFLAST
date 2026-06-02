# Autentifikatsiya endpointlari
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import TokenResponse, UserMeResponse, LoginRequest
from app.auth.utils import verify_password, create_access_token, ROLE_PERMISSIONS, ROLE_MENU
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Autentifikatsiya"])

@router.post("/login", response_model=TokenResponse)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == form_data.login).first()
    if not user or not verify_password(form_data.parol, user.parol_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login yoki parol noto'g'ri")
    token = create_access_token({"sub": str(user.id), "rol": user.rol.value})
    return TokenResponse(access_token=token)

@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    permissions = ROLE_PERMISSIONS.get(current_user.rol.value, [])
    menu = ROLE_MENU.get(current_user.rol.value, [])
    return UserMeResponse(
        id=current_user.id, login=current_user.login,
        ism=current_user.ism, familiya=current_user.familiya,
        rol=current_user.rol, permissions=permissions, menu=menu,
        student_id=current_user.student_id
    )
