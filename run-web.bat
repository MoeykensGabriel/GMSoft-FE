@echo off
REM ---------------------------------------------------------------
REM  GMSoft - arranca el frontend en modo desarrollo.
REM ---------------------------------------------------------------
title GMSoft Web

REM Ubicarse en la carpeta del script, sin importar desde donde se lo llame.
cd /d "%~dp0"

REM Sin dependencias instaladas vite no arranca, y el error que tira no dice
REM que lo unico que falta es un npm install.
if not exist "node_modules" (
    echo.
    echo   Primer arranque: instalando dependencias. Tarda un rato.
    echo.
    call npm install
)

echo.
echo   GMSoft Web
echo   App: http://localhost:3000
echo   Necesita la API levantada en http://localhost:5142
echo   Para cortar: Ctrl+C
echo.

REM npm es un .cmd: sin "call" el control no vuelve a este script y todo lo de
REM abajo, incluido el aviso de error, no se ejecuta nunca.
call npm run dev

if errorlevel 1 (
    echo.
    echo   *** El front termino con error. Revisa el detalle arriba. ***
    echo.
    echo   Lo mas comun:
    echo     - El puerto 3000 ya esta ocupado por otra app.
    echo     - Falta el archivo .env con VITE_API_URL.
    echo.
)

pause
