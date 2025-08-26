#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');

// Crawler configuration - read from environment variables
const XSRF_TOKEN = process.env.XSRF_TOKEN;
const SESSION = process.env.SESSION;
const TOKEN = process.env.TOKEN;

// Validate that all required environment variables are present
if (!XSRF_TOKEN || !SESSION || !TOKEN) {
    console.error("錯誤: 缺少必要的環境變數");
    console.error("請確保 .env 檔案包含以下變數:");
    console.error("  XSRF_TOKEN=...");
    console.error("  SESSION=...");
    console.error("  TOKEN=...");
    process.exit(1);
}

// Request URL
const URL = 'https://sis.ncnu.edu.tw/b09/b09120';

async function fetchCourseData(params = {}) {
    /**
     * Fetch course data from NCNU system
     */
    try {
        console.error("正在從 NCNU 系統獲取課程資料...");
        
        // Default parameters (can be overridden)
        const defaultParams = {
            academicYear: '114',
            semester: '1',
            unitID: '93', // 資訊管理學系
            length: '2000'
        };
        
        const finalParams = { ...defaultParams, ...params };
        
        // Prepare form parameters
        const formParams = new URLSearchParams();
        formParams.append('_token', TOKEN);
        formParams.append('srh[ACADYear][]', finalParams.academicYear);
        formParams.append('srh[Semester][]', finalParams.semester);
        formParams.append('srh[DayfgID][]', '');
        formParams.append('srh[ClassTypeID][]', '');
        formParams.append('srh[CollegeID][]', '');
        formParams.append('srh[UnitID][]', finalParams.unitID);
        formParams.append('srh[Grade][]', '');
        formParams.append('srh[ClassID][]', '');
        formParams.append('srh[CourseNo]', '');
        formParams.append('srh[SemesterCourseNo]', '');
        formParams.append('srh[Teacher]', '');
        formParams.append('srh[SemesterCourseName]', '');
        formParams.append('srh[ClassRoom][]', '');
        formParams.append('srh[TeaLanguage][]', '');
        formParams.append('srh[DayKind][]', '');
        formParams.append('srh[SectionBeg][]', '');
        formParams.append('srh[SectionEnd][]', '');
        formParams.append('tb_length', finalParams.length);
        formParams.append('tb_sel', '');
        formParams.append('tb_cancel', '');

        // Make the request
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `XSRF-TOKEN=${XSRF_TOKEN}; _session=${SESSION}`,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Origin': 'https://sis.ncnu.edu.tw',
                'Referer': 'https://sis.ncnu.edu.tw/b09/b09120'
            },
            body: formParams.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const htmlContent = await response.text();
        console.error("成功獲取課程資料");
        return htmlContent;
        
    } catch (error) {
        console.error(`獲取課程資料失敗: ${error.message}`);
        return null;
    }
}

function showUsage() {
    /**
     * 顯示使用說明
     */
    console.error(`
NCNU 課程資料爬蟲工具

使用方法:
  node scripts/crawler.js [選項] [輸出檔案]

選項:
  --year, -y <year>        學年 (預設: 114)
  --semester, -s <sem>     學期 1=上學期, 2=下學期 (預設: 1)  
  --unit, -u <unit>        系所代碼 (預設: 93=資訊管理學系)
  --length, -l <length>    最大筆數 (預設: 2000)
  --help, -h               顯示此說明

參數:
  輸出檔案               輸出的HTML檔案名稱 (預設: 輸出到stdout)

範例:
  node scripts/crawler.js > temp                         # 爬取預設參數，輸出到temp檔案
  node scripts/crawler.js data.html                      # 爬取預設參數，輸出到data.html
  node scripts/crawler.js --year 113 --semester 2        # 爬取113學年下學期
  node scripts/crawler.js -y 114 -s 1 -u 93 courses.html # 指定所有參數

預設參數:
  學年: 114 (113學年)
  學期: 1 (上學期)  
  系所: 93 (資訊管理學系)
  筆數: 2000
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
    const params = {};
    let outputFile = null;
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        
        switch (arg) {
            case '--year':
            case '-y':
                if (nextArg && !nextArg.startsWith('-')) {
                    params.academicYear = nextArg;
                    i++;
                }
                break;
            case '--semester':
            case '-s':
                if (nextArg && !nextArg.startsWith('-')) {
                    params.semester = nextArg;
                    i++;
                }
                break;
            case '--unit':
            case '-u':
                if (nextArg && !nextArg.startsWith('-')) {
                    params.unitID = nextArg;
                    i++;
                }
                break;
            case '--length':
            case '-l':
                if (nextArg && !nextArg.startsWith('-')) {
                    params.length = nextArg;
                    i++;
                }
                break;
            default:
                if (!arg.startsWith('-')) {
                    outputFile = arg;
                }
                break;
        }
    }
    
    // Show parameters
    console.error(`爬取參數:`);
    console.error(`  學年: ${params.academicYear || '114'}`);
    console.error(`  學期: ${params.semester || '1'}`);
    console.error(`  系所: ${params.unitID || '93'}`);
    console.error(`  筆數: ${params.length || '2000'}`);
    if (outputFile) {
        console.error(`  輸出: ${outputFile}`);
    } else {
        console.error(`  輸出: stdout`);
    }
    console.error();
    
    // Fetch data
    const htmlContent = await fetchCourseData(params);
    if (!htmlContent) {
        console.error("爬取失敗");
        process.exit(1);
    }
    
    // Output data
    if (outputFile) {
        try {
            fs.writeFileSync(outputFile, htmlContent, 'utf-8');
            console.error(`資料已儲存到 ${outputFile}`);
        } catch (error) {
            console.error(`儲存檔案失敗: ${error.message}`);
            process.exit(1);
        }
    } else {
        // Output to stdout (like original backend/test.js)
        console.log(htmlContent);
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
    fetchCourseData,
    main
};