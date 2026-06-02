# SQLAlchemy ORM modellari - barcha jadvallar
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
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

class Grade(Base):
    __tablename__ = "grades"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semestr = Column(Integer, nullable=False)
    ball = Column(Float, nullable=False)
    davomat_foizi = Column(Float, default=85.0)
    sana = Column(DateTime, server_default=func.now())
    student = relationship("Student", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")

class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher = relationship("User", back_populates="teacher_subjects")
    subject = relationship("Subject", back_populates="teacher_subjects")

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
