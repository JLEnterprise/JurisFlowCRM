@echo off
chcp 65001 >nul
title JurisFlow - Publicar no GitHub / Vercel
cd /d "%~dp0"

echo ==========================================
echo   JurisFlow CRM - Publicar alteracoes
echo ==========================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Git nao encontrado. Instale em https://git-scm.com
  pause
  exit /b 1
)

echo Arquivos alterados:
git status --short
echo.

git status --porcelain | findstr . >nul
if errorlevel 1 (
  echo Nada para publicar. Tudo ja esta atualizado.
  pause
  exit /b 0
)

set "MSG="
set /p MSG="Descreva a alteracao (Enter = 'atualizacao'): "
if "%MSG%"=="" set "MSG=atualizacao"

echo.
echo Testando o build antes de publicar...
call npm run build
if errorlevel 1 (
  echo.
  echo [ERRO] O build falhou. Nada foi publicado. Copie o erro acima e mande para o Claude.
  pause
  exit /b 1
)

echo.
git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo [ERRO] Falha no commit.
  pause
  exit /b 1
)

echo.
echo Enviando para o GitHub...
git pull --rebase origin main
git push origin main
if errorlevel 1 (
  echo.
  echo [ERRO] Falha no push. Copie o erro acima e mande para o Claude.
  pause
  exit /b 1
)

echo.
echo ==========================================
echo   Publicado! A Vercel vai atualizar o site
echo   em 1-2 minutos: https://juris-flow-adv.vercel.app
echo ==========================================
pause
