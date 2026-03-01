@echo off
REM Navigate to project root (where main.py is)
cd /d ..\

REM Activate your Python virtualenv if needed
REM call venv\Scripts\activate.bat

REM Run uvicorn on a free port
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8100