#!/bin/bash

echo "🚀 啟動課程排程系統服務..."

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: 未安裝 Node.js"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi

# 檢查 Python 是否安裝
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤: 未安裝 Python3"
    echo "請先安裝 Python3"
    exit 1
fi

# 檢查後端依賴是否安裝
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安裝後端依賴..."
    cd backend
    npm install
    cd ..
fi

echo "🔧 啟動後端 API 服務器 (端口 3000)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "🌐 啟動前端服務器 (端口 8000)..."
cd frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服務啟動完成！"
echo "📱 前端: http://localhost:8000"
echo "🔌 後端 API: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
trap "echo ''; echo '🛑 停止服務...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# 保持腳本運行
wait
