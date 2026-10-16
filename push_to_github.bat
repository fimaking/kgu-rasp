@echo off
chcp 65001 > nul
title Отправка проекта на GitHub
cd /d "%~dp0"

:: Set path to portable git if needed
if exist "%USERPROFILE%\.git-portable\cmd\git.exe" (
    set "PATH=%USERPROFILE%\.git-portable\cmd;%PATH%"
)

echo ===================================================
echo 🚀 Отправка приложения КГУ на GitHub
echo ===================================================
echo.
echo Вставьте ссылку на ваш созданный репозиторий на GitHub.
echo Например: https://github.com/your-username/ksu-rasp.git
echo.
set /p REPO_URL="Вставьте ссылку на репозиторий: "

if "%REPO_URL%"=="" (
    echo [ОШИБКА] Ссылка не была введена.
    pause
    exit /b 1
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo.
echo [ИНФО] Отправка файлов в репозиторий...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo ✅ Код успешно загружен на GitHub!
    echo Теперь перейдите в Settings -^> Pages на GitHub и
    echo выберите Source: GitHub Actions.
    echo ===================================================
) else (
    echo.
    echo [ВНИМАНИЕ] Проверьте правильность ссылки и авторизацию в GitHub.
)
pause
