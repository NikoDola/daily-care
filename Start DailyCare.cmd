@echo off
cd /d "%~dp0"
echo.
echo DailyCare - local screenshot preview
echo.
echo Phone screen: http://127.0.0.1:4173/care.html
echo Review:       http://127.0.0.1:4173/review.html?sample=1
echo All screens:  http://127.0.0.1:4173
echo.
echo Keep this window open while using the app. Press Ctrl+C to stop.
echo.
node server.js
if errorlevel 1 pause
