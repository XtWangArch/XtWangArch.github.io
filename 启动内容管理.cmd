@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  node scripts\admin-server.cjs
) else (
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\admin-server.cjs
)
pause
