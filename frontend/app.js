// API 配置
const API_BASE_URL = 'http://localhost:3000/api';

// 全域變數
let allCourses = [];
let currentFilter = 'all';
let currentData = null;

// 課程類型顏色映射
const typeColorMap = {
  '基礎院本課程必修': 'cell-college',
  '專業必修': 'cell-dept',
  '專業選修': 'cell-elective',
  '校必修': 'cell-must',
  '院必修': 'cell-college',
  '系必修': 'cell-dept',
  '技術次領域': 'cell-tech',
  '管理次領域': 'cell-mgmt',
};

// 星期和時段
const weekDays = ['一', '二', '三', '四', '五'];
const periods = ['A', 'B', 'C', 'D', 'Z', 'E', 'F', 'G', 'H', 'I', 'J'];

// 時段時間映射
const periodTimes = {
  'A': ['8:10', '9:00'],
  'B': ['9:10', '10:00'],
  'C': ['10:10', '11:00'],
  'D': ['11:10', '12:00'],
  'Z': ['12:10', '13:00'],
  'E': ['13:10', '14:00'],
  'F': ['14:10', '15:00'],
  'G': ['15:10', '16:00'],
  'H': ['16:10', '17:00'],
  'I': ['17:10', '18:00'],
  'J': ['18:10', '19:00']
};

// API 函數
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint = file.name.endsWith('.json') ? '/upload-json' : '/upload-csv';
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('檔案上傳錯誤:', error);
    throw error;
  }
}

