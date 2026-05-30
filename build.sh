#!/bin/bash

echo "开始构建微信小程序..."

# 1. 运行 uni-app 构建
echo "1. 构建 uni-app..."
npm run build:mp-weixin

# 2. 复制云函数到 dist 目录
echo "2. 复制云函数..."
cp -r cloudfunctions dist/dev/mp-weixin/

# 3. 复制 project.config.json（如果存在）
if [ -f "project.config.json" ]; then
  echo "3. 复制 project.config.json..."
  cp project.config.json dist/dev/mp-weixin/
fi

echo "构建完成！"
echo "请在微信开发者工具中打开: dist/dev/mp-weixin"
