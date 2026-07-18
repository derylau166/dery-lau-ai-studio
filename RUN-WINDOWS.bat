@echo off
cd /d "%~dp0"
title DERY LAU AI STUDIO
if not exist node_modules (
  echo node_modules belum ada. Menjalankan installer...
  call INSTALL-AND-RUN-WINDOWS.bat
  exit /b
)
call npm run dev
pause
