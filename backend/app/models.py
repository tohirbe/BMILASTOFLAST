# SQLAlchemy ORM modellari - barcha jadvallar
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, UniqueConstraint, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    dekanat = "dekanat"
    oqituvchi = "oqituvchi"
    talaba = "talaba"

class GenderEnum(str, enum.Enum):
    erkak = "erkak"
    ayol = "ayol"

class AttendanceEnum(str, enum.Enum):
    keldi = "keldi"
    kelmadi = "kelmadi"
    kechikdi = "kechikdi"
    sababli = "sababli"

class DebtStatusEnum(str, enum.Enum):
    ochiq = "ochiq"
    yopilgan = "yopilgan"

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    nomi = Column(String(50), unique=True, nullable=False)
    kurs = Column(Integer, nullable=False)
    yonalish = Column(String(100), nullable=False)
    students = relationship("Student", back_populates="group")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    nomi = Column(String(150), unique=True, nullable=False)
    kredit = Column(Integer, default=3)
    semestr = Column(Integer, nullable=False)
    grades = relationship("Grade", back_populates="subject")
    teacher_subjects = relationship("TeacherSubject", back_populates="subject")
    weights = relationship("SubjectWeights", back_populates="subject", uselist=False)

class SubjectWeights(Base):
    """Har fan uchun JN/ON/YN ulushi"""
    __tablename__ = "subject_weights"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), unique=True, nullable=False)
    jn_ulush = Column(Float, default=0.30, nullable=False)
    on_ulush = Column(Float, default=0.30, nullable=False)
    yn_ulush = Column(Float, default=0.40, nullable=False)
    subject = relationship("Subject", back_populates="weights")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    ism = Column(String(80), nullable=False)
    familiya = Column(String(80), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    kurs = Column(Integer, nullable=False)
    jinsi = Column(Enum(GenderEnum), nullable=False)
    qabul_yili = Column(Integer, nullable=False)
    group = relationship("Group", back_populates="students")
    grades = relationship("Grade", back_populates="student")
    user = relationship("User", back_populates="student", uselist=False)
    attendances = relationship("Attendance", back_populates="student")
    debts = relationship("AcademicDebt", back_populates="student")

class Grade(Base):
    __tablename__ = "grades"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semestr = Column(Integer, nullable=False)
    ball = Column(Float, nullable=False)            # yakuniy hisoblangan ball (backward compat)
    jn_ball = Column(Float, nullable=True)          # Joriy nazorat
    on_ball = Column(Float, nullable=True)          # Oraliq nazorat
    yn_ball = Column(Float, nullable=True)          # Yakuniy nazorat
    yakuniy_ball = Column(Float, nullable=True)     # avtomatik hisoblangan
    davomat_foizi = Column(Float, default=85.0)
    sana = Column(DateTime, server_default=func.now())
    student = relationship("Student", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")
    audit_logs = relationship("GradeAudit", back_populates="grade")

class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher = relationship("User", back_populates="teacher_subjects")
    subject = relationship("Subject", back_populates="teacher_subjects")

class GradeWindow(Base):
    """Baholash oynasi - guruh+fan+semestr uchun baho kiritish holati"""
    __tablename__ = "grade_windows"
    id = Column(Integer, primary_key=True, index=True)
    guruh_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    fan_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semestr = Column(Integer, nullable=False)
    holati = Column(String(10), default="ochiq", nullable=False)
    o_zgartirgan_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    yangilangan_sana = Column(DateTime, server_default=func.now())
    __table_args__ = (UniqueConstraint("guruh_id", "fan_id", "semestr", name="uq_window"),)
    group = relationship("Group")
    subject = relationship("Subject")
    changed_by = relationship("User", foreign_keys=[o_zgartirgan_user_id])

class GradeAudit(Base):
    """Baho o'zgarishlari tarixi"""
    __tablename__ = "grade_audit"
    id = Column(Integer, primary_key=True, index=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    o_zgartirgan_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    eski_ball = Column(Float)
    yangi_ball = Column(Float)
    eski_davomat = Column(Float)
    yangi_davomat = Column(Float)
    izoh = Column(String(300))
    sana = Column(DateTime, server_default=func.now())
    grade = relationship("Grade", back_populates="audit_logs")
    changed_by = relationship("User", foreign_keys=[o_zgartirgan_user_id])

class LessonSession(Base):
    """Dars sessiyasi - o'qituvchi yaratadi"""
    __tablename__ = "lesson_sessions"
    id = Column(Integer, primary_key=True, index=True)
    guruh_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    fan_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    oqituvchi_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sana = Column(Date, nullable=False)
    mavzu = Column(String(300), nullable=True)
    yaratilgan_sana = Column(DateTime, server_default=func.now())
    group = relationship("Group")
    subject = relationship("Subject")
    teacher = relationship("User", foreign_keys=[oqituvchi_id])
    attendances = relationship("Attendance", back_populates="lesson")

class Attendance(Base):
    """Davomat yozuvi"""
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    dars_id = Column(Integer, ForeignKey("lesson_sessions.id"), nullable=False)
    talaba_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    holat = Column(Enum(AttendanceEnum), default=AttendanceEnum.keldi, nullable=False)
    __table_args__ = (UniqueConstraint("dars_id", "talaba_id", name="uq_attendance"),)
    lesson = relationship("LessonSession", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")

class AcademicDebt(Base):
    """Akademik qarzdorlik"""
    __tablename__ = "academic_debts"
    id = Column(Integer, primary_key=True, index=True)
    talaba_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    fan_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semestr = Column(Integer, nullable=False)
    holat = Column(Enum(DebtStatusEnum), default=DebtStatusEnum.ochiq, nullable=False)
    yuzaga_kelgan_sana = Column(DateTime, server_default=func.now())
    qayta_topshirish_sana = Column(DateTime, nullable=True)
    yangi_ball = Column(Float, nullable=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=True)
    student = relationship("Student", back_populates="debts")
    subject = relationship("Subject")
    grade = relationship("Grade")

class ScheduleSlot(Base):
    """Dars jadvali yachekasi"""
    __tablename__ = "schedule_slots"
    id = Column(Integer, primary_key=True, index=True)
    guruh_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    fan_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    oqituvchi_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hafta_kuni = Column(Integer, nullable=False)   # 1=Dushanba ... 6=Shanba
    juftlik = Column(Integer, nullable=False)       # 1–7
    xona = Column(String(50), nullable=True)
    __table_args__ = (UniqueConstraint("guruh_id", "hafta_kuni", "juftlik", name="uq_schedule"),)
    group = relationship("Group")
    subject = relationship("Subject")
    teacher = relationship("User", foreign_keys=[oqituvchi_id])

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(80), unique=True, nullable=False)
    parol_hash = Column(String(255), nullable=False)
    ism = Column(String(80), nullable=False)
    familiya = Column(String(80), nullable=False)
    rol = Column(Enum(RoleEnum), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    student = relationship("Student", back_populates="user")
    teacher_subjects = relationship("TeacherSubject", back_populates="teacher")