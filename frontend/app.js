// API 配置
const API_BASE_URL = 'http://localhost:3000/api';

// 全域變數
let allCourses = []; // 從 CSV 上傳的課程資料
let courseSelectionData = {}; // 從 Excel 上傳的選別資料
let currentFilter = 'all';
let currentData = null;

// 課程類型顏色映射 - 根據選別欄位
const typeColorMap = {
  // 必修課程
  '校必修': 'cell-must',           // 淺灰藍色 (#D0E0F0)
  '院必修': 'cell-college',        // 淺橘色 (#FFDAB9)
  '基礎院本課程必修': 'cell-college', // 淺橘色 (#FFDAB9)
  '系必修': 'cell-dept',           // 淺粉米色 (#EAD1DC)
  '專業必修': 'cell-dept',         // 淺紫粉色 (#F0E6FA)
  '必修': 'cell-dept',             // 淺紫粉色 (#F0E6FA)
  
  // 選修課程
  '專業選修': 'cell-elective',     // 淺米色 (#FFF8DC)
  '選修': 'cell-elective',         // 淺米色 (#FFF8DC)
  
  // 次領域課程
  '技術次領域': 'cell-tech',       // 淺藍色 (#B2C9EF)
  '「技術」次領域選修': 'cell-tech', // 淺藍色 (#B2C9EF)
  '技術次領域選修': 'cell-tech',   // 淺藍色 (#B2C9EF)
  '管理次領域': 'cell-mgmt',       // 淺綠色 (#DFF0D8)
  '「管理」次領域選修': 'cell-mgmt', // 淺綠色 (#DFF0D8)
  '管理次領域選修': 'cell-mgmt',   // 淺綠色 (#DFF0D8)
  
  // 其他類型
  '通識': 'cell-elective',         // 淺米色 (#FFF8DC)
  '體育': 'cell-elective',         // 淺米色 (#FFF8DC)
  '軍訓': 'cell-elective',         // 淺米色 (#FFF8DC)
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

// API 函數 - 上傳課程資料檔案
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  let endpoint = '/upload-csv'; // 預設為 CSV
  
  if (file.name.endsWith('.json')) {
    endpoint = '/upload-json';
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    endpoint = '/upload-excel';
  }
  
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

// 上傳選別資料 Excel 檔案
async function uploadSelectionFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    //console.log('準備上傳到:', `${API_BASE_URL}/upload-excel`);
    const response = await fetch(`${API_BASE_URL}/upload-excel`, {
      method: 'POST',
      body: formData
    });
    //console.log('API 回應狀態:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('選別檔案上傳錯誤:', error);
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
  //console.log('開始渲染課表，資料筆數:', data.length);
  
  // 確保 schedule 元素存在
  let scheduleDiv = document.getElementById('schedule');
  if (!scheduleDiv) {
    //console.log('schedule 元素不存在，創建新的 schedule-container');
    const scheduleContainer = document.getElementById('schedule-container');
    if (scheduleContainer) {
      scheduleContainer.innerHTML = '<div id="schedule"></div>';
      scheduleDiv = document.getElementById('schedule');
    } else {
      console.error('schedule-container 也不存在');
      return;
    }
  }
  
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
      //console.log('weekDays', weekDays[d]);
      //console.log('row', row);
    }
    row += '</tr>';
    tableBody.innerHTML += row;
  }
  table.appendChild(tableBody);

  // 分組課程 - 按起始時段分組
  const groupedCourses = {};
  
  data.forEach(course => {
    if (!course['課程名稱']) return;
    
    const times = parseCourseTimes(course['上課時間']);
    times.forEach(({ dayIdx, periods }) => {
      if (periods.length === 0) return;
      const startPeriod = periods[0];
      const key = `${dayIdx}-${startPeriod}`;
      
      // 調試：檢查星期四和星期五的課程
      if ((dayIdx === 3 || dayIdx === 4) && periods.some(p => ['E', 'F', 'G', 'H', 'I', 'J'].includes(p))) {
        const dayName = dayIdx === 3 ? '星期四' : '星期五';
        // console.log(`課程 ${course['課程名稱']} 時段: ${periods.join('')}, 開始時段: ${startPeriod}, 星期: ${dayName}, dayIdx: ${dayIdx}, key: ${key}, 原始時間: ${course['上課時間']}`);
        
        // 特別檢查資料庫和專題課程
        if (course['課程名稱'].includes('資料庫') || course['課程名稱'].includes('專題討論')) {
          // console.log(`*** 重點課程 ${course['課程名稱']} *** dayIdx: ${dayIdx}, 上課時間: ${course['上課時間']}`);
        }
      }
      
      if (!groupedCourses[key]) {
        groupedCourses[key] = [];
      }
      groupedCourses[key].push({ ...course, periods });
    });
  });

  console.log('分組後的課程:', groupedCourses);

  // 檢測重疊課程組並創建巢狀表格結構
  
  // 先按天分組所有課程
  const coursesByDay = {};
  for (const key in groupedCourses) {
    const dayIdx = parseInt(key.split('-')[0], 10);
    if (!coursesByDay[dayIdx]) {
      coursesByDay[dayIdx] = [];
    }
    groupedCourses[key].forEach(course => {
      coursesByDay[dayIdx].push({ ...course, startPeriod: key.split('-')[1] });
    });
  }

  // 為每天找出重疊的課程組
  Object.keys(coursesByDay).forEach(dayIdx => {
    const dayCourses = coursesByDay[dayIdx];
    const processedCourses = new Set();
    
    dayCourses.forEach(course => {
      if (processedCourses.has(course['課程名稱'])) return;
      
      // 找出與此課程重疊的所有其他課程
      const overlapGroup = [course];
      const usedPeriods = new Set(course.periods);
      
      dayCourses.forEach(otherCourse => {
        if (otherCourse['課程名稱'] === course['課程名稱']) return;
        if (processedCourses.has(otherCourse['課程名稱'])) return;
        
        // 檢查是否有重疊時段
        const hasOverlap = otherCourse.periods.some(p => usedPeriods.has(p));
        if (hasOverlap) {
          overlapGroup.push(otherCourse);
          otherCourse.periods.forEach(p => usedPeriods.add(p));
        }
      });
      
      // 標記所有課程為已處理
      overlapGroup.forEach(c => processedCourses.add(c['課程名稱']));
      
      if (overlapGroup.length > 1) {
        // 有重疊：創建巢狀表格
        renderOverlapGroup(overlapGroup, dayIdx, table);
      } else {
        // 無重疊：正常渲染
        renderSingleCourse(course, dayIdx, table);
      }
    });
  });

  // 渲染單一課程（無重疊）
  function renderSingleCourse(course, dayIdx, table) {
    const startCell = table.querySelector(`#cell-${course.startPeriod}-${dayIdx}`);
    if (!startCell) return;
    
    startCell.rowSpan = course.periods.length;
    startCell.classList.add('has-course');
    startCell.setAttribute('data-periods', course.periods.length);
    
    const courseData = createCourseContent(course, course.periods.length);
    startCell.classList.add(courseData.colorClass);
    startCell.innerHTML = `<div class="cell-content-wrapper">${courseData.content}</div>`;
    
    // 移除其他時段的格子
    for (let i = 1; i < course.periods.length; i++) {
      const periodToRemove = course.periods[i];
      const cellToRemove = table.querySelector(`#cell-${periodToRemove}-${dayIdx}`);
      if (cellToRemove) cellToRemove.remove();
    }
  }

  // 渲染重疊課程組（使用巢狀表格）
  function renderOverlapGroup(courses, dayIdx, table) {
    // console.log(`處理重疊課程組:`, courses.map(c => `${c['課程名稱']}(${c.periods.join('')})`));
    
    // 找出所有使用的時段
    const allPeriods = new Set();
    courses.forEach(course => {
      course.periods.forEach(p => allPeriods.add(p));
    });
    const sortedPeriods = Array.from(allPeriods).sort((a, b) => periods.indexOf(a) - periods.indexOf(b));
    
    const startPeriod = sortedPeriods[0];
    const startCell = table.querySelector(`#cell-${startPeriod}-${dayIdx}`);
    if (!startCell) return;
    
    startCell.rowSpan = sortedPeriods.length;
    startCell.classList.add('has-course');
    startCell.setAttribute('data-periods', sortedPeriods.length);
    
    // 創建巢狀表格
    const nestedTable = createNestedTable(courses, sortedPeriods);
    startCell.innerHTML = nestedTable;
    
    // 移除其他時段的格子
    for (let i = 1; i < sortedPeriods.length; i++) {
      const periodToRemove = sortedPeriods[i];
      const cellToRemove = table.querySelector(`#cell-${periodToRemove}-${dayIdx}`);
      if (cellToRemove) cellToRemove.remove();
    }
  }

  // 創建巢狀表格HTML
  function createNestedTable(courses, allPeriods) {
    // 建立課程的固定順序（按課程名稱排序以確保一致性）
    const sortedCourses = courses.sort((a, b) => a['課程名稱'].localeCompare(b['課程名稱']));
    
    // 計算每個課程在每個時段的 rowspan 和是否應該顯示
    const courseSpanInfo = {};
    
    sortedCourses.forEach(course => {
      const courseName = course['課程名稱'];
      courseSpanInfo[courseName] = {};
      
      // 找出課程的連續時段組
      const coursePeriods = course.periods.filter(p => allPeriods.includes(p));
      coursePeriods.sort((a, b) => allPeriods.indexOf(a) - allPeriods.indexOf(b));
      
      let currentSpanStart = null;
      let spanLength = 0;
      
      for (let i = 0; i < allPeriods.length; i++) {
        const period = allPeriods[i];
        
        if (coursePeriods.includes(period)) {
          if (currentSpanStart === null) {
            // 開始新的連續區段
            currentSpanStart = period;
            spanLength = 1;
          } else {
            // 繼續連續區段
            spanLength++;
          }
          
          // 檢查是否是連續區段的結束
          const nextPeriod = allPeriods[i + 1];
          const isLastPeriod = i === allPeriods.length - 1;
          const nextPeriodNotInCourse = !coursePeriods.includes(nextPeriod);
          
          if (isLastPeriod || nextPeriodNotInCourse) {
            // 結束連續區段，設置 span 信息
            courseSpanInfo[courseName][currentSpanStart] = {
              rowspan: spanLength,
              show: true
            };
            
            // 標記其他時段為不顯示
            for (let j = 1; j < spanLength; j++) {
              const periodIndex = allPeriods.indexOf(currentSpanStart) + j;
              if (periodIndex < allPeriods.length) {
                const skipPeriod = allPeriods[periodIndex];
                courseSpanInfo[courseName][skipPeriod] = {
                  rowspan: 0,
                  show: false
                };
              }
            }
            
            currentSpanStart = null;
            spanLength = 0;
          }
        }
      }
    });
    
    let html = '<table class="nested-course-table" style="width:100%; height:100%; border-collapse: collapse;">';
    
    allPeriods.forEach(period => {
      html += '<tr>';
      
      // 為每個課程檢查是否在此時段，並處理 rowspan
      sortedCourses.forEach(course => {
        const courseName = course['課程名稱'];
        const spanInfo = courseSpanInfo[courseName][period];
        
        if (spanInfo && spanInfo.show) {
          // 顯示課程內容，使用 rowspan
          const courseData = createCourseContent(course, spanInfo.rowspan);
          const rowspanAttr = spanInfo.rowspan > 1 ? ` rowspan="${spanInfo.rowspan}"` : '';
          html += `<td${rowspanAttr} class="${courseData.colorClass}" style="border: 1px solid #ddd; padding: 2px; vertical-align: top;">${courseData.content}</td>`;
        } else if (!spanInfo) {
          // 課程不在此時段，顯示空格
          html += '<td style="border: 1px solid #ddd; padding: 2px;"></td>';
        }
        // 如果 spanInfo 存在但 show 為 false，則不添加任何 td（被 rowspan 覆蓋）
      });
      
      html += '</tr>';
    });
    
    html += '</table>';
    return html;
  }
  
  // 創建課程內容的輔助函數 - 返回內容和顏色類別
  function createCourseContent(course, rowspan = 1) {
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
    
    // 檢查是否為碩士班課程（根據備註判斷）
    const remarks = course['備註'] || '';
    const isMasterCourse = remarks.includes('為碩士班必修課，學士班大三以上學生可自由選擇是否修習。') ||
                          remarks.includes('為碩士班選修課，學士班大三以上學生可自由選擇是否修習。');
    
    // 決定年級顯示：如果是碩士班課程則顯示 (G)，否則顯示原本的年級
    const gradeDisplay = isMasterCourse ? '(G)' : (gradeInfo ? `(${gradeInfo})` : '');
    
    // 決定星號顯示：如果是碩士班課程則顯示 ⭐
    const starDisplay = isMasterCourse ? ' ⭐' : '';
    
    const blockContent = `${courseName}${creditDisplay}${starDisplay}<br>${gradeDisplay}<br>${teacher}<br>${classroom}<br><a href="${courseUrl}" target="_blank" class="view-link">檢視</a>`;
    
    // 根據選別資料決定顏色
    let courseType = '';
    
    // 優先使用 Excel 上傳的選別資料（根據課程編號匹配）
    if (courseSelectionData[course['課程編號']]) {
      courseType = courseSelectionData[course['課程編號']];
    } else {
      // 如果沒有選別資料，則使用課程本身的選別或修別欄位
      courseType = course['選別'] || course['修別'] || '';
    }
    
    const colorClass = typeColorMap[courseType] || 'cell-elective';
    
    return {
      content: `<div class="course-block">${blockContent}</div>`,
      colorClass: colorClass
    };
  }

  // 確保表格有完整的邊框結構
  const tbody = table.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr');
  
  // 強制處理所有邊框 - 使用更可靠的方法
  let lastRow = null; // 先宣告變數
  
  if (rows.length > 0) {
    // 處理最後一行的下邊框
    lastRow = rows[rows.length - 1];
    const lastRowCells = lastRow.querySelectorAll('td, th');
    lastRowCells.forEach(cell => {
      // 強制設置下邊框
      cell.style.setProperty('border-bottom', '2px solid #bcbcbc', 'important');
      // 如果是最後一列，也強制設置右邊框
      if (cell === lastRowCells[lastRowCells.length - 1]) {
        cell.style.setProperty('border-right', '2px solid #bcbcbc', 'important');
      }
    });
    
    // 處理每一行的右邊框
    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length > 0) {
        const lastCell = cells[cells.length - 1];
        lastCell.style.setProperty('border-right', '2px solid #bcbcbc', 'important');
      }
    });
    
    // 特別強制處理右下角
    const lastCell = lastRowCells[lastRowCells.length - 1];
    if (lastCell) {
      // 使用多重方法確保邊框顯示
      lastCell.style.borderRight = '2px solid #bcbcbc';
      lastCell.style.borderBottom = '2px solid #bcbcbc';
      lastCell.style.setProperty('border-right', '2px solid #bcbcbc', 'important');
      lastCell.style.setProperty('border-bottom', '2px solid #bcbcbc', 'important');
      
      // 添加內聯樣式作為最後手段
      lastCell.setAttribute('style', lastCell.getAttribute('style') + '; border-right: 2px solid #bcbcbc !important; border-bottom: 2px solid #bcbcbc !important;');
    }
  }

  // 調試：檢查表格結構
  //console.log('表格行數:', rows.length);
  //console.log('最後一行:', lastRow);
  if (lastRow) {
    //console.log('最後一行的單元格數量:', lastRow.querySelectorAll('td, th').length);
    const lastCell = lastRow.querySelector('td:last-child, th:last-child');
    //console.log('最後一個單元格:', lastCell);
    if (lastCell) {
      //console.log('最後一個單元格的邊框樣式:', lastCell.style.borderRight, lastCell.style.borderBottom);
    }
  }

  scheduleDiv.appendChild(table);
}

