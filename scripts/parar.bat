@echo off
chcp 65001 >nul
title Adivinhacao Biblica - Encerrar

echo.
echo  ============================================
echo    Encerrando os servicos do
echo    Adivinhacao Biblica
echo  ============================================
echo.

call :encerrar 3002
call :encerrar 5173

echo.
echo   Servicos encerrados.
timeout /t 3 /nobreak >nul
exit /b 0

:encerrar
set "PORTA=%~1"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORTA% .*LISTENING" 2^>nul') do (
  if not "%%P"=="0" taskkill /F /PID %%P >nul 2>&1
)
goto :eof
