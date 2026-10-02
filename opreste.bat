@echo off
cd /d "%~dp0"
echo stop> "%~dp0stop.flag"
rem audit L4: se opreste doar procesul node.exe care asculta pe portul aplicatiei, nu orice program de pe port
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":4321 " ^| findstr LISTENING') do tasklist /FI "PID eq %%p" /FI "IMAGENAME eq node.exe" /NH | findstr /I "node.exe" >nul && taskkill /PID %%p /T /F >nul 2>nul
if "%~1"=="liniste" exit /b
echo  WonderPages a fost oprita. Porneste-o din nou cu scurtatura WonderPages de pe Desktop.
timeout /t 4 >nul
