@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Adivinhacao Biblica

REM Este arquivo vive em scripts\, entao a raiz do projeto e um nivel acima.
set "RAIZ=%~dp0.."
set "SERVIDOR=%RAIZ%\server"
set "CLIENTE=%RAIZ%\client"
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
  echo  [1/5] Instalando dependencias do servidor...
  pushd "%SERVIDOR%"
  call npm install
  if errorlevel 1 ( popd & echo ERRO: falha ao instalar as dependencias do servidor. & pause & exit /b 1 )
  popd
) else (
  echo  [1/5] Dependencias do servidor OK.
)

if not exist "%CLIENTE%\node_modules" (
  echo  [2/5] Instalando dependencias do frontend...
  pushd "%CLIENTE%"
  call npm install
  if errorlevel 1 ( popd & echo ERRO: falha ao instalar as dependencias do frontend. & pause & exit /b 1 )
  popd
) else (
  echo  [2/5] Dependencias do frontend OK.
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
if exist "%SERVIDOR%\data\database.sqlite" (
  echo  [3/5] Banco de dados ja existe.
) else (
  echo  [3/5] Criando o banco e populando as perguntas...
  pushd "%SERVIDOR%"
  call npm run seed
  if errorlevel 1 ( popd & echo ERRO: falha ao popular o banco. & pause & exit /b 1 )
  popd
)

REM ---------- Administrador ----------
REM Nao existe cadastro publico: as contas sao criadas pelo admin. Sem este
REM passo, quem installasse o projeto pela primeira vez ficaria sem nenhuma
REM conta e sem nenhum caminho para entrar. O comando e idempotente: se ja
REM existe admin, ele so avisa e sai com codigo 0.
echo  [4/5] Verificando o administrador...
set "ARQ_ADMIN=%TEMP%\jeova-criar-admin.txt"
pushd "%SERVIDOR%"
call npm run criar:admin > "%ARQ_ADMIN%" 2>&1
popd
findstr /C:"SENHA DO ADMINISTRADOR" "%ARQ_ADMIN%" >nul
if not errorlevel 1 (
  echo.
  type "%ARQ_ADMIN%"
  echo   ^<- Anote a senha antes de continuar. Ela nao aparece de novo.
  echo.
  pause
  del /q "%ARQ_ADMIN%" >nul 2>&1
) else (
  echo       Administrador ja cadastrado.
  del /q "%ARQ_ADMIN%" >nul 2>&1
)

REM ---------- Aviso de porta ocupada ----------
REM A sub-rotina devolve errorlevel 0 quando a porta ESTA ocupada (findstr
REM encontrou a linha do netstat) e 1 quando esta livre. A condicao abaixo
REM esta ao contrario: ela avisava "porta em uso" justamente quando a porta
REM estava livre, e calava na unica situacao que precisava de aviso.
call :porta_ocupada %API_PORT%
if not errorlevel 1 (
  echo.
  echo   AVISO: a porta %API_PORT% ja esta em uso por outro programa.
  echo   A API pode nao subir. Se for o Adivinhacao Biblica, use a opcao 1.
  echo.
)

REM ---------- Subir os servicos ----------
echo  [5/5] Subindo a API e o frontend...
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
