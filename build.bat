@echo off
echo 开始构建微信小程序...

REM 1. 运行 uni-app 构建
echo 1. 构建 uni-app...
call npm run build:mp-weixin

REM 2. 复制云函数到 dist 目录
echo 2. 复制云函数...
xcopy /E /I /Y cloudfunctions dist\dev\mp-weixin\cloudfunctions

REM 3. 复制 project.config.json（如果存在）
if exist project.config.json (
  echo 3. 复制 project.config.json...
  copy /Y project.config.json dist\dev\mp-weixin\
)

echo 构建完成！
echo 请在微信开发者工具中打开: dist\dev\mp-weixin
pause
