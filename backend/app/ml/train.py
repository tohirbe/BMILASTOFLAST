# ML modeli oqitish
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))
import numpy as np, joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from app.database import SessionLocal
from app.models import Grade, Student

def build_dataset(db):
    X_list, y_list = [], []
    for student in db.query(Student).all():
        grades = db.query(Grade).filter(Grade.student_id==student.id).all()
        if len(grades)<2: continue
        balls=[g.ball for g in grades]; davomatlar=[g.davomat_foizi for g in grades]
        sem_avg={}
        for g in grades: sem_avg.setdefault(g.semestr,[]).append(g.ball)
        sm=[sum(sem_avg[s])/len(sem_avg[s]) for s in sorted(sem_avg.keys())]
        tend=sm[-1]-sm[-2] if len(sm)>=2 else 0
        ortacha=sum(balls)/len(balls)
        X_list.append([ortacha,sum(davomatlar)/len(davomatlar),sm[-2] if len(sm)>=2 else sm[-1],tend])
        y_list.append(1 if ortacha<56 else 0)
    return np.array(X_list), np.array(y_list)

def train():
    db=SessionLocal()
    print("Malumotlar tayyorlanmoqda...")
    X,y=build_dataset(db); db.close()
    if len(X)<10: print("Yetarli malumot yoq. Avval seed.py ni ishga tushiring."); return
    print(f"Jami: {len(X)}, Xavf ostidagilar: {y.sum()}")
    strat=y if y.sum()>1 else None
    X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=0.2,random_state=42,stratify=strat)
    model=RandomForestClassifier(n_estimators=100,max_depth=5,random_state=42)
    model.fit(X_train,y_train); y_pred=model.predict(X_test)
    print("\n=== Model natijalari ===")
    print(f"Accuracy:  {accuracy_score(y_test,y_pred):.3f}")
    print(f"Precision: {precision_score(y_test,y_pred,zero_division=0):.3f}")
    print(f"Recall:    {recall_score(y_test,y_pred,zero_division=0):.3f}")
    print(f"F1-score:  {f1_score(y_test,y_pred,zero_division=0):.3f}")
    model_path=os.path.join(os.path.dirname(__file__),"model.pkl")
    joblib.dump(model,model_path)
    print(f"\nModel saqlandi: {model_path}")

if __name__ == "__main__":
    train()
