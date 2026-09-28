@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Adivinhacao Biblica

set "RAIZ=%~dp0"
set "SERVIDOR=%RAIZ%server"
set "CLIENTE=%RAIZ%client"
set "API_PORT=3002"
set "WEB_PORT=5173"

:menu
cls
echo.
echo  ============================================
echo    ADIVINHACAO BIBLICA
echo  ============================================
echo.
echo    O que voce deseja fazer?
echo.
echo    [1] Reiniciar  - encerra os servicos atuais e sobe tudo de novo
echo    [2] Encerrar   - mata os servicos e sai
echo    [3] Iniciar    - sobe sem encerrar nada
echo.
choice /C 123 /N /M "    Escolha uma opcao [1-3]: "

if errorlevel 3 goto so_iniciar
if errorlevel 2 goto so_encerrar
if errorlevel 1 goto so_reiniciar
goto menu


:so_reiniciar
echo.
echo  Encerrando os servicos atuais...
call :encerrar %API_PORT%
call :encerrar %WEB_PORT%
timeout /t 2 /nobreak >nul
goto :iniciar


:so_encerrar
cls
echo.
echo  ============================================
echo    Encerrando os servicos
echo  ============================================
echo.
call :encerrar %API_PORT%
call :encerrar %WEB_PORT%
echo.
echo   Servicos encerrados.
timeout /t 3 /nobreak >nul
exit /b 0


:so_iniciar
goto :iniciar


:iniciar
cls
echo.
echo  ============================================
echo    ADIVINHACAO BIBLICA - iniciando
echo  ============================================
echo.

REM ---------- Dependencias ----------
if not exist "%SERVIDOR%\node_modules" (
  echo  [1/4] Instalando dependencias do servidor...
  pushd "%SERVIDOR%"
  call npm install
  if errorlevel 1 ( popd & echo ERRO: falha ao instalar as dependencias do servidor. & pause & exit /b 1 )
  popd
) else (
  echo  [1/4] Dependencias do servidor OK.
)

if not exist "%CLIENTE%\node_modules" (
  echo  [2/4] Instalando dependencias do frontend...
  pushd "%CLIENTE%"
  call npm install
  if errorlevel 1 ( popd & echo ERRO: falha ao instalar as dependencias do frontend. & pause & exit /b 1 )
  popd
) else (
  echo  [2/4] Dependencias do frontend OK.
)

REM ---------- Variaveis de ambiente ----------
if not exist "%SERVIDOR%\.env" (
  echo       Criando server\.env a partir do exemplo...
  copy /y "%SERVIDOR%\.env.example" "%SERVIDOR%\.env" >nul
)
if not exist "%CLIENTE%\.env" (
  echo       Criando client\.env a partir do exemplo...
  copy /y "%CLIENTE%\.env.example" "%CLIENTE%\.env" >nul
)

REM ---------- Banco de dados ----------
if exist "%SERVIDOR%\database.sqlite" (
  echo  [3/4] Banco de dados ja existe.
) else (
  echo  [3/4] Criando o banco e populando as perguntas...
  pushd "%SERVIDOR%"
  call npm run seed
  if errorlevel 1 ( popd & echo ERRO: falha ao popular o banco. & pause & exit /b 1 )
  popd
)

REM ---------- Aviso de porta ocupada ----------
call :porta_ocupada %API_PORT%
if errorlevel 1 (
  echo.
  echo   AVISO: a porta %API_PORT% ja esta em uso por outro programa.
  echo   A API pode nao subir. Se for o Adivinhacao Biblica, use a opcao 1.
  echo.
)

REM ---------- Subir os servicos ----------
echo  [4/4] Subindo a API e o frontend...
echo.
start "Adivinhacao - API" cmd /k "cd /d "%SERVIDOR%" && node server.js"
timeout /t 2 /nobreak >nul
start "Adivinhacao - Web" cmd /k "cd /d "%CLIENTE%" && npm run dev"

echo  ============================================
echo    API       http://localhost:%API_PORT%/api/health
echo    Frontend  http://localhost:%WEB_PORT%
echo.
echo    Para encerrar, feche as duas janelas
echo    ou execute iniciar.bat e escolha [2].
echo  ============================================
echo.
start "" "http://localhost:%WEB_PORT%"
echo  Navegador aberto. Bom jogo!
timeout /t 8 /nobreak >nul
exit /b 0


REM ============================================
REM  Sub-rotinas
REM ============================================

:encerrar
set "PORTA=%~1"
set "MATOU="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORTA% .*LISTENING" 2^>nul') do (
  if not "%%P"=="0" (
    taskkill /F /PID %%P >nul 2>&1
    if not errorlevel 1 set "MATOU=sim"
  )
)
if defined MATOU (
  echo       Porta %PORTA% liberada.
) else (
  echo       Nada rodando na porta %PORTA%.
)
goto :eof


:porta_ocupada
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul 2>&1
goto :eof
