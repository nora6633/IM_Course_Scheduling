// API 配置
const API_BASE_URL = '/api';

// 全域變數
let allCourses = [];
let courseSelectionData = {};
let currentFilter = 'all';
let currentData = null;
let yearSemester = null;

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

// 從 URL 獲取年份學期
function getYearSemesterFromURL() {
  const path = window.location.pathname;
  const match = path.match(/\/courses\/(\d{3}-\d)/);
  return match ? match[1] : null;
}

// 載入課程資料
async function loadCourseData(yearSemester) {
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  
  loadingDiv.style.display = 'block';
  errorDiv.style.display = 'none';
  
  try {
    const response = await fetch(`/im/${yearSemester}`);
    const result = await response.json();
    
    if (result.success) {
      allCourses = result.courseData;
      
      // 處理選別資料，建立課程編號到選別的映射
      courseSelectionData = {};
      if (result.selectionData) {
        result.selectionData.forEach(item => {
          const courseCode = item['課程編號'] || item['課號'];
          if (courseCode) {
            courseSelectionData[courseCode] = item['選別'] || '';
          }
        });
      }
      
      // 更新標題和學期資訊
      document.getElementById('semester-info').textContent = `${yearSemester} 學期`;
      document.title = `${yearSemester} 課程資訊 - 國立暨南國際大學資管系`;
      
      // 渲染課程表
      currentData = result.groupedCourses;
      renderSchedule();
      
    } else {
      throw new Error(result.error || '載入失敗');
    }
  } catch (error) {
    console.error('載入課程資料錯誤:', error);
    errorText.textContent = `無法載入 ${yearSemester} 學期的課程資料：${error.message}`;
    errorDiv.style.display = 'block';
  } finally {
    loadingDiv.style.display = 'none';
  }
}

// 課程時間解析函數
function parseCourseTimes(timeStr) {
  if (!timeStr) return [];
  return timeStr.split(',').map(t => {
    const m = t.match(/(\d)([a-zA-Z]+)/);
    if (!m) return null;
    return { dayIdx: parseInt(m[1], 10) - 1, periods: m[2].toUpperCase().split('') };
  }).filter(Boolean);
}

// 創建課程內容
function createCourseContent(course, rowspan = 1) {
  const courseName = course['課程名稱'] ? course['課程名稱'].replace(/([^(（]+)([\(（][^)）]+[\)）])/, '<span class="course-title">$1$2</span>') : '';
  const gradeInfo = course['開課年級'] || '';
  const teacher = (course['任課教師'] || course['授課教師'] || '').replace(/^"|"$/g, '').replace(/,/g, '、');
  const classroom = course['上課教室'] || course['教室'] || '';
  const credit = course['學分數'] || '';
  
  // 專題課程不顯示學分數
  const creditDisplay = courseName.includes('資訊管理專題與個案') ? '' : (credit ? `(${credit})` : '');
  const teacherDisplay = courseName.includes('資訊管理專題與個案') ? 'a. 簡宏宇 B24<br>b. 洪嘉良 管451<br>c. 黃俊哲、龔榮發 管203<br>d. 陳建宏 管204<br>e. 陳彥錚、陳小芬 管136<br>f. 戴榮賦、鄭育評 管106' : teacher;
  
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
  
  const blockContent = `${courseName}${creditDisplay}${starDisplay}<br>${gradeDisplay}<br>${teacherDisplay}<br>${classroom}<br><a href="${courseUrl}" target="_blank" class="view-link">檢視</a>`;
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

// 查看課程詳情
function viewCourseDetail(courseCode) {
  const course = allCourses.find(c => c['課程編號'] === courseCode);
  if (!course) return;
  
  const details = Object.entries(course)
    .filter(([key, value]) => value && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  alert(`課程詳細資訊:\n\n${details}`);
}

// 渲染課程表
function renderSchedule() {
  if (!allCourses.length) return;
  
  const data = allCourses;
  const scheduleDiv = document.getElementById('schedule');
  scheduleDiv.innerHTML = '';
  
  const table = document.createElement('table');
  table.className = 'schedule-table';
  
  // 建立標題行
  const headerRow = document.createElement('tr');
  const timeHeader = document.createElement('th');
  timeHeader.textContent = '時間';
  headerRow.appendChild(timeHeader);
  
  weekDays.forEach(day => {
    const dayHeader = document.createElement('th');
    dayHeader.textContent = `星期${day}`;
    headerRow.appendChild(dayHeader);
  });
  
  table.appendChild(headerRow);
  
  // 建立時段行
  const tableBody = document.createElement('tbody');
  periods.forEach(period => {
    const periodTime = periodTimes[period];
    const timeBlock = `${periodTime[0]}<br>-<br>${periodTime[1]}`;
    
    if (period === 'Z') {
  	const row = document.createElement('tr');

  	// 節次與時間
  	const timeCell = document.createElement('th');
  	timeCell.className = 'period-header';
  	timeCell.innerHTML = `${period}<br>${timeBlock}`;
  	row.appendChild(timeCell);

  	// 午間休息合併一格
  	const lunchCell = document.createElement('td');
  	lunchCell.className = 'lunch-break';
  	lunchCell.colSpan = weekDays.length; // 合併所有 weekday 欄位
  	lunchCell.textContent = '午間休息';
  	row.appendChild(lunchCell);

  	tableBody.appendChild(row);
  	return;
    }

    const row = document.createElement('tr');
    const timeCell = document.createElement('th');
    timeCell.className = 'period-header';
    timeCell.innerHTML = `${period}<br>${timeBlock}`;
    row.appendChild(timeCell);
    
    weekDays.forEach((_, dayIdx) => {
      const cell = document.createElement('td');
      cell.id = `cell-${period}-${dayIdx}`;
      row.appendChild(cell);
    });
    
    tableBody.appendChild(row);
  });
  
  table.appendChild(tableBody);
  scheduleDiv.appendChild(table);

  // 分組課程 - 按起始時段分組
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
}

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
  console.log(`處理重疊課程組:`, courses.map(c => `${c['課程名稱']}(${c.periods.join('')})`));
  
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

// 篩選課程
function filterCourses(grade) {
  const buttons = document.querySelectorAll('.grade-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-grade="${grade}"]`).classList.add('active');

  currentFilter = grade;

  if (grade === 'all') {
    renderSchedule();
  } else {
    const originalCourses = allCourses;

    const filteredCourses = originalCourses.filter(course => {
      if (grade === 'master') {
        return course['學制'] === '碩士班';
      } else {
        return course['學制'] === '學士班' && course['開課年級'] === grade;
      }
    });

    allCourses = filteredCourses;
    renderSchedule();
    allCourses = originalCourses;
  }
}


// 初始化
document.addEventListener('DOMContentLoaded', function() {
  yearSemester = getYearSemesterFromURL();
  
  if (!yearSemester) {
    document.getElementById('error-text').textContent = '無效的網址格式';
    document.getElementById('error-message').style.display = 'block';
    return;
  }
  
  // 載入課程資料
  loadCourseData(yearSemester);
  
  // 設置篩選按鈕事件
  document.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const grade = btn.dataset.grade;
      filterCourses(grade);
    });
  });
});
