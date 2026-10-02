@echo off
chcp 65001 >nul
rem Deschide portul aplicatiei in firewall-ul Windows, doar pentru retele private (Wi-Fi-ul de acasa).
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
netsh advfirewall firewall delete rule name="WonderPages.AI" >nul 2>&1
netsh advfirewall firewall add rule name="WonderPages.AI" dir=in action=allow protocol=TCP localport=4321 profile=private
echo.
echo  Gata. Telefonul si tableta de pe acelasi Wi-Fi pot deschide aplicatia.
echo  Porneste accesul si alege codul in Setari.
pause