async function filterCourses(data, grade) {
  try {
    const response = await fetch(`${API_BASE_URL}/filter-courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, grade })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('篩選課程錯誤:', error);
    throw error;
  }
}

// 解析課程時間
function parseCourseTimes(timeStr) {
  if (!timeStr) return [];
  return timeStr.split(',').map(t => {
    const m = t.match(/(\d)([a-zA-Z]+)/);
    if (!m) return null;
    return { dayIdx: parseInt(m[1], 10) - 1, periods: m[2].toUpperCase().split('') };
  }).filter(Boolean);
}

// 渲染課表
function renderSchedule(data) {
  const scheduleDiv = document.getElementById('schedule');
  scheduleDiv.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'schedule-table';

  // 建立表頭
  let thead = '<tr><th></th>' + weekDays.map(d => `<th>星期${d}</th>`).join('') + '</tr>';
  table.innerHTML = thead;

  const tableBody = document.createElement('tbody');

  // 建立表格內容
  for (let p of periods) {
    let timeBlock = '';
    if (periodTimes[p]) {
      timeBlock = `<span class="period-time">${periodTimes[p][0]}<br>-<br>${periodTimes[p][1]}</span>`;
    }

    if (p === 'Z') {
      // Z 列顯示午間休息，不合併儲存格
      let row = `<tr><th class="period-header">${p}<br>${timeBlock}</th>`;
      for (let d = 0; d < weekDays.length; d++) {
        row += `<td class="lunch-break">午間休息</td>`;
      }
      row += '</tr>';
      tableBody.innerHTML += row;
      continue;
    }

    let row = `<tr><th class="period-header">${p}<br>${timeBlock}</th>`;
    for (let d = 0; d < weekDays.length; d++) {
      row += `<td id="cell-${p}-${d}"></td>`;
    }
    row += '</tr>';
    tableBody.innerHTML += row;
  }
  table.appendChild(tableBody);

  // 分組課程
  const groupedCourses = {};
  data.forEach(course => {
    if (!course['課程名稱']) return;
    
    // 調試：檢查 Linux 課程
    if (course['課程名稱'].includes('Linux')) {
      console.log('找到 Linux 課程:', course['課程名稱'], '時間:', course['上課時間']);
    }
    
    // 調試：檢查專題課程（只顯示一次）
    if (course['課程名稱'].includes('資訊管理專題與個案') && course['班級'] === 'a') {
      console.log('找到專題課程:', course['課程名稱'], '時間:', course['上課時間']);
    }
    
    const times = parseCourseTimes(course['上課時間']);
    times.forEach(({ dayIdx, periods }) => {
      if (periods.length === 0) return;
      const startPeriod = periods[0];
      const key = `${dayIdx}-${startPeriod}`;
      
      if (!groupedCourses[key]) {
        groupedCourses[key] = [];
      }
      groupedCourses[key].push({ ...course, periods });
      
      // 調試：檢查 Linux 課程的分組
      if (course['課程名稱'].includes('Linux')) {
        console.log('Linux 課程分組到:', key, 'dayIdx:', dayIdx, 'periods:', periods);
      }
      
      // 調試：檢查專題課程的分組（只顯示一次）
      if (course['課程名稱'].includes('資訊管理專題與個案') && course['班級'] === 'a') {
        console.log('專題課程分組到:', key, 'dayIdx:', dayIdx, 'periods:', periods);
      }
    });
  });

  console.log('分組後的課程:', groupedCourses);

  // 渲染課程
  const cellsToRemove = new Set();
  
  for (const key in groupedCourses) {
    const originalCourses = groupedCourses[key];
    if (originalCourses.length === 0) continue;

    // 調試：檢查星期四 H 時段
    if (key === '3-H') {
      console.log('星期四 H 時段的課程:', originalCourses.map(c => c['課程名稱']));
    }

    let rowspan = 0;
    let longestCoursePeriods = [];
    for (const c of originalCourses) {
      if (c.periods && c.periods.length > rowspan) {
        rowspan = c.periods.length;
        longestCoursePeriods = c.periods;
      }
    }

    // 所有課程都正常顯示，不特殊處理專題課程
    const finalCourses = [...originalCourses];

    // 設置到對應的格子
    const dayIdx = parseInt(key.split('-')[0], 10);
    const startPeriod = key.split('-')[1];

    const startCell = table.querySelector(`#cell-${startPeriod}-${dayIdx}`);
    if (!startCell) {
      console.log('找不到格子:', `#cell-${startPeriod}-${dayIdx}`);
      continue;
    }

    // 調試：檢查星期四 H 時段的渲染
    if (key === '3-H') {
      console.log('星期四 H 時段最終課程:', finalCourses.map(c => c['課程名稱']));
      console.log('星期四 H 時段 rowspan:', rowspan);
    }

    startCell.rowSpan = rowspan;
    startCell.classList.add('has-course');

    // 決定這個格子是否要加下邊框
    const periodIndex = periods.indexOf(startPeriod);
    if (periodIndex > -1 && (periodIndex + rowspan === periods.length)) {
      startCell.classList.add('cell-bottom-border');
    }

    let innerContent = '';
    finalCourses.forEach(course => {
      const courseName = course['課程名稱'] ? course['課程名稱'].replace(/([^(（]+)([\(（][^)）]+[\)）])/, '<span class="course-title">$1$2</span>') : '';
      const gradeInfo = course['開課年級'] || '';
      const teacher = course['任課教師'] || course['授課教師'] || '';
      const classroom = course['上課教室'] || course['教室'] || '';
      const credit = course['學分數'] || '';
      
      // 專題課程不顯示學分數
      const creditDisplay = courseName.includes('資訊管理專題與個案') ? '' : (credit ? `(${credit})` : '');
      
      // 從 SemesterCourseName 中提取連結
      let courseUrl = '';
      if (course['SemesterCourseName'] && course['SemesterCourseName'].includes('href=')) {
        const match = course['SemesterCourseName'].match(/href="([^"]+)"/);
        if (match) {
          courseUrl = match[1];
        }
      }
      
      const gradeDisplay = gradeInfo ? `(${gradeInfo})` : '';
      const blockContent = `${courseName}${creditDisplay}<br>${gradeDisplay}<br>${teacher}<br>${classroom}<br><a href="${courseUrl}" target="_blank" class="view-link">檢視</a>`;
      
      innerContent += `<div class="course-block ${typeColorMap[course['修別']] || 'cell-elective'}">
                        ${blockContent}
                      </div>`;
    });

    startCell.innerHTML = `<div class="cell-content-wrapper">${innerContent}</div>`;

    // 調試：檢查星期四 H 時段的 DOM 渲染
    if (key === '3-H') {
      console.log('星期四 H 時段 innerContent:', innerContent);
      console.log('星期四 H 時段 startCell.innerHTML:', startCell.innerHTML);
    }

    for (let i = 1; i < rowspan; i++) {
      const periodToRemove = longestCoursePeriods[i];
      if (periodToRemove) {
        cellsToRemove.add(`cell-${periodToRemove}-${dayIdx}`);
      }
    }
  }

  // 移除被合併的單元格
  cellsToRemove.forEach(cellId => {
    const cell = table.querySelector(`#${cellId}`);
    if (cell) cell.remove();
  });

  // 先將表格添加到 DOM
  scheduleDiv.appendChild(table);

  // 在表格添加到 DOM 後再檢查和修復邊框
  const allRows = table.querySelectorAll('tr');
  console.log('表格總行數:', allRows.length);
  
  // 找到最後一行的最後一個單元格（應該是資料單元格，不是表頭）
  if (allRows.length > 0) {
    const lastTableRow = allRows[allRows.length - 1];
    const lastTableCells = lastTableRow.querySelectorAll('td, th');
    console.log('最後一行的單元格數量:', lastTableCells.length);
    
    if (lastTableCells.length > 0) {
      // 找到最後一個單元格（應該是 td，不是 th）
      const bottomRightCell = lastTableCells[lastTableCells.length - 1];
      console.log('找到右下角單元格:', bottomRightCell);
      
      // 強制設置邊框樣式
      bottomRightCell.style.borderRight = '2px solid #bcbcbc';
      bottomRightCell.style.borderBottom = '2px solid #bcbcbc';
      console.log('已設置右下角邊框樣式');
      
      // 檢查邊框是否真的被設置
      console.log('邊框樣式檢查:', bottomRightCell.style.borderRight, bottomRightCell.style.borderBottom);
    }
  }

  // 檢查所有行的單元格數量
  allRows.forEach((row, index) => {
    const cells = row.querySelectorAll('td, th');
    console.log(`第 ${index + 1} 行有 ${cells.length} 個單元格`);
    if (cells.length > 0) {
      const lastCell = cells[cells.length - 1];
      console.log(`第 ${index + 1} 行最後一個單元格:`, lastCell.tagName, lastCell.textContent);
    }
  });
}

