const fs = require('fs');

// 系所代碼對應表 (只保留資管系)
const DEPARTMENT_MAP = {
    '93': '資訊管理學系'
};

// 讀取temp檔案
function readTempFile(fileName = 'temp') {
    try {
        const content = fs.readFileSync(fileName, 'utf8');
        return content;
    } catch (error) {
        console.error(`讀取${fileName}檔案失敗:`, error.message);
        return null;
    }
}

// 從HTML中提取JSON資料
function extractJsonData(htmlContent) {
    // 尋找包含課程資料的JSON部分
    const jsonMatch = htmlContent.match(/setDataTables\('tb',\s*({.*?}),\s*\[\],\s*\[\],\s*\[\],\s*false\)/s);
    
    if (jsonMatch) {
        try {
            // 提取JSON字串並解析
            const jsonStr = jsonMatch[1];
            const data = JSON.parse(jsonStr);
            return data;
        } catch (error) {
            console.error('解析JSON失敗:', error.message);
            return null;
        }
    }
    
    console.error('找不到課程資料JSON');
    return null;
}

// 從HTML中提取學年和學期資訊
function extractSemesterInfo(htmlContent) {
    let semesterInfo = {
        academicYear: '',
        semester: '',
        department: ''
    };
    
    // 嘗試從HTML中提取學年資訊
    const yearMatch = htmlContent.match(/value='(\d+)'\s*selected.*?學年/);
    if (yearMatch) {
        semesterInfo.academicYear = yearMatch[1];
    }
    
    // 嘗試從HTML中提取學期資訊
    const semesterMatch = htmlContent.match(/value='(\d+)'\s*selected.*?學期/);
    if (semesterMatch) {
        const semesterNum = semesterMatch[1];
        semesterInfo.semester = semesterNum === '1' ? '上學期' : 
                               semesterNum === '2' ? '下學期' : 
                               semesterNum === '3' ? '暑期' : semesterNum;
    }
    
    // 嘗試從HTML中提取系所資訊
    const deptMatch = htmlContent.match(/value='(\d+)'\s*selected.*?系所/);
    if (deptMatch) {
        const deptCode = deptMatch[1];
        semesterInfo.department = DEPARTMENT_MAP[deptCode] || `系所代碼: ${deptCode}`;
    }
    
    return semesterInfo;
}

// 解碼Unicode轉義序列
function decodeUnicode(str) {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
}

// 處理課程資料
function processCourseData(data) {
    if (!data || !data.data) {
        console.error('沒有找到課程資料');
        return [];
    }

    const courses = data.data.map(course => {
        const decodedCourse = {};
        
        // 解碼所有字串欄位
        for (const [key, value] of Object.entries(course)) {
            if (typeof value === 'string') {
                decodedCourse[key] = decodeUnicode(value);
            } else {
                decodedCourse[key] = value;
            }
        }
        
        return decodedCourse;
    });

    return courses;
}

// 格式化輸出課程資訊
function formatCourseInfo(courses, semesterInfo) {
    const yearText = semesterInfo.academicYear ? `${semesterInfo.academicYear}學年` : '未知學年';
    const semesterText = semesterInfo.semester || '未知學期';
    const deptText = semesterInfo.department || '未知系所';
    
    console.log(`=== ${yearText}${semesterText} ${deptText}課程資訊 ===\n`);
    
    courses.forEach((course, index) => {
        console.log(`${index + 1}. 課程編號: ${course.CourseNo}`);
        console.log(`   課程名稱: ${course.SemesterCourseName.replace(/<[^>]*>/g, '')}`); // 移除HTML標籤
        console.log(`   英文名稱: ${course.SemesterCourseENGName}`);
        console.log(`   班級: ${course.StudyClassName || '無'}`);
        console.log(`   修別: ${course.CourseClassName}`);
        console.log(`   學分: ${course.Credit}`);
        console.log(`   系所: ${course.UnitName}`);
        console.log(`   學制: ${course.DayfgClassTypeName}`);
        console.log(`   開課年級: ${course.Grade}`);
        console.log(`   任課教師: ${course.Teacher}`);
        console.log(`   上課時間: ${course.SemCourseTime || '無'}`);
        console.log(`   上課教室: ${course.ClassRoom || '無'}`);
        console.log(`   授課語言: ${course.TeaLanguage}`);
        console.log(`   選別: ${course.Choose}`);
        console.log(`   備註: ${course.Memo || '無'}`);
        console.log('   ---');
    });
}

