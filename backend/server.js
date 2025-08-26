const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// IP 限制中間件
function restrictToAdminIP(req, res, next) {
  const clientIP = req.ip;
  
  const adminIPs = process.env.ADMIN_IP;
  
  if (!adminIPs) {
    return res.status(500).json({ error: 'Admin IP not configured' });
  }
  
  // 處理可能的 IPv6 mapped IPv4 地址
  const normalizedClientIP = clientIP.replace(/^::ffff:/, '');
  
  // 分割多個 IP 地址（用逗號或分號分隔）
  const allowedIPs = adminIPs.split(/[,;]/).map(ip => ip.trim());
  
  // 檢查客戶端 IP 是否在允許的 IP 列表中
  const isAllowed = allowedIPs.includes(normalizedClientIP);
  
  if (!isAllowed) {
    console.log(`Access denied for IP: ${normalizedClientIP}. Allowed IPs: ${allowedIPs.join(', ')}`);
    return res.status(403).json({ 
      error: `Access denied for ip ${normalizedClientIP}`,
    });
  }
  
  console.log(`Access granted for IP: ${normalizedClientIP}`);
  next();
}

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 設置 trust proxy 以正確獲取客戶端 IP
app.set('trust proxy', true);

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

// 檔案名稱解析函數
function parseYearSemester(filename) {
  // 嘗試從檔案名稱中解析年份學期，例如: "114-1.xlsx", "courses_114_1.csv"
  const match = filename.match(/(\d{3})[-_](\d)/); 
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return null;
}