// 更新標題
function updateScheduleTitle(grade) {
  const titleElement = document.getElementById('schedule-title');
  const gradeNames = {
    'all': '國立暨南國際大學資管系課程資訊',
    '1': '國立暨南國際大學資管系大一課程資訊',
    '2': '國立暨南國際大學資管系大二課程資訊',
    '3': '國立暨南國際大學資管系大三課程資訊',
    '4': '國立暨南國際大學資管系大四課程資訊',
    'master': '國立暨南國際大學資管系碩班課程資訊'
  };
  titleElement.textContent = gradeNames[grade] || gradeNames['all'];
}

// 事件處理
document.getElementById('csvFile').addEventListener('change', async function(e) {
  if (!e.target.files.length) return;
  
  const file = e.target.files[0];
  document.getElementById('file-upload-block').style.display = 'none';

  try {
    const result = await uploadFile(file);
    
    if (result.success) {
      allCourses = result.data;
      currentData = result;
      setupGradeFilter();
      renderSchedule(allCourses);
      updateScheduleTitle('all');
    } else {
      alert('檔案處理失敗: ' + result.error);
    }
  } catch (error) {
    alert('檔案上傳失敗: ' + error.message);
  }
});

// 年級篩選功能
function setupGradeFilter() {
  const gradeButtons = document.querySelectorAll('.grade-btn');
  gradeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      gradeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const grade = this.getAttribute('data-grade');
      currentFilter = grade;
      
      let filteredCourses = [];
      
      if (grade === 'all') {
        filteredCourses = allCourses;
      } else if (grade === 'master') {
        // 碩班課程：開課年級包含碩士班相關資訊
        filteredCourses = allCourses.filter(course => {
          const gradeInfo = course['開課年級'] || '';
          const courseType = course['學制'] || '';
          const isMaster = courseType.includes('碩士班') || gradeInfo.includes('碩');
          return isMaster;
        });
      } else {
        // 大學部課程：根據開課年級篩選
        filteredCourses = allCourses.filter(course => {
          const gradeInfo = course['開課年級'] || '';
          return gradeInfo.toString() === grade;
        });
      }
      
      renderSchedule(filteredCourses);
      updateScheduleTitle(grade);
    });
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('前端應用程式已載入');
}); 