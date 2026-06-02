# Bazani realistik malumot bilan toldirish
import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))
from app.database import SessionLocal, Base, engine
from app.models import Group, Subject, Student, Grade, User, TeacherSubject, GenderEnum, RoleEnum
from app.auth.utils import hash_password

random.seed(42)
ERKAK=["Sardor","Jasur","Bobur","Sherzod","Ulugbek","Nodir","Dilshod","Sanjar","Eldor","Firdavs","Ravshan","Otabek","Mirzo","Doniyor","Kamol"]
AYOL=["Nodira","Malika","Zilola","Feruza","Hulkar","Sabohat","Dilorom","Mohira","Gulnora","Shahnoza","Barno","Maftuna","Zulfiya","Nasiba","Yulduz"]
FAMILIYA=["Aliyev","Karimov","Rahimov","Umarov","Xasanov","Toshmatov","Yusupov","Mirzayev","Qodirov","Nazarov","Ergashev","Abdullayev","Razzaqov","Holiqov","Xolmatov","Normatov","Sotvoldiyev","Baxtiyorov","Ismoilov","Azimov"]
GURUHLAR=[("KI-21-01",3,"Kompyuter injiniringi"),("KI-21-02",3,"Kompyuter injiniringi"),("DT-22-01",2,"Dasturiy taminot"),("DT-22-02",2,"Dasturiy taminot"),("AT-23-01",1,"Axborot texnologiyalari"),("AT-23-02",1,"Axborot texnologiyalari"),("IS-20-01",4,"Intellektual tizimlar"),("IS-20-02",4,"Intellektual tizimlar")]
FANLAR=[("Dasturlash asoslari",4,1),("Matematik analiz",5,1),("Fizika",4,2),("Malumotlar bazasi",4,3),("Veb-texnologiyalar",3,4),("Operatsion tizimlar",3,3),("Algoritmlar va malumotlar strukturasi",4,4),("Ingliz tili",2,1),("Falsafa",2,2),("Kompyuter grafikasi",3,5)]

def seed():
    Base.metadata.create_all(bind=engine)
    db=SessionLocal()
    for model in [TeacherSubject,Grade,User,Student,Subject,Group]:
        db.query(model).delete()
    db.commit(); print("Baza tozalandi.")
    groups=[]
    for nomi,kurs,yonalish in GURUHLAR:
        g=Group(nomi=nomi,kurs=kurs,yonalish=yonalish); db.add(g); groups.append(g)
    db.commit(); print(f"{len(groups)} ta guruh.")
    subjects=[]
    for nomi,kredit,sem in FANLAR:
        s=Subject(nomi=nomi,kredit=kredit,semestr=sem); db.add(s); subjects.append(s)
    db.commit(); print(f"{len(subjects)} ta fan.")
    students=[]
    for group in groups:
        for _ in range(random.randint(15,20)):
            jinsi=random.choice([GenderEnum.erkak,GenderEnum.ayol])
            ism=random.choice(ERKAK if jinsi==GenderEnum.erkak else AYOL)
            s=Student(ism=ism,familiya=random.choice(FAMILIYA),group_id=group.id,kurs=group.kurs,jinsi=jinsi,qabul_yili=2024-group.kurs+1)
            db.add(s); students.append(s)
    db.commit(); print(f"{len(students)} ta talaba.")
    grades_n=0
    for student in students:
        qobiliyat=random.gauss(72,15)
        max_sem=min(student.kurs*2,8); semlar=list(range(1,max_sem+1))
        for fan in random.sample(subjects,min(len(subjects),random.randint(4,8))):
            sem=random.choice(semlar)
            ball=max(20,min(100,qobiliyat+random.gauss(0,8)))
            davomat=min(100,max(40,ball*0.9+random.gauss(10,10)))
            db.add(Grade(student_id=student.id,subject_id=fan.id,semestr=sem,ball=round(ball,1),davomat_foizi=round(davomat,1))); grades_n+=1
    db.commit(); print(f"{grades_n} ta baho.")
    admin=User(login="admin",parol_hash=hash_password("admin123"),ism="Admin",familiya="Tizim",rol=RoleEnum.admin)
    dekanat=User(login="dekanat",parol_hash=hash_password("dekan123"),ism="Sarvar",familiya="Rahmatullayev",rol=RoleEnum.dekanat)
    teacher=User(login="oqituvchi",parol_hash=hash_password("teacher123"),ism="Anvar",familiya="Xolmatov",rol=RoleEnum.oqituvchi)
    db.add_all([admin,dekanat,teacher]); db.commit()
    for subj in random.sample(subjects,3):
        db.add(TeacherSubject(teacher_id=teacher.id,subject_id=subj.id))
    s_ref=students[0]
    db.add(User(login="talaba",parol_hash=hash_password("student123"),ism=s_ref.ism,familiya=s_ref.familiya,rol=RoleEnum.talaba,student_id=s_ref.id))
    db.commit()
    print("\nDemo loginlar: admin/admin123 | dekanat/dekan123 | oqituvchi/teacher123 | talaba/student123")
    print("Seed tugadi!")

if __name__ == "__main__":
    seed()
