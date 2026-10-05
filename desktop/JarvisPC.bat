@echo off
title Jarvis PC
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0JarvisPC.ps1"
if errorlevel 1 pause