// 確保目錄存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// API 路由
app.post('/api/upload-csv', restrictToAdminIP, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳檔案' });
    }
    
    const yearSemester = parseYearSemester(req.file.originalname);
    if (!yearSemester) {
      return res.status(400).json({ error: '檔案名稱必須包含年份學期資訊，例如：114-1.csv 或 courses_114_1.csv' });
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
    
    // 儲存檔案到 courses_data/<year-semester>/
    const dataDir = path.join(__dirname, '..', 'courses_data', yearSemester);
    ensureDirectoryExists(dataDir);
    const csvFilePath = path.join(dataDir, req.file.originalname);
    fs.writeFileSync(csvFilePath, csvData);
    
    const processedData = processCourseData(result.data);
    
    res.json({
      success: true,
      data: result.data,
      groupedCourses: processedData,
      totalCourses: result.data.length,
      errors: result.errors, // 返回錯誤資訊但不中斷
      yearSemester: yearSemester,
      savedPath: csvFilePath
    });
  } catch (error) {
    console.error('檔案處理錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

app.post('/api/upload-json', restrictToAdminIP, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳檔案' });
    }
    
    const yearSemester = parseYearSemester(req.file.originalname);
    if (!yearSemester) {
      return res.status(400).json({ error: '檔案名稱必須包含年份學期資訊，例如：114-1.json 或 courses_114_1.json' });
    }
    
    const jsonData = req.file.buffer.toString();
    const data = JSON.parse(jsonData);
    
    // 假設 JSON 格式是 { courses: [...] }
    const courses = data.courses || data;
    
    // 儲存檔案到 courses_data/<year-semester>/
    const dataDir = path.join(__dirname, '..', 'courses_data', yearSemester);
    ensureDirectoryExists(dataDir);
    const jsonFilePath = path.join(dataDir, req.file.originalname);
    fs.writeFileSync(jsonFilePath, jsonData);
    
    const processedData = processCourseData(courses);
    
    res.json({
      success: true,
      data: courses,
      groupedCourses: processedData,
      totalCourses: courses.length,
      yearSemester: yearSemester,
      savedPath: jsonFilePath
    });
  } catch (error) {
    console.error('JSON 處理錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// Excel 檔案上傳處理
app.post('/api/upload-excel', restrictToAdminIP, upload.single('file'), (req, res) => {
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
    
    const yearSemester = parseYearSemester(req.file.originalname);
    if (!yearSemester) {
      return res.status(400).json({ error: '檔案名稱必須包含年份學期資訊，例如：114-1.xlsx 或 selection_114_1.xlsx' });
    }
    
    // 儲存檔案到 courses_data/<year-semester>/
    const dataDir = path.join(__dirname, '..', 'courses_data', yearSemester);
    ensureDirectoryExists(dataDir);
    const excelFilePath = path.join(dataDir, req.file.originalname);
    fs.writeFileSync(excelFilePath, req.file.buffer);
    
    console.log('Excel 資料處理完成:', jsonData.length, '筆資料');
    
    res.json({
      success: true,
      data: jsonData,
      totalRows: jsonData.length,
      headers: headers,
      yearSemester: yearSemester,
      savedPath: excelFilePath
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

// 讀取課程資料 API
app.get('/im/:yearSemester', (req, res) => {
  try {
    const { yearSemester } = req.params;
    
    // 驗證年份學期格式
    if (!/^\d{3}-\d$/.test(yearSemester)) {
      return res.status(400).json({ error: '年份學期格式錯誤，應為 XXX-X 格式，例如：114-1' });
    }
    
    const dataDir = path.join(__dirname, '..', 'courses_data', yearSemester);
    
    if (!fs.existsSync(dataDir)) {
      return res.status(404).json({ error: `找不到 ${yearSemester} 學期的課程資料` });
    }
    
    // 讀取目錄中的 CSV 和 Excel 檔案
    const files = fs.readdirSync(dataDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    let courseData = [];
    let selectionData = [];
    
    // 讀取 CSV 檔案（課程資料）
    for (const csvFile of csvFiles) {
      const csvFilePath = path.join(dataDir, csvFile);
      const csvContent = fs.readFileSync(csvFilePath, 'utf8');
      const result = Papa.parse(csvContent, { 
        header: true,
        skipEmptyLines: true
      });
      courseData = courseData.concat(result.data);
    }
    
    // 讀取 Excel 檔案（選別資料）
    for (const excelFile of excelFiles) {
      const excelFilePath = path.join(dataDir, excelFile);
      const workbook = XLSX.read(fs.readFileSync(excelFilePath), { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // 尋找標題行
      let headers = null;
      let rows = null;
      
      for (let i = 1; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (row && Array.isArray(row)) {
          const hasCourseCode = row.some(cell => 
            cell && typeof cell === 'string' && (cell === '課程編號' || cell.includes('課程編號') || cell.includes('Course Code') || cell === '課號')
          );
          const hasSelection = row.some(cell => 
            cell && typeof cell === 'string' && (cell === '選別' || cell.includes('選別') || cell.includes('Selection'))
          );
          
          if (hasCourseCode && hasSelection) {
            headers = row;
            rows = data.slice(i + 1);
            break;
          }
        }
      }
      
      if (headers && rows) {
        const jsonData = rows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        selectionData = selectionData.concat(jsonData);
      }
    }
    
    const processedData = processCourseData(courseData);
    
    res.json({
      success: true,
      yearSemester: yearSemester,
      courseData: courseData,
      selectionData: selectionData,
      groupedCourses: processedData,
      totalCourses: courseData.length,
      files: { csvFiles, excelFiles }
    });
    
  } catch (error) {
    console.error('讀取課程資料錯誤:', error);
    res.status(500).json({ error: '讀取課程資料錯誤: ' + error.message });
  }
});

// 路由處理 - 確保年份學期格式正確，避免與靜態檔案衝突
app.get('/courses/:yearSemester(\\d{3}-\\d)', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'courses.html'));
});

// 管理員頁面路由 - 也需要 IP 限制
app.get('/admin', restrictToAdminIP, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'upload.html'));
});

// 取得可用學期清單
app.get('/api/available-semesters', (req, res) => {
  try {
    const coursesDataDir = path.join(__dirname, '..', 'courses_data');
    
    // 檢查 courses_data 目錄是否存在
    if (!fs.existsSync(coursesDataDir)) {
      return res.json({
        success: true,
        semesters: [],
        message: 'No courses data directory found'
      });
    }
    
    // 讀取目錄中的所有項目
    const items = fs.readdirSync(coursesDataDir, { withFileTypes: true });
    
    // 篩選出符合年份學期格式的目錄
    const semesters = items
      .filter(item => item.isDirectory()) // 只要目錄
      .map(item => item.name)
      .filter(name => /^\d{3}-\d$/.test(name)) // 符合 XXX-X 格式
      .map(semester => {
        const semesterDir = path.join(coursesDataDir, semester);
        const files = fs.readdirSync(semesterDir);
        const hasData = files.length > 0;
        
        // 解析學期資訊
        const [year, sem] = semester.split('-');
        const academicYear = parseInt(year);
        const semesterNumber = parseInt(sem);
        
        return {
          id: semester,
          name: `${academicYear} 學年度第 ${semesterNumber} 學期`,
          hasData: hasData
        };
      })
      .sort((a, b) => {
        // 按學期排序：先按學年，再按學期數
        const [aYear, aSem] = a.id.split('-').map(Number);
        const [bYear, bSem] = b.id.split('-').map(Number);
        
        if (aYear !== bYear) {
          return bYear - aYear; // 較新的學年在前
        }
        return bSem - aSem; // 第二學期在第一學期之後
      });
    
    res.json({
      success: true,
      semesters: semesters,
      total: semesters.length
    });
    
  } catch (error) {
    console.error('取得可用學期錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '無法取得可用學期清單: ' + error.message 
    });
  }
});

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
  console.log(`頁面端點:`);
  console.log(`  GET / - 首頁`);
  console.log(`  GET /admin - 管理員上傳頁面 (僅限管理員 IP)`);
  console.log(`  GET /courses/:yearSemester - 課程表頁面`);
  console.log(`API 端點:`);
  console.log(`  GET /api/available-semesters - 取得可用學期清單`);
  console.log(`  POST /api/upload-csv - 上傳 CSV 檔案 (僅限管理員 IP)`);
  console.log(`  POST /api/upload-json - 上傳 JSON 檔案 (僅限管理員 IP)`);
  console.log(`  POST /api/upload-excel - 上傳 Excel 檔案 (僅限管理員 IP)`);
  console.log(`  GET /im/:yearSemester - 讀取課程資料`);
  console.log(`  POST /api/filter-courses - 篩選課程`);
  console.log(`  GET /api/health - 健康檢查`);
  console.log(`資料儲存位置: courses_data/<year-semester>/`);
}); 
