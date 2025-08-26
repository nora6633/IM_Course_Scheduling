#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { fetchCourseData } = require('./crawler.js');

function readInputFile(fileName) {
    /**
     * 讀取輸入檔案
     */
    try {
        if (fileName === '-') {
            // Read from stdin
            return fs.readFileSync(process.stdin.fd, 'utf-8');
        } else {
            return fs.readFileSync(fileName, 'utf-8');
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`錯誤: 找不到檔案 ${fileName}`);
        } else {
            console.error(`讀取檔案失敗: ${error.message}`);
        }
        return null;
    }
}

function extractJsonData(htmlContent) {
    /**
     * 從HTML內容中提取JSON資料
     */
    try {
        // 尋找包含課程資料的JavaScript變數，新格式在setDataTables中
        const pattern = /"data":(\[.*?\]),"columns"/s;
        const match = htmlContent.match(pattern);
        
        if (!match) {
            console.error("錯誤: 在HTML中找不到課程資料");
            return null;
        }
        
        const jsonStr = match[1];
        const data = JSON.parse(jsonStr);
        console.error(`成功提取到 ${data.length} 筆課程資料`);
        return data;
        
    } catch (error) {
        console.error(`解析JSON資料失敗: ${error.message}`);
        return null;
    }
}

function extractSemesterInfo(htmlContent) {
    /**
     * 提取學年和學期資訊
     */
    const semesterInfo = {
        academicYear: '未知學年',
        semester: '未知學期',
        department: '未知系所'
    };
    
    // 尋找學年資訊
    const yearMatch = htmlContent.match(/(\d{3})學年/);
    if (yearMatch) {
        semesterInfo.academicYear = yearMatch[1];
    }
    
    // 尋找學期資訊
    const semesterMatch = htmlContent.match(/([上下])學期/);
    if (semesterMatch) {
        semesterInfo.semester = semesterMatch[1] + '學期';
    }
    
    // 尋找系所資訊
    const deptMatch = htmlContent.match(/資訊管理學系/);
    if (deptMatch) {
        semesterInfo.department = '資訊管理學系';
    }
    
    return semesterInfo;
}

function decodeUnicode(text) {
    /**
     * 解碼Unicode轉義序列和HTML實體
     */
    if (typeof text !== 'string') return text;
    
    // 解碼HTML實體
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x60;/g, '`')
        .replace(/&#x3D;/g, '=');
}

function processCourseData(data) {
    /**
     * 處理課程資料
     */
    const courses = [];
    
    for (const item of data) {
        const course = {};
        
        // 解碼Unicode轉義序列
        for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'string') {
                course[key] = decodeUnicode(value);
            } else {
                course[key] = value;
            }
        }
        
        courses.push(course);
    }
    
    return courses;
}

