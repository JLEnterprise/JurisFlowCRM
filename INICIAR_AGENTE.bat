@echo off
chcp 65001 >nul
title JurisFlow CRM - Sistema Juridico Comercial
color 0b
cls

echo ===================================================================
echo                     JURISFLOW CRM - SISTEMA JURIDICO
echo                   Conectado ao Supabase Cloud Database
echo ===================================================================
echo.

cd /d "%~dp0"

echo [*] Abrindo o JurisFlow CRM no seu navegador...
start http://localhost:3000/

echo [*] Servidor Vite ativo na porta 3000...
echo.
echo ===================================================================
echo   Sistema ATIVO em: http://localhost:3000/
echo   Para encerrar o CRM a qualquer momento, basta fechar esta janela.
echo ===================================================================
echo.

call npm run dev
pause
