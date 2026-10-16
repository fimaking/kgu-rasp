@echo off
chcp 65001 > nul
title КГУ Студент - Расписание & Задачи

echo ===================================================
echo 🎓 Приложение студента КГУ (Группа 8953 / 26-ИСбо-4)
echo ===================================================
echo.

:: Add portable node to path if available in standard locations
if exist "%USERPROFILE%\.node\node-v24.22.0-win-x64\node.exe" (
    set "PATH=%USERPROFILE%\.node\node-v24.22.0-win-x64;%PATH%"
)

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден в системе.
    echo Пожалуйста, установите Node.js с официального сайта: https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exist
if not exist "node_modules" (
    echo [ИНФО] Установка зависимостей (npm install)...
    call npm install
)

:: Check if dist exists
if not exist "dist" (
    echo [ИНФО] Сборка интерфейса (npm run build)...
    call npm run build
)

echo [ИНФО] Запуск сервера приложения...
echo [ИНФО] Открытие в браузере: http://localhost:3000
echo.

:: Open default browser after 2 seconds in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start Express server
call npm start
pause
