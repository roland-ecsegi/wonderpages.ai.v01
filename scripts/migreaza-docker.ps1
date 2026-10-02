# Mută baza de date de sub numele vechi (tiparnita) sub numele WonderPages, fără pierdere de date.
# Rulează automat din instaleaza.bat; se poate rula de oricâte ori (nu face nimic dacă mutarea e deja făcută).
$ErrorActionPreference = 'Continue'   # Windows PowerShell 5.1: with 'Stop', any stderr line of docker would abort the script
Set-Location (Split-Path $PSScriptRoot -Parent)
function HasVolume([string]$name) { docker volume inspect $name *> $null; return ($LASTEXITCODE -eq 0) }
$envFile = Join-Path (Get-Location) '.env'
$lines = @(); if (Test-Path $envFile) { $lines = @(Get-Content $envFile) }
function SetKey([string]$k, [string]$v) {
  $found = $false
  for ($i = 0; $i -lt $script:lines.Count; $i++) { if ($script:lines[$i] -match "^$k=") { $script:lines[$i] = "$k=$v"; $found = $true } }
  if (-not $found) { $script:lines += "$k=$v" }
}
$old = 'tiparnita-local_tiparnita_pg'; $new = 'wonderpages_pg'
if ((HasVolume $old) -and -not (HasVolume $new)) {
  # Read the actual legacy credentials before changing either volume. Never guess a password.
  $taskAuth = @{}
  $taskInspect = docker inspect --format '{{json .Config.Env}}' tiparnita-db 2>$null
  if ($LASTEXITCODE -eq 0) {
    foreach ($taskEntry in ($taskInspect | ConvertFrom-Json)) {
      if ($taskEntry -match '^POSTGRES_(USER|PASSWORD|DB)=(.*)$') { $taskAuth[$Matches[1]] = $Matches[2] }
    }
  }
  if (-not $taskAuth['PASSWORD']) {
    $taskLegacyLine = @($lines | Where-Object { $_ -match '^DATABASE_URL=.*tiparnita' }) | Select-Object -Last 1
    if ($taskLegacyLine) {
      $taskUri = [Uri](($taskLegacyLine -replace '^DATABASE_URL=','').Trim('"',"'"))
      $taskUserInfo = $taskUri.UserInfo.Split(':',2)
      if ($taskUserInfo.Count -eq 2) {
        $taskAuth['USER'] = [Uri]::UnescapeDataString($taskUserInfo[0]); $taskAuth['PASSWORD'] = [Uri]::UnescapeDataString($taskUserInfo[1]); $taskAuth['DB'] = $taskUri.AbsolutePath.TrimStart('/')
      }
    }
  }
  if (-not $taskAuth['USER'] -or -not $taskAuth['PASSWORD'] -or -not $taskAuth['DB']) { throw 'Configuratia bazei vechi nu poate fi verificata. Pastreaza .env original sau containerul vechi; volumele nu au fost modificate.' }
  Write-Host '        Mut baza de date existenta sub numele nou WonderPages...'
  docker rm -f tiparnita-db *> $null
  docker volume create $new | Out-Null
  docker run --rm -v "${old}:/from" -v "${new}:/to" postgres:16-alpine sh -c "cp -a /from/. /to/"
  if ($LASTEXITCODE -ne 0) { docker volume rm $new *> $null; throw 'Copierea bazei de date nu a reusit. Volumul vechi e neatins.' }
  # the copied database keeps its original user and password
  $taskConnection = 'postgres://'+[Uri]::EscapeDataString($taskAuth['USER'])+':'+[Uri]::EscapeDataString($taskAuth['PASSWORD'])+'@127.0.0.1:5433/'+[Uri]::EscapeDataString($taskAuth['DB'])
  SetKey 'DATABASE_URL' $taskConnection
  SetKey 'PG_USER' $taskAuth['USER']; SetKey 'PG_PASSWORD' $taskAuth['PASSWORD']; SetKey 'PG_DB' $taskAuth['DB']
  Write-Host '        Gata. Volumul vechi ramane ca rezerva: il poti sterge din Docker Desktop (Volumes) dupa ce verifici aplicatia.'
} elseif (HasVolume $old) {
  docker rm -f tiparnita-db *> $null   # mutarea e facuta; containerul vechi nu mai are voie sa tina portul
}
SetKey 'DB_CONTAINER' 'wonderpages-db'
[IO.File]::WriteAllLines($envFile, [string[]]$lines)   # UTF-8 fara BOM