// 處理選別資料匹配
function processSelectionData(selectionData) {
  courseSelectionData = {};
  
  //console.log('開始處理選別資料，資料筆數:', selectionData.length);
  //console.log('第一筆資料範例:', selectionData[0]);
  
  // 建立課程編號到選別的映射
  selectionData.forEach(course => {
    // 支援多種可能的欄位名稱
    const courseCode = course['課程編號'] || course['課號'] || course['Course Code'];
    const selection = course['選別'] || course['Selection'];
    
    if (courseCode && selection) {
      courseSelectionData[courseCode] = selection;
      //console.log(`課程編號 ${courseCode} 對應選別: ${selection}`);
    } else {
      //console.log(`跳過資料: 課程編號=${courseCode}, 選別=${selection}`);
    }
  });
  
  //console.log('選別資料處理完成，共處理', Object.keys(courseSelectionData).length, '筆資料');
  //console.log('選別資料映射:', courseSelectionData);
  
  // 如果有課程資料，重新渲染以應用選別顏色
  if (allCourses.length > 0) {
    //console.log('開始重新渲染課表...');
    renderSchedule(allCourses);
  } else {
    //console.log('沒有課程資料可渲染');
  }
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
document.addEventListener('DOMContentLoaded', function() {
  const csvFileInput = document.getElementById('csvFile');
  if (csvFileInput) {
    csvFileInput.addEventListener('change', async function(e) {
  if (!e.target.files.length) return;
  
  const file = e.target.files[0];
  document.getElementById('file-upload-block').style.display = 'none';

  try {
    const result = await uploadFile(file);
    
    if (result.success) {
      allCourses = result.data;
      currentData = result;
      
      // 顯示成功訊息
      alert('課程資料上傳成功！現在請上傳選別資料 Excel 檔案。');
      
      // 隱藏課程資料上傳區域，但保留選別資料上傳區域
      document.querySelector('.upload-section:first-child').style.display = 'none';
      
      // 更新選別資料上傳區域的標題
      const selectionTitle = document.querySelector('#selection-upload-block h3');
      if (selectionTitle) {
        selectionTitle.textContent = '步驟 2: 上傳選別資料 (必要)';
      }
      
      // 顯示提示訊息
      const noteElement = document.querySelector('#selection-upload-block .note:last-child');
      if (noteElement) {
        noteElement.textContent = '此步驟為必要步驟，必須上傳選別資料才能顯示課程表';
        noteElement.style.color = '#e74c3c';
        noteElement.style.fontWeight = 'bold';
      }
      
      // 顯示等待提示和 Excel 上傳區域
      const scheduleContainer = document.getElementById('schedule-container');
      if (scheduleContainer) {
        scheduleContainer.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #666;">
            <h3>課程資料已上傳成功！</h3>
            <p>請在下方上傳選別資料 Excel 檔案，課程表將在選別資料上傳後顯示。</p>
            <div style="margin: 20px 0;">
              <span style="background: #e74c3c; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;">
                等待選別資料上傳...
              </span>
            </div>
          </div>
          
          <!-- 強制顯示 Excel 上傳區域 -->
          <div id="excel-upload-section" style="margin: 40px auto; max-width: 600px; padding: 20px; border: 2px solid #e74c3c; border-radius: 8px; background-color: #fff5f5; box-shadow: 0 0 10px rgba(231, 76, 60, 0.3);">
            <h3 style="color: #e74c3c; margin-bottom: 15px;">步驟 2: 上傳選別資料 (必要)</h3>
            <input type="file" id="excelFile" accept=".xlsx,.xls" style="margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: white; width: 100%;" />
            <p style="margin: 5px 0; color: #666; font-size: 14px;">請選擇 Excel 檔案 (.xlsx 或 .xls)，包含「選別」欄位</p>
            <p style="margin: 5px 0; color: #e74c3c; font-size: 12px; font-style: italic; font-weight: bold;">注意：Excel 檔案必須包含「課程編號」和「選別」兩個欄位</p>
            <p style="margin: 5px 0; color: #e74c3c; font-size: 12px; font-style: italic; font-weight: bold;">此步驟為必要步驟，必須上傳選別資料才能顯示課程表</p>
          </div>
        `;
        
        // 為新的 Excel 上傳區域綁定事件
        const excelFileInput = document.getElementById('excelFile');
        if (excelFileInput) {
          excelFileInput.addEventListener('change', async function(e) {
            if (!e.target.files.length) return;
            
            const file = e.target.files[0];
            //console.log('Excel 檔案已選擇:', file.name);

            try {
              //console.log('開始上傳 Excel 檔案...');
              const result = await uploadSelectionFile(file);
              //console.log('Excel 上傳結果:', result);
              
              if (result.success) {
                //console.log('Excel 上傳成功，開始處理選別資料...');
                // 處理選別資料
                processSelectionData(result.data);
                
                //console.log('選別資料處理完成，開始渲染課表...');
                // 現在才顯示課程表
                setupGradeFilter();
                renderSchedule(allCourses);
                updateScheduleTitle('all');
                
                //console.log('課表渲染完成');
                alert('選別資料上傳成功！課程表已顯示，課程顏色已根據選別資料設定。');
                
                // 隱藏整個上傳區塊，因為課程表已經顯示
                document.getElementById('file-upload-block').style.display = 'none';
              } else {
                console.error('Excel 檔案處理失敗:', result.error);
                alert('選別檔案處理失敗: ' + result.error);
              }
            } catch (error) {
              console.error('Excel 檔案上傳錯誤:', error);
              alert('選別檔案上傳失敗: ' + error.message);
            }
          });
        }
      }
    } else {
      alert('檔案處理失敗: ' + result.error);
    }
  } catch (error) {
    console.error('CSV 上傳錯誤:', error);
    alert('檔案上傳失敗: ' + error.message);
  }
    });
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
  //console.log('前端應用程式已載入');
  
  // 選別檔案上傳事件處理
  const selectionFileInput = document.getElementById('selectionFile');
  if (selectionFileInput) {
    selectionFileInput.addEventListener('change', async function(e) {
      if (!e.target.files.length) return;
      
      const file = e.target.files[0];

      try {
        const result = await uploadSelectionFile(file);
        
        if (result.success) {
          // 處理選別資料
          processSelectionData(result.data);
          
          // 現在才顯示課程表
          setupGradeFilter();
          renderSchedule(allCourses);
          updateScheduleTitle('all');
          
          alert('選別資料上傳成功！課程表已顯示，課程顏色已根據選別資料設定。');
          
          // 隱藏整個上傳區塊，因為課程表已經顯示
          document.getElementById('file-upload-block').style.display = 'none';
        } else {
          alert('選別檔案處理失敗: ' + result.error);
        }
      } catch (error) {
        alert('選別檔案上傳失敗: ' + error.message);
      }
    });
  }
}); 