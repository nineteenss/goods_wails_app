@echo off
setlocal enabledelayedexpansion

REM Args: %1=PID, %2=EXE, %3=NEW, %4=LOG (optional)
set "PID=%~1"
set "EXE=%~2"
set "NEW=%~3"
set "LOG=%~4"
if "%LOG%"=="" set "LOG=%~dp2wails_updater.log"

echo [%date% %time%] updater started>>"%LOG%"

REM Wait up to 30s for NEW to exist (in case caller triggers before rename completes)
for /l %%w in (1,1,30) do (
  if exist "%NEW%" goto have_new
  timeout /t 1 /nobreak >nul
)
echo [%date% %time%] no .new found>>"%LOG%"
goto end

:have_new

:wait
tasklist /FI "PID eq %PID%" | find "%PID%" >nul
if %errorlevel%==0 (timeout /t 1 /nobreak >nul & goto wait)

for /l %%i in (1,1,60) do (
  echo [%date% %time%] attempt %%i>>"%LOG%"
  del /f /q "%EXE%.old" >>"%LOG%" 2>>&1
  move /y "%EXE%" "%EXE%.old" >>"%LOG%" 2>>&1
  if exist "%EXE%.old" (
    move /y "%NEW%" "%EXE%" >>"%LOG%" 2>>&1
    if exist "%EXE%" (
      del /f /q "%EXE%.old" >>"%LOG%" 2>>&1
      echo [%date% %time%] success>>"%LOG%"
      start "" "%EXE%"
      goto end
    )
  )
  timeout /t 1 /nobreak >nul
)

echo [%date% %time%] failed after retries>>"%LOG%"

:end
exit /b