// 儲存解碼後的資料到檔案
function saveDecodedData(courses, semesterInfo, outputPrefix = '') {
    try {
        const yearText = semesterInfo.academicYear ? `${semesterInfo.academicYear}學年` : '未知學年';
        const semesterText = semesterInfo.semester || '未知學期';
        const deptText = semesterInfo.department || '未知系所';
        
        const outputData = {
            semester: `${yearText}${semesterText}`,
            department: deptText,
            totalCourses: courses.length,
            courses: courses
        };
        
        // 使用學年和學期資訊來命名檔案
        const fileName = `${outputPrefix}courses_${semesterInfo.academicYear || 'unknown'}_${semesterInfo.semester || 'unknown'}`;
        
        fs.writeFileSync(`${fileName}.json`, JSON.stringify(outputData, null, 2), 'utf8');
        console.log(`\n解碼後的課程資料已儲存到 ${fileName}.json`);
        
        // 也儲存為CSV格式
        const csvHeader = '課程編號,課程名稱,英文名稱,班級,修別,學分,系所,學制,開課年級,任課教師,上課時間,上課教室,授課語言,選別,備註\n';
        const csvContent = courses.map(course => {
            // 任課教師欄位自動加雙引號（如有逗號）
            let teacher = course.Teacher || '';
            if (teacher.includes(',')) {
                teacher = '"' + teacher.replace(/"/g, '""') + '"';
            }
            return [
                course.CourseNo,
                `"${course.SemesterCourseName.replace(/<[^>]*>/g, '')}"`,
                `"${course.SemesterCourseENGName}"`,
                course.StudyClassName || '',
                course.CourseClassName,
                course.Credit,
                course.UnitName,
                course.DayfgClassTypeName,
                course.Grade,
                teacher,
                course.SemCourseTime || '',
                course.ClassRoom || '',
                course.TeaLanguage,
                course.Choose,
                `"${course.Memo || ''}"`
            ].join(',');
        }).join('\n');
        
        fs.writeFileSync(`${fileName}.csv`, csvHeader + csvContent, 'utf8');
        console.log(`解碼後的課程資料已儲存到 ${fileName}.csv`);
        
    } catch (error) {
        console.error('儲存檔案失敗:', error.message);
    }
}

// 顯示使用說明
function showUsage() {
    console.log(`
課程資料解碼工具

使用方法:
  node decode_courses.js [輸入檔案] [輸出前綴]

參數:
  輸入檔案    要解碼的檔案名稱 (預設: temp)
  輸出前綴    輸出檔案的前綴 (可選)

範例:
  node decode_courses.js                    # 解碼 temp 檔案
  node decode_courses.js temp1              # 解碼 temp1 檔案
  node decode_courses.js temp1 114_1_       # 解碼 temp1 檔案，輸出檔案前綴為 114_1_

輸出檔案:
  - courses_[學年]_[學期].json  (JSON格式)
  - courses_[學年]_[學期].csv   (CSV格式)
`);
}

// 主函數
function main() {
    // 解析命令行參數
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }
    
    const inputFile = args[0] || 'temp';
    const outputPrefix = args[1] || '';
    
    console.log(`開始解碼課程資料...\n`);
    console.log(`輸入檔案: ${inputFile}`);
    if (outputPrefix) {
        console.log(`輸出前綴: ${outputPrefix}`);
    }
    console.log('');
    
    // 讀取temp檔案
    const htmlContent = readTempFile(inputFile);
    if (!htmlContent) {
        return;
    }
    
    // 提取學年和學期資訊
    const semesterInfo = extractSemesterInfo(htmlContent);
    console.log('提取到的學期資訊:', semesterInfo);
    
    // 提取JSON資料
    const jsonData = extractJsonData(htmlContent);
    if (!jsonData) {
        return;
    }
    
    // 處理課程資料
    const courses = processCourseData(jsonData);
    if (courses.length === 0) {
        return;
    }
    
    // 顯示課程資訊
    formatCourseInfo(courses, semesterInfo);
    
    // 儲存解碼後的資料
    saveDecodedData(courses, semesterInfo, outputPrefix);
    
    console.log(`\n總共找到 ${courses.length} 門課程`);
}

// 執行主函數
main(); 