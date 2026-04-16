@echo off
title Nexora Local Server
echo ==============================================
echo        Starting Nexora Course Platform
echo ==============================================
echo.
echo Launching local server...
echo The project will open automatically in your browser.
echo.
echo (Press CTRL+C in this window to stop the server at any time)
echo.

:: Open the default browser to the localhost port
start http://localhost:8000

:: Run the python http server
python -m http.server 8000

pause