function escapeCSVField(field) {
    /**
     * 處理CSV欄位的特殊字元
     */
    const str = String(field || '');
    // 如果包含逗號、換行符或雙引號，需要用雙引號包圍
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        // 將內部的雙引號轉義為兩個雙引號
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function saveCoursesToCSV(courses, semesterInfo, outputFile = null) {
    /**
     * 將課程資料儲存到CSV檔案
     */
    try {
        // 如果沒有指定輸出檔案，則根據學期資訊自動命名
        if (!outputFile) {
            const yearText = semesterInfo.academicYear !== '未知學年' ? 
                `${semesterInfo.academicYear}學年` : '未知學年';
            const semesterText = semesterInfo.semester || '未知學期';
            outputFile = `courses_${semesterInfo.academicYear || 'unknown'}_${semesterInfo.semester || 'unknown'}.csv`;
        }
        
        // CSV標題行
        const header = [
            '課程編號', '課程名稱', '英文名稱', '班級', '修別', '學分', 
            '系所', '學制', '開課年級', '任課教師', '上課時間', '上課教室', 
            '授課語言', '選別', '備註', 'SemesterCourseName'
        ];
        
        let csvContent = header.join(',') + '\n';
        
        // 寫入課程資料
        for (const course of courses) {
            // 處理任課教師欄位（如有逗號則加雙引號）
            let teacher = String(course.Teacher || '');
            if (teacher.includes(',')) {
                teacher = `"${teacher.replace(/"/g, '""')}"`;
            }
            
            // 處理課程名稱（移除HTML標籤）
            const courseName = String(course.SemesterCourseName || '').replace(/<[^>]*>/g, '');
            
            const row = [
                String(course.CourseNo || ''),
                courseName,
                String(course.SemesterCourseENGName || ''),
                String(course.StudyClassName || ''),
                String(course.CourseClassName || ''),
                String(course.Credit || ''),
                String(course.UnitName || ''),
                String(course.DayfgClassTypeName || ''),
                String(course.Grade || ''),
                teacher,
                String(course.SemCourseTime || ''),
                String(course.ClassRoom || ''),
                String(course.TeaLanguage || ''),
                String(course.Choose || ''),
                String(course.Memo || ''),
                String(course.SemesterCourseName || '')
            ];
            
            // 使用自定義的CSV轉義函數
            const escapedRow = row.map(field => escapeCSVField(field));
            csvContent += escapedRow.join(',') + '\n';
        }
        
        if (outputFile === '-') {
            // Output to stdout
            process.stdout.write(csvContent);
        } else {
            fs.writeFileSync(outputFile, csvContent, 'utf-8');
            console.error(`課程資料已成功儲存到 ${outputFile}`);
        }
        
        console.error(`共處理 ${courses.length} 筆課程資料`);
        
    } catch (error) {
        console.error(`儲存CSV檔案失敗: ${error.message}`);
    }
}

function saveCoursesToJSON(courses, semesterInfo, outputFile) {
    /**
     * 將課程資料儲存到JSON檔案
     */
    try {
        const outputData = {
            semester: `${semesterInfo.academicYear}${semesterInfo.semester}`,
            department: semesterInfo.department,
            totalCourses: courses.length,
            courses: courses
        };
        
        const jsonContent = JSON.stringify(outputData, null, 2);
        
        if (outputFile === '-') {
            // Output to stdout
            process.stdout.write(jsonContent);
        } else {
            fs.writeFileSync(outputFile, jsonContent, 'utf-8');
            console.error(`課程資料已成功儲存到 ${outputFile}`);
        }
        
        console.error(`共處理 ${courses.length} 筆課程資料`);
        
    } catch (error) {
        console.error(`儲存JSON檔案失敗: ${error.message}`);
    }
}

function showUsage() {
    /**
     * 顯示使用說明
     */
    console.error(`
NCNU 課程資料解析工具

使用方法:
  node scripts/parser.js [選項] [輸入檔案] [輸出檔案]

選項:
  --format, -f <format>    輸出格式: csv, json (預設: csv)
  --crawler, -c            直接使用爬蟲獲取資料 (不需要輸入檔案)
  --year, -y <year>        學年 (crawler模式，預設: 114)
  --semester, -s <sem>     學期 1=上學期, 2=下學期 (crawler模式，預設: 1)  
  --unit, -u <unit>        系所代碼 (crawler模式，預設: 93=資訊管理學系)
  --help, -h               顯示此說明

參數:
  輸入檔案                 要解析的HTML檔案 (預設: temp，使用 - 表示stdin)
                          如果使用 --crawler 則忽略此參數
  輸出檔案                 輸出檔案名稱 (可選，預設自動命名，使用 - 表示stdout)

檔案模式範例:
  node scripts/parser.js                           # 解析temp檔案，自動命名CSV輸出
  node scripts/parser.js temp courses.csv          # 解析temp檔案，輸出到courses.csv
  node scripts/parser.js --format json             # 解析temp檔案，自動命名JSON輸出  
  node scripts/parser.js data.html courses.json    # 解析data.html，輸出到courses.json
  node scripts/parser.js - -                       # 從stdin讀取，輸出到stdout

爬蟲模式範例:
  node scripts/parser.js --crawler                 # 直接爬取並輸出CSV
  node scripts/parser.js --crawler courses.csv     # 直接爬取並輸出到courses.csv
  node scripts/parser.js -c --format json          # 直接爬取並輸出JSON
  node scripts/parser.js -c -y 113 -s 2            # 爬取113學年下學期

管道操作範例:
  node scripts/crawler.js | node scripts/parser.js - courses.csv
  node scripts/crawler.js | node scripts/parser.js - - > courses.csv

輸出檔案格式:
  CSV: courses_[學年]_[學期].csv   (包含16個欄位的課程資訊)
  JSON: courses_[學年]_[學期].json (結構化的課程資料)
`);
}

async function main() {
    /**
     * 主函數
     */
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }
    
    // Parse arguments
    let format = 'csv';
    let inputFile = 'temp';
    let outputFile = null;
    let useCrawler = false;
    let crawlerParams = {};
    
    const nonFlagArgs = [];
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        
        switch (arg) {
            case '--format':
            case '-f':
                if (nextArg && !nextArg.startsWith('-')) {
                    format = nextArg.toLowerCase();
                    i++;
                }
                break;
            case '--crawler':
            case '-c':
                useCrawler = true;
                break;
            case '--year':
            case '-y':
                if (nextArg && !nextArg.startsWith('-')) {
                    crawlerParams.academicYear = nextArg;
                    i++;
                }
                break;
            case '--semester':
            case '-s':
                if (nextArg && !nextArg.startsWith('-')) {
                    crawlerParams.semester = nextArg;
                    i++;
                }
                break;
            case '--unit':
            case '-u':
                if (nextArg && !nextArg.startsWith('-')) {
                    crawlerParams.unitID = nextArg;
                    i++;
                }
                break;
            default:
                if (!arg.startsWith('-')) {
                    nonFlagArgs.push(arg);
                }
                break;
        }
    }
    
    // Assign non-flag arguments
    if (!useCrawler) {
        if (nonFlagArgs.length >= 1) {
            inputFile = nonFlagArgs[0];
        }
        if (nonFlagArgs.length >= 2) {
            outputFile = nonFlagArgs[1];
        }
    } else {
        // In crawler mode, first non-flag arg is output file
        if (nonFlagArgs.length >= 1) {
            outputFile = nonFlagArgs[0];
        }
    }
    
    // Validate format
    if (!['csv', 'json'].includes(format)) {
        console.error(`錯誤: 不支援的格式 '${format}'，僅支援 csv 或 json`);
        process.exit(1);
    }
    
    let htmlContent;
    
    if (useCrawler) {
        console.error(`解析參數 (爬蟲模式):`);
        console.error(`  學年: ${crawlerParams.academicYear || '114'}`);
        console.error(`  學期: ${crawlerParams.semester || '1'}`);
        console.error(`  系所: ${crawlerParams.unitID || '93'}`);
        console.error(`  輸出格式: ${format}`);
        if (outputFile) {
            console.error(`  輸出檔案: ${outputFile}`);
        } else {
            console.error(`  輸出檔案: 自動命名`);
        }
        console.error();
        
        // Use crawler to fetch data directly
        htmlContent = await fetchCourseData(crawlerParams);
        if (!htmlContent) {
            console.error("爬蟲獲取資料失敗");
            process.exit(1);
        }
    } else {
        console.error(`解析參數 (檔案模式):`);
        console.error(`  輸入檔案: ${inputFile}`);
        console.error(`  輸出格式: ${format}`);
        if (outputFile) {
            console.error(`  輸出檔案: ${outputFile}`);
        } else {
            console.error(`  輸出檔案: 自動命名`);
        }
        console.error();
        
        // Read input file
        htmlContent = readInputFile(inputFile);
        if (!htmlContent) {
            process.exit(1);
        }
    }
    
    // 提取學年和學期資訊
    const semesterInfo = extractSemesterInfo(htmlContent);
    console.error('提取到的學期資訊:', semesterInfo);
    
    // 提取JSON資料
    const data = extractJsonData(htmlContent);
    if (!data) {
        process.exit(1);
    }
    
    // 處理課程資料
    const courses = processCourseData(data);
    
    // 儲存資料
    if (format === 'json') {
        const jsonFile = outputFile || `courses_${semesterInfo.academicYear || 'unknown'}_${semesterInfo.semester || 'unknown'}.json`;
        saveCoursesToJSON(courses, semesterInfo, jsonFile);
    } else {
        saveCoursesToCSV(courses, semesterInfo, outputFile);
    }
}

// If this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('執行失敗:', error.message);
        process.exit(1);
    });
}

module.exports = {
    extractJsonData,
    extractSemesterInfo,
    processCourseData,
    saveCoursesToCSV,
    saveCoursesToJSON,
    main
};