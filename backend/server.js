const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Papa = require('papaparse');
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
  console.log(`  POST /api/filter-courses - 篩選課程`);
  console.log(`  GET /api/health - 健康檢查`);
}); 