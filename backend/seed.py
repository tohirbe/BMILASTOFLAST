# Bazani realistik ma'lumot bilan to'ldirish
import sys, os, random
from datetime import date, timedelta, datetime
sys.path.insert(0, os.path.dirname(__file__))
from app.database import SessionLocal, Base, engine
from app.models import (
    Group, Subject, Student, Grade, User, TeacherSubject,
    GenderEnum, RoleEnum, SubjectWeights, LessonSession, Attendance,
    AcademicDebt, ScheduleSlot, AttendanceEnum, DebtStatusEnum
)
from app.auth.utils import hash_password

random.seed(42)

ERKAK = ["Sardor","Jasur","Bobur","Sherzod","Ulugbek","Nodir","Dilshod","Sanjar","Eldor",
         "Firdavs","Ravshan","Otabek","Mirzo","Doniyor","Kamol","Hamidjon","Bahodir","Lochin"]
AYOL  = ["Nodira","Malika","Zilola","Feruza","Hulkar","Sabohat","Dilorom","Mohira",
         "Gulnora","Shahnoza","Barno","Maftuna","Zulfiya","Nasiba","Yulduz","Dilnoza","Nafisa"]
FAMILIYA = ["Aliyev","Karimov","Rahimov","Umarov","Xasanov","Toshmatov","Yusupov",
            "Mirzayev","Qodirov","Nazarov","Ergashev","Abdullayev","Razzaqov",
            "Holiqov","Xolmatov","Normatov","Sotvoldiyev","Baxtiyorov","Ismoilov","Azimov"]

GURUHLAR = [
    ("KI-21-01",3,"Kompyuter injiniringi"),
    ("KI-21-02",3,"Kompyuter injiniringi"),
    ("DT-22-01",2,"Dasturiy ta'minot"),
    ("DT-22-02",2,"Dasturiy ta'minot"),
    ("AT-23-01",1,"Axborot texnologiyalari"),
    ("AT-23-02",1,"Axborot texnologiyalari"),
    ("IS-20-01",4,"Intellektual tizimlar"),
    ("IS-20-02",4,"Intellektual tizimlar"),
]

FANLAR = [
    ("Dasturlash asoslari",4,1),
    ("Matematik analiz",5,1),
    ("Fizika",4,2),
    ("Ma'lumotlar bazasi",4,3),
    ("Veb-texnologiyalar",3,4),
    ("Operatsion tizimlar",3,3),
    ("Algoritmlar va ma'lumotlar strukturasi",4,4),
    ("Ingliz tili",2,1),
    ("Falsafa",2,2),
    ("Kompyuter grafikasi",3,5),
]

