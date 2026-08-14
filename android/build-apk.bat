@echo off
set JAVA_HOME=D:\jdk17
set PATH=D:\jdk17\bin;%PATH%
cd /d "%~dp0"
call gradlew.bat assembleRelease --no-daemon