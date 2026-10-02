@echo off
chcp 65001 >nul
cd /d "%~dp0"
title WonderPages
rem Docker Desktop poate porni mai greu dupa logarea in Windows: astept pana la 3 minute
set /a tries=0
:waitdocker
docker info >nul 2>nul
if not errorlevel 1 goto dockerok
set /a tries+=1
if %tries% geq 36 goto dockerok
timeout /t 5 /nobreak >nul
goto waitdocker
:dockerok
docker compose up -d >nul 2>nul
if exist "%~dp0stop.flag" del "%~dp0stop.flag" >nul 2>nul
if "%~1"=="ascuns" goto hidden
if "%~1"=="vizibil" goto visible
rem dublu-clic: pornim aplicatia in fundal (fereastra se poate inchide fara sa opreasca aplicatia)
start "" wscript "%~dp0deschide.vbs"
echo.
echo  WonderPages ruleaza in fundal. Poti inchide aceasta fereastra.
echo  Oprire: opreste.bat. Depanare, cu mesajele la vedere: porneste.bat vizibil
timeout /t 6 >nul
exit /b
:visible
set OPEN_BROWSER=1
node server\start.js
pause
exit /b
:hidden
set WP_BG=1
for %%A in ("%~dp0wonderpages.log") do if %%~zA gtr 5000000 del "%%~A" >nul 2>nul
:again
node server\start.js >> "%~dp0wonderpages.log" 2>&1
rem codul 3 = aplicatia ruleaza deja; stop.flag = oprita de tine
if errorlevel 3 exit /b
if exist "%~dp0stop.flag" exit /b
timeout /t 10 /nobreak >nul
goto again