XONALAR = ["101","102","103","201","202","203","301","Lab-1","Lab-2","Majlis xonasi"]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Eski ma'lumotlarni tozalash
    for model in [ScheduleSlot, AcademicDebt, Attendance, LessonSession,
                  SubjectWeights, TeacherSubject, Grade, User, Student, Subject, Group]:
        db.query(model).delete()
    db.commit()
    print("Baza tozalandi.")

    # Guruhlar
    groups = []
    for nomi, kurs, yonalish in GURUHLAR:
        g = Group(nomi=nomi, kurs=kurs, yonalish=yonalish)
        db.add(g); groups.append(g)
    db.commit()
    print(f"{len(groups)} ta guruh yaratildi.")

    # Fanlar
    subjects = []
    for nomi, kredit, sem in FANLAR:
        s = Subject(nomi=nomi, kredit=kredit, semestr=sem)
        db.add(s); subjects.append(s)
    db.commit()

    # Har fan uchun ulushlar (biroz farq qilib)
    weights_data = [
        (0.30, 0.30, 0.40),
        (0.25, 0.35, 0.40),
        (0.30, 0.30, 0.40),
        (0.20, 0.40, 0.40),
        (0.30, 0.30, 0.40),
        (0.30, 0.30, 0.40),
        (0.25, 0.35, 0.40),
        (0.40, 0.20, 0.40),
        (0.30, 0.30, 0.40),
        (0.30, 0.30, 0.40),
    ]
    for i, subj in enumerate(subjects):
        wj, wo, wy = weights_data[i % len(weights_data)]
        db.add(SubjectWeights(subject_id=subj.id, jn_ulush=wj, on_ulush=wo, yn_ulush=wy))
    db.commit()
    print(f"{len(subjects)} ta fan va ulushlar yaratildi.")

    # Talabalar
    students = []
    for group in groups:
        for _ in range(random.randint(15, 20)):
            jinsi = random.choice([GenderEnum.erkak, GenderEnum.ayol])
            ism = random.choice(ERKAK if jinsi == GenderEnum.erkak else AYOL)
            s = Student(
                ism=ism,
                familiya=random.choice(FAMILIYA),
                group_id=group.id,
                kurs=group.kurs,
                jinsi=jinsi,
                qabul_yili=2024 - group.kurs + 1
            )
            db.add(s); students.append(s)
    db.commit()
    print(f"{len(students)} ta talaba yaratildi.")

    # Foydalanuvchilar: admin, dekanat, 3 ta o'qituvchi, talaba
    admin = User(login="admin", parol_hash=hash_password("admin123"),
                 ism="Admin", familiya="Tizim", rol=RoleEnum.admin)
    dekanat = User(login="dekanat", parol_hash=hash_password("dekan123"),
                   ism="Sarvar", familiya="Rahmatullayev", rol=RoleEnum.dekanat)
    teacher1 = User(login="oqituvchi", parol_hash=hash_password("teacher123"),
                    ism="Anvar", familiya="Xolmatov", rol=RoleEnum.oqituvchi)
    teacher2 = User(login="oqituvchi2", parol_hash=hash_password("teacher123"),
                    ism="Zulfiya", familiya="Qodiрova", rol=RoleEnum.oqituvchi)
    teacher3 = User(login="oqituvchi3", parol_hash=hash_password("teacher123"),
                    ism="Bahodir", familiya="Ergashev", rol=RoleEnum.oqituvchi)
    db.add_all([admin, dekanat, teacher1, teacher2, teacher3])
    db.commit()

    teachers = [teacher1, teacher2, teacher3]
    # Har o'qituvchiga 3-4 ta fan biriktirish
    shuffled_subjs = subjects[:]
    random.shuffle(shuffled_subjs)
    t1_subjs = shuffled_subjs[:4]
    t2_subjs = shuffled_subjs[3:7]
    t3_subjs = shuffled_subjs[6:10]
    for subj in t1_subjs:
        db.add(TeacherSubject(teacher_id=teacher1.id, subject_id=subj.id))
    for subj in t2_subjs:
        db.add(TeacherSubject(teacher_id=teacher2.id, subject_id=subj.id))
    for subj in t3_subjs:
        db.add(TeacherSubject(teacher_id=teacher3.id, subject_id=subj.id))
    db.commit()

    # Talaba foydalanuvchisi
    s_ref = students[0]
    db.add(User(login="talaba", parol_hash=hash_password("student123"),
                ism=s_ref.ism, familiya=s_ref.familiya,
                rol=RoleEnum.talaba, student_id=s_ref.id))
    db.commit()

    # Baholar (JN/ON/YN bilan)
    grades_n = 0
    grade_objects = []
    for student in students:
        qobiliyat = random.gauss(72, 15)
        max_sem = min(student.kurs * 2, 8)
        semlar = list(range(1, max_sem + 1))
        for fan in random.sample(subjects, min(len(subjects), random.randint(4, 8))):
            sem = random.choice(semlar)
            # JN/ON/YN alohida
            jn = max(20, min(100, qobiliyat + random.gauss(0, 10)))
            on = max(20, min(100, qobiliyat + random.gauss(0, 10)))
            yn = max(20, min(100, qobiliyat + random.gauss(0, 10)))
            # Ulushni olish
            w = next((sw for sw in db.query(SubjectWeights).filter_by(subject_id=fan.id).all()), None)
            wj = w.jn_ulush if w else 0.30
            wo = w.on_ulush if w else 0.30
            wy = w.yn_ulush if w else 0.40
            yak = round(jn * wj + on * wo + yn * wy, 1)
            davomat = min(100, max(40, yak * 0.9 + random.gauss(10, 10)))
            g = Grade(
                student_id=student.id,
                subject_id=fan.id,
                semestr=sem,
                ball=yak,
                jn_ball=round(jn, 1),
                on_ball=round(on, 1),
                yn_ball=round(yn, 1),
                yakuniy_ball=yak,
                davomat_foizi=round(davomat, 1)
            )
            db.add(g)
            grade_objects.append(g)
            grades_n += 1
    db.commit()
    print(f"{grades_n} ta baho yaratildi.")

    # Akademik qarzdorliklar — < 56 bo'lganlar uchun
    debts_n = 0
    for g in grade_objects:
        if g.yakuniy_ball is not None and g.yakuniy_ball < 56:
            # 70% ochiq, 30% yopilgan (qayta topshirgan)
            if random.random() < 0.70:
                db.add(AcademicDebt(
                    talaba_id=g.student_id,
                    fan_id=g.subject_id,
                    semestr=g.semestr,
                    holat=DebtStatusEnum.ochiq,
                    grade_id=g.id
                ))
            else:
                yangi = round(random.uniform(56, 75), 1)
                db.add(AcademicDebt(
                    talaba_id=g.student_id,
                    fan_id=g.subject_id,
                    semestr=g.semestr,
                    holat=DebtStatusEnum.yopilgan,
                    yangi_ball=yangi,
                    qayta_topshirish_sana=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                    grade_id=g.id
                ))
            debts_n += 1
    db.commit()
    print(f"{debts_n} ta qarzdorlik yaratildi.")

    # Dars sessiyalari va davomat
    today = date.today()
    teacher_subj_map = {
        teacher1.id: [ts.subject_id for ts in db.query(TeacherSubject).filter_by(teacher_id=teacher1.id).all()],
        teacher2.id: [ts.subject_id for ts in db.query(TeacherSubject).filter_by(teacher_id=teacher2.id).all()],
        teacher3.id: [ts.subject_id for ts in db.query(TeacherSubject).filter_by(teacher_id=teacher3.id).all()],
    }
    lessons_n = 0
    att_n = 0
    mavzular = [
        "Kirish ma'ruzasi", "Asosiy tushunchalar", "Amaliy mashg'ulot",
        "Nazorat ishi tahlili", "Yangi mavzu", "Takrorlash", "Laboratoriya ishi",
        "Semestr bo'yicha yakun"
    ]
    for teacher in teachers:
        for subj_id in teacher_subj_map[teacher.id]:
            # Bu fanni o'qiydigan guruhlarni topish
            grading_groups = list({g.student.group_id
                                   for g in db.query(Grade).filter_by(subject_id=subj_id).all()
                                   if g.student})[:3]
            for group_id in grading_groups:
                group_students = db.query(Student).filter_by(group_id=group_id).all()
                if not group_students:
                    continue
                # So'nggi 30 kun ichida 6-8 ta dars
                for i in range(random.randint(6, 8)):
                    lesson_date = today - timedelta(days=random.randint(1, 60))
                    lesson = LessonSession(
                        guruh_id=group_id,
                        fan_id=subj_id,
                        oqituvchi_id=teacher.id,
                        sana=lesson_date,
                        mavzu=random.choice(mavzular)
                    )
                    db.add(lesson)
                    db.flush()
                    lessons_n += 1
                    for st in group_students:
                        # 85% keladi
                        r = random.random()
                        if r < 0.75:
                            holat = AttendanceEnum.keldi
                        elif r < 0.85:
                            holat = AttendanceEnum.kechikdi
                        elif r < 0.92:
                            holat = AttendanceEnum.sababli
                        else:
                            holat = AttendanceEnum.kelmadi
                        db.add(Attendance(dars_id=lesson.id, talaba_id=st.id, holat=holat))
                        att_n += 1
    db.commit()
    print(f"{lessons_n} ta dars, {att_n} ta davomat yozuvi yaratildi.")

    # Dars jadvali — barcha guruhlar uchun haftalik
    slots_n = 0
    all_teacher_subjs = []
    for teacher in teachers:
        for sid in teacher_subj_map[teacher.id]:
            all_teacher_subjs.append((teacher.id, sid))

    used_slots = {}  # guruh_id -> set of (hafta_kuni, juftlik)
    for group in groups:
        used_slots[group.id] = set()
        group_subjs = random.sample(subjects, min(6, len(subjects)))
        for hafta_kuni in range(1, 6):  # Dushanba-Juma
            juftliklar = random.sample(range(1, 7), min(3, 6))
            for juftlik in juftliklar:
                if (hafta_kuni, juftlik) in used_slots[group.id]:
                    continue
                if not group_subjs:
                    break
                subj = group_subjs[slots_n % len(group_subjs)]
                # O'qituvchini aniqlash
                teacher_for_subj = None
                for t in teachers:
                    if subj.id in teacher_subj_map[t.id]:
                        teacher_for_subj = t
                        break
                if not teacher_for_subj:
                    teacher_for_subj = teacher1
                try:
                    slot = ScheduleSlot(
                        guruh_id=group.id,
                        fan_id=subj.id,
                        oqituvchi_id=teacher_for_subj.id,
                        hafta_kuni=hafta_kuni,
                        juftlik=juftlik,
                        xona=random.choice(XONALAR)
                    )
                    db.add(slot)
                    db.flush()
                    used_slots[group.id].add((hafta_kuni, juftlik))
                    slots_n += 1
                except Exception:
                    db.rollback()
    db.commit()
    print(f"{slots_n} ta jadval yachekasi yaratildi.")

    print("\n" + "="*50)
    print("Demo loginlar:")
    print("  admin      / admin123")
    print("  dekanat    / dekan123")
    print("  oqituvchi  / teacher123")
    print("  oqituvchi2 / teacher123")
    print("  oqituvchi3 / teacher123")
    print("  talaba     / student123")
    print("="*50)
    print("Seed muvaffaqiyatli tugadi!")
    db.close()

if __name__ == "__main__":
    seed()
