@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

set "ROOT=%~dp0"
set "FRONT=%ROOT%frontend"
set "OUT=%FRONT%\dist-apk"
set "APK_SRC=%FRONT%\android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%FRONT%\android\app\build\outputs\apk\debug\Jarvis-debug.apk" set "APK_SRC=%FRONT%\android\app\build\outputs\apk\debug\Jarvis-debug.apk"

if not defined ANDROID_HOME (
  if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
)
if defined ANDROID_HOME set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not defined GRADLE_USER_HOME set "GRADLE_USER_HOME=%LOCALAPPDATA%\gradle-home"

echo.
echo  Jarvis APK Build (on-device)
echo  ----------------------------

where node >nul 2>&1
if errorlevel 1 (
  echo [!] Node.js fehlt.
  exit /b 1
)

pushd "%FRONT%"
call npm install
if errorlevel 1 goto fail
call npm run build
if errorlevel 1 goto fail
if not exist "android\gradlew.bat" (
  call npx cap add android
  if errorlevel 1 goto fail
)
call npx cap sync android
if errorlevel 1 goto fail
call node scripts\apply-native-tv.mjs
if errorlevel 1 goto fail
popd

pushd "%FRONT%\android"
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (
  popd
  goto fail
)
popd

if not exist "%APK_SRC%" (
  echo [!] APK nicht gefunden: %APK_SRC%
  exit /b 1
)
if not exist "%OUT%" mkdir "%OUT%"
copy /Y "%APK_SRC%" "%OUT%\jarvis-debug.apk" >nul
echo.
echo  Fertig: %OUT%\jarvis-debug.apk
exit /b 0

:fail
echo [!] APK-Build fehlgeschlagen.
exit /b 1
