@echo off
if not "%~1"=="run" (
  cmd /k ""%~f0" run"
  exit /b
)
chcp 65001 >nul
cd /d "%~dp0"
title WonderPages - instalare
echo.
echo  ===  WonderPages: instalare (o singura data)  ===
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Instalez Node.js...
  where winget >nul 2>nul
  if errorlevel 1 (
    echo  Nu gasesc winget. Instaleaza Node.js LTS de pe nodejs.org, apoi porneste din nou instaleaza.bat
    pause
    exit /b
  )
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  echo.
  echo  Node.js a fost instalat. Inchide fereastra si porneste din nou instaleaza.bat
  pause
  exit /b
)
echo  [1/6] Node.js: OK
rem la actualizare: oprim versiunea care ruleaza in fundal, ca sa porneasca la final versiunea noua
call "%~dp0opreste.bat" liniste
docker version >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Docker nu raspunde. Porneste Docker Desktop, asteapta sa fie gata, apoi ruleaza din nou instaleaza.bat
  pause
  exit /b
)
echo  [2/6] Docker: OK
if exist .env goto envok
copy .env.example .env >nul
rem audit L3: o parola noua, aleatoare, pentru baza de date (doar la prima instalare, cand baza nu exista inca)
docker volume inspect wonderpages_pg >nul 2>nul
if not errorlevel 1 goto envok
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=-join((48..57)+(97..122)|Get-Random -Count 24|ForEach-Object{[char]$_}); $f='%~dp0.env'; (Get-Content $f) -replace 'wonderpages-local',$p | Set-Content -Encoding UTF8 $f"
echo        Am generat o parola noua pentru baza de date.
:envok
echo  [3/6] Pornesc baza de date...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\migreaza-docker.ps1"
if errorlevel 1 goto err
docker compose up -d
if errorlevel 1 goto :err
echo  [4/6] Instalez componentele aplicatiei - versiunile fixate din package-lock.json...
if not exist package-lock.json goto npminstall
call npm ci --no-fund --no-audit
if errorlevel 1 goto :err
goto npmok
:npminstall
call npm install --no-fund --no-audit
if errorlevel 1 goto :err
:npmok
rem fontul cartilor (Andika, licenta OFL) se pastreaza local: PDF-urile arata la fel si fara internet
if exist "%~dp0public\fonts\Andika-Regular.ttf" goto fontok
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d='%~dp0public\fonts'; New-Item -ItemType Directory -Force $d | Out-Null; foreach($n in 'Andika-Regular','Andika-Bold'){ try { Invoke-WebRequest -UseBasicParsing ('https://github.com/google/fonts/raw/main/ofl/andika/'+$n+'.ttf') -OutFile (Join-Path $d ($n+'.ttf')) } catch { Write-Host ('       Nu am putut descarca '+$n) } }"
:fontok
where claude >nul 2>nul
if errorlevel 1 (
  echo  [5/6] Instalez componenta Claude...
  call npm install -g @anthropic-ai/claude-code@2.1.268
  if errorlevel 1 goto :err
) else (
  echo  [5/6] Componenta Claude: OK
)
where codex >nul 2>nul
if errorlevel 1 (
  echo        Instalez Codex CLI - optional: imagini ChatGPT din abonamentul tau, fara API...
  call npm install -g @openai/codex
  if errorlevel 1 echo        Codex nu s-a instalat; aplicatia merge si doar cu Canva.
)
echo  [6/6] Pornire automata cu Windows si scurtatura pe Desktop...
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
del "%STARTUP%\Tiparnita.vbs" >nul 2>nul
del "%USERPROFILE%\Desktop\Tiparnita.url" >nul 2>nul
> "%STARTUP%\WonderPages.vbs" echo CreateObject("WScript.Shell").Run "cmd /c ""%~dp0porneste.bat"" ascuns", 0, False
del "%USERPROFILE%\Desktop\WonderPages.url" >nul 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$l=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\WonderPages.lnk'); $l.TargetPath='wscript.exe'; $l.Arguments='\"%~dp0deschide.vbs\"'; $l.WorkingDirectory='%~dp0'; $l.IconLocation='%SystemRoot%\System32\shell32.dll,13'; $l.Save()" >nul 2>nul
echo.
echo  ------------------------------------------------------------
echo   Ultimul pas, o singura data: autentificarea Claude (Pro).
echo   Se deschide fereastra oficiala Claude. Alege contul Claude,
echo   confirma in browser, apoi scrie /exit si inchide fereastra.
echo  ------------------------------------------------------------
choice /c DN /m "  Deschid autentificarea acum?"
if errorlevel 2 goto :start
start "Claude - autentificare" /wait cmd /c claude
:start
echo.
echo  Gata! Pornesc aplicatia in fundal, fara fereastra. De acum porneste singura cu Windows.
echo  Scurtatura WonderPages de pe Desktop o deschide oricand; opreste.bat o opreste.
wscript "%~dp0deschide.vbs"
echo  Astept sa porneasca aplicatia, pana la 2 minute. Nu inchide fereastra...
set /a waited=0
:waitapp
curl -s -o nul http://localhost:4321/api/state >nul 2>nul
if not errorlevel 1 goto appok
set /a waited+=5
if %waited% geq 120 goto appfail
timeout /t 5 /nobreak >nul
goto waitapp
:appok
echo.
echo  OK: aplicatia ruleaza la http://localhost:4321 si s-a deschis in browser.
echo  De acum o deschizi cu scurtatura WonderPages de pe Desktop.
goto done
:appfail
echo.
echo  Aplicatia nu a raspuns inca. Verifica:
echo   1. Docker Desktop e pornit si scrie Engine running.
echo   2. Asteapta un minut, apoi dublu-clic pe scurtatura WonderPages de pe Desktop.
echo  Ultimele randuri din jurnal, wonderpages.log:
powershell -NoProfile -Command "if (Test-Path '%~dp0wonderpages.log') { Get-Content '%~dp0wonderpages.log' -Tail 15 }"
:done
echo.
echo  Poti inchide aceasta fereastra.
exit /b
:err
echo.
echo  A aparut o eroare. Trimite-mi textul de mai sus si te ajut.
echo  Fereastra ramane deschisa ca sa poti copia mesajul.
