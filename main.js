const typeColorMap = {
  '校必修': 'cell-must',
  '院必修': 'cell-college',
  '系必修': 'cell-dept',
  '技術次領域': 'cell-tech',
  '管理次領域': 'cell-mgmt',
  '專業選修': 'cell-elective'
};

const weekDays = ['一', '二', '三', '四', '五'];
const periods = ['A','B','C','D','Z','E','F','G','H','I','J'];

// 處理多時段格式，例如 2bcd,3efg
function parseCourseTimes(timeStr) {
  if (!timeStr) return [];
  // 允許多組以逗號分隔
  return timeStr.split(',').map(t => {
    const m = t.match(/(\d)([A-Z]+)/);
    if (!m) return null;
    return { dayIdx: parseInt(m[1], 10) - 1, periods: m[2].split('') };
  }).filter(Boolean);
}

document.getElementById('csvFile').addEventListener('change', function(e) {
  Papa.parse(e.target.files[0], {
    header: true,
    complete: function(results) {
      renderSchedule(results.data);
    }
  });
});

function renderSchedule(data) {
  // 建立空白課表
  const table = document.createElement('table');
  table.className = 'schedule-table';
  let thead = '<tr><th></th>' + weekDays.map(d => `<th>星期${d}</th>`).join('') + '</tr>';
  table.innerHTML = thead;
  for (let p of periods) {
    let row = `<tr><th>${p}</th>`;
    for (let d = 0; d < weekDays.length; d++) {
      row += `<td id="cell-${p}-${d}"></td>`;
    }
    row += '</tr>';
    table.innerHTML += row;
  }
  document.getElementById('schedule').innerHTML = '';
  document.getElementById('schedule').appendChild(table);

  // 填入課程
  data.forEach(course => {
    // 解析上課時間，支援多時段
    const times = parseCourseTimes(course['上課時間']);
    times.forEach(({dayIdx, periods}) => {
      periods.forEach(ch => {
        const cell = document.getElementById(`cell-${ch}-${dayIdx}`);
        if (cell) {
          cell.innerHTML += `<div class="${typeColorMap[course['修別']] || 'cell-elective'}">${course['課程名稱']}<br>${course['任課教師']}<br>${course['上課教室']}</div>`;
        }
      });
    });
  });
} 