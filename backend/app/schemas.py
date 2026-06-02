# Pydantic sxemalari
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models import RoleEnum, GenderEnum

class LoginRequest(BaseModel):
    login: str
    parol: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MenuItemSchema(BaseModel):
    key: str
    label: str
    icon: str
    path: str

class UserMeResponse(BaseModel):
    id: int
    login: str
    ism: str
    familiya: str
    rol: RoleEnum
    permissions: List[str]
    menu: List[MenuItemSchema]
    student_id: Optional[int] = None
    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    nomi: str
    kurs: int
    yonalish: str

class GroupCreate(GroupBase):
    pass

class GroupOut(GroupBase):
    id: int
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    nomi: str
    kredit: int = 3
    semestr: int

class SubjectCreate(SubjectBase):
    pass

class SubjectOut(SubjectBase):
    id: int
    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    ism: str
    familiya: str
    group_id: int
    kurs: int
    jinsi: GenderEnum
    qabul_yili: int

class StudentCreate(StudentBase):
    pass

class StudentOut(StudentBase):
    id: int
    group: Optional[GroupOut] = None
    class Config:
        from_attributes = True

class GradeBase(BaseModel):
    student_id: int
    subject_id: int
    semestr: int
    ball: float
    davomat_foizi: float = 85.0

class GradeCreate(GradeBase):
    pass

class GradeOut(GradeBase):
    id: int
    sana: Optional[datetime] = None
    jn_ball: Optional[float] = None
    on_ball: Optional[float] = None
    yn_ball: Optional[float] = None
    yakuniy_ball: Optional[float] = None
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    login: str
    parol: str
    ism: str
    familiya: str
    rol: RoleEnum
    student_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    login: str
    ism: str
    familiya: str
    rol: RoleEnum
    student_id: Optional[int] = None
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    ism: Optional[str] = None
    familiya: Optional[str] = None
    rol: Optional[RoleEnum] = None
    parol: Optional[str] = None
