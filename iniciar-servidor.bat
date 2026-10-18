@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Iniciando Hanzi Lab en http://localhost:8080
echo Deja esta ventana abierta mientras estudias. Para cerrar, presiona Ctrl+C.
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080/index.html
  python -m http.server 8080
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080/index.html
  py -m http.server 8080
  goto :eof
)
echo No se encontro Python. Instalalo desde https://www.python.org/downloads/ (marca "Add python.exe to PATH")
echo o abre index.html con doble clic: tambien funciona, sin instalar la aplicacion.
pause
