@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Projet PDWN - Mini plateforme omnicanale ===
echo.
echo Dossier : %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js introuvable dans le PATH.
  echo Installez le MSI LTS depuis https://nodejs.org
  echo Puis FERMEZ cette fenetre et double-cliquez start.bat a nouveau.
  pause
  exit /b 1
)

if not exist "%~dp0server.js" (
  echo [ERREUR] Fichier server.js introuvable ici :
  echo   %~dp0
  echo Relancez start.bat depuis le dossier projet\kit\
  pause
  exit /b 1
)

node "%~dp0server.js"
echo.
echo Code sortie : %ERRORLEVEL%
pause
