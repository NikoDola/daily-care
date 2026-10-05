@echo off
cd /d "%~dp0"
echo.
echo DailyCare - Next.js preview
echo.
echo Phone screen: http://127.0.0.1:3000/
echo Review:       http://127.0.0.1:3000/review.html?sample=1
echo.
echo Keep this window open while using the app. Press Ctrl+C to stop.
echo.
npm run dev
if errorlevel 1 pause
