@echo off
setlocal

set "PROJECT_ROOT=%~dp0.."
set "NEXT_BIN=%PROJECT_ROOT%\node_modules\next\dist\bin\next"

if not exist "%NEXT_BIN%" (
  echo Next.js is not installed. Run npm install first, then retry this script.
  exit /b 1
)

where node >nul 2>nul
if %errorlevel%==0 (
  set "NODE_CMD=node"
) else (
  set "NODE_CMD=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)

if not exist "%NODE_CMD%" (
  if not "%NODE_CMD%"=="node" (
    echo Node.js was not found on PATH and the Codex bundled Node.js runtime was not found.
    exit /b 1
  )
)

echo Starting LogisticsLink at http://localhost:3001
echo Press Ctrl+C to stop the server.
"%NODE_CMD%" "%NEXT_BIN%" dev -p 3001
