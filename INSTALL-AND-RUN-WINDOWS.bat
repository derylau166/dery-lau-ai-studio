@echo off
setlocal
cd /d "%~dp0"
title DERY LAU AI STUDIO - Install and Run

echo ======================================================
echo   DERY LAU AI STUDIO - CLEAN INSTALL
 echo ======================================================
echo.

echo [1/5] Menutup proses Node/Vite lama...
taskkill /F /IM node.exe >nul 2>&1

echo [2/5] Membersihkan instalasi yang gagal...
if exist node_modules rmdir /S /Q node_modules
if exist package-lock.json del /F /Q package-lock.json

echo [3/5] Memakai registry npm publik...
call npm config set registry https://registry.npmjs.org/

echo [4/5] Menginstal paket...
call npm install --registry=https://registry.npmjs.org/
if errorlevel 1 goto :install_failed

echo [5/5] Menjalankan DERY LAU AI STUDIO...
echo Browser: http://localhost:5173
call npm run dev
goto :end

:install_failed
echo.
echo INSTALASI GAGAL.
echo Pastikan internet aktif, lalu coba lagi.
echo Jalankan juga: npm config get registry
echo Hasil yang benar: https://registry.npmjs.org/
pause

:end
endlocal
