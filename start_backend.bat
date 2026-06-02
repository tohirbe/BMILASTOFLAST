@echo off
title BMI Backend Server
cd /d "C:\Users\tohir.bekpulatov\Desktop\BMI T\backend"
echo Backend ishga tushmoqda...
echo API: http://localhost:8000
echo Swagger: http://localhost:8000/docs
echo.
call venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
pause
