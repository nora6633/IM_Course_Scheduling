const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 設置檔案上傳
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 課程資料處理函數
function parseCourseTimes(timeStr) {
  if (!timeStr) return [];
  return timeStr.split(',').map(t => {
    const m = t.match(/(\d)([a-zA-Z]+)/);
    if (!m) return null;
    return { dayIdx: parseInt(m[1], 10) - 1, periods: m[2].toUpperCase().split('') };
  }).filter(Boolean);
}

function processCourseData(data) {
  const groupedCourses = {};
  
  data.forEach(course => {
    if (!course['課程名稱']) return;
    
    const times = parseCourseTimes(course['上課時間']);
    times.forEach(({ dayIdx, periods }) => {
      if (periods.length === 0) return;
      const startPeriod = periods[0];
      const key = `${dayIdx}-${startPeriod}`;
      
      if (!groupedCourses[key]) {
        groupedCourses[key] = [];
      }
      groupedCourses[key].push({ ...course, periods });
    });
  });
  
  return groupedCourses;
}

// API 路由
app.post('/api/upload-csv', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳檔案' });
    }
    
    const csvData = req.file.buffer.toString();
    const result = Papa.parse(csvData, { 
      header: true,
      skipEmptyLines: true
    });
    
    if (result.errors.length > 0) {
      console.log('CSV 解析錯誤:', result.errors);
      // 只記錄錯誤，不中斷處理
    }
    
    const processedData = processCourseData(result.data);
    
    res.json({
      success: true,
      data: result.data,
      groupedCourses: processedData,
      totalCourses: result.data.length,
      errors: result.errors // 返回錯誤資訊但不中斷
    });
  } catch (error) {
    console.error('檔案處理錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

app.post('/api/upload-json', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳檔案' });
    }
    
    const jsonData = req.file.buffer.toString();
    const data = JSON.parse(jsonData);
    
    // 假設 JSON 格式是 { courses: [...] }
    const courses = data.courses || data;
    
    const processedData = processCourseData(courses);
    
    res.json({
      success: true,
      data: courses,
      groupedCourses: processedData,
      totalCourses: courses.length
    });
  } catch (error) {
    console.error('JSON 處理錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// Excel 檔案上傳處理
app.post('/api/upload-excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳檔案' });
    }
    
    console.log('收到 Excel 檔案:', req.file.originalname, '大小:', req.file.size);
    
    // 讀取 Excel 檔案
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    console.log('Excel 工作表:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 轉換為 JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Excel 原始資料行數:', data.length);
    console.log('前5行資料:', data.slice(0, 5));
    
    if (data.length < 2) {
      return res.status(400).json({ error: 'Excel 檔案格式不正確，至少需要標題行和一行資料' });
    }
    
    // 跳過第一行，從第二行開始尋找標題行
    let headers = null;
    let rows = null;
    let headerRowIndex = -1;
    
    // 從第二行開始尋找標題行
    for (let i = 1; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && Array.isArray(row)) {
        // 檢查是否包含必要欄位
        const hasCourseCode = row.some(cell => 
          cell && typeof cell === 'string' && (cell === '課程編號' || cell.includes('課程編號') || cell.includes('Course Code') || cell === '課號')
        );
        const hasSelection = row.some(cell => 
          cell && typeof cell === 'string' && (cell === '選別' || cell.includes('選別') || cell.includes('Selection'))
        );
        
        if (hasCourseCode && hasSelection) {
          headers = row;
          headerRowIndex = i;
          rows = data.slice(i + 1);
          console.log(`找到標題行在第 ${i + 1} 行:`, headers);
          break;
        }
      }
    }
    
    if (!headers) {
      return res.status(400).json({ 
        error: `Excel 檔案必須包含「課程編號」和「選別」兩個欄位。\n前10行資料: ${JSON.stringify(data.slice(0, 10))}` 
      });
    }
    
    console.log('標題欄位:', headers);
    
    // 檢查必要欄位
    const courseCodeIndex = headers.findIndex(h => 
      h && (h === '課程編號' || h === '課號' || h.includes('課程編號') || h.includes('Course Code'))
    );
    const selectionIndex = headers.findIndex(h => 
      h && (h === '選別' || h.includes('選別') || h.includes('Selection'))
    );
    
    console.log('課程編號欄位索引:', courseCodeIndex, '選別欄位索引:', selectionIndex);
    
    if (courseCodeIndex === -1 || selectionIndex === -1) {
      return res.status(400).json({ 
        error: `Excel 檔案必須包含「課程編號」和「選別」兩個欄位。\n找到的欄位: ${headers.join(', ')}` 
      });
    }
    
    // 轉換為物件陣列
    const jsonData = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    console.log('Excel 資料處理完成:', jsonData.length, '筆資料');
    
    res.json({
      success: true,
      data: jsonData,
      totalRows: jsonData.length,
      headers: headers
    });
    
  } catch (error) {
    console.error('Excel 處理錯誤:', error);
    res.status(500).json({ error: 'Excel 檔案處理錯誤: ' + error.message });
  }
});

// 篩選課程 API
app.post('/api/filter-courses', (req, res) => {
  try {
    const { data, grade } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: '無效的資料格式' });
    }
    
    let filteredData = data;
    
    if (grade && grade !== 'all') {
      const gradeMap = {
        '1': '大一',
        '2': '大二', 
        '3': '大三',
        '4': '大四',
        'master': '碩士班'
      };
      
      const targetGrade = gradeMap[grade];
      if (targetGrade) {
        filteredData = data.filter(course => 
          course['開課年級'] === targetGrade || 
          course['開課年級'] === grade
        );
      }
    }
    
    const processedData = processCourseData(filteredData);
    
    res.json({
      success: true,
      data: filteredData,
      groupedCourses: processedData,
      totalCourses: filteredData.length,
      filter: grade
    });
  } catch (error) {
    console.error('篩選錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`後端伺服器運行在 http://localhost:${PORT}`);
  console.log(`API 端點:`);
  console.log(`  POST /api/upload-csv - 上傳 CSV 檔案`);
  console.log(`  POST /api/upload-json - 上傳 JSON 檔案`);
  console.log(`  POST /api/upload-excel - 上傳 Excel 檔案`);
  console.log(`  POST /api/filter-courses - 篩選課程`);
  console.log(`  GET /api/health - 健康檢查`);
}); 