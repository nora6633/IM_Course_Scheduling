// Node.js 18 以下需安裝 node-fetch：npm install node-fetch
//import fetch from 'node-fetch'; // 若使用 CommonJS，可改為：const fetch = require('node-fetch');

// 可替換的參數：_token、XSRF-TOKEN、_session
//const TOKEN = process.env.TOKEN || '';
//const XSRF_TOKEN = process.env.XSRF_TOKEN || 'YOUR_XSRF_TOKEN_HERE';
//const SESSION = process.env.SESSION || 'YOUR_SESSION_COOKIE_HERE';
/*
const TOKEN="HGs9PewiEk1eThT39wSSijWDJbeD33a1GdbMsUX2"
const XSRF_TOKEN="eyJpdiI6ImpWbzdNNGtzL3VvN3pPblZ5Z243Ync9PSIsInZhbHVlIjoiWmZTSkYrRzJTODQwVnhqSC9YSnI4VXp3U0hWVkcvZUpubUM0WXdldmFiTnFQL1dyM1Eya0NXT08relQ3b05tOHhmV25VMWhzcXlKUG1BeTl3dzNnaUtBVitWWHI1S2Z6Yy9LWDJIZ1FEYnE0TXBPSG5VbEw4NG1jN1VnbWdDWWQiLCJtYWMiOiIyZWRmYTVhNTljYTg5ZWQxMjZkNTM2OWEzM2RlMTkwMmVmMGE0MjMyZDk4N2Q1Nzc4NDJmY2VjYmFhYzczNWZmIiwidGFnIjoiIn0%3D"
const SESSION="eyJpdiI6Img1cnd2S1dYNEdCbGtMWUlpM3Bydnc9PSIsInZhbHVlIjoiSXNrS3V0N1FnTnhPSzBubEtGc1FIbDluUzM4QWYxY3VpOHdCc1VkYnYzTDhYUnJrUDY0L0ZJWHpCWm5KSklMMUljQkpwZyt5N0pYOVRHWFZUTHY3VTNtdnJPQnlzc1NENTJMN3J3UmtaclpiZVF2RStaOGRkMnFPNHRtSVJ5MkQiLCJtYWMiOiI2OTExZWY3MDdjNTIyNTg4ZTJhYmMyMzk4ZGNiOGVlYjMxZjRjZDczMjFhZjkwN2QzMjNlYjY1ZGQ5ZTIyN2IwIiwidGFnIjoiIn0%3D"
*/
/*
// QQ
const TOKEN="rTSqydG8TFMHp6DaL0gDFqcSSigspjGLPWUt8Ysk"
'XSRF-TOKEN=eyJpdiI6InVxWHFrZk8rUDh0TDdJV3hqeHJBaFE9PSIsInZhbHVlIjoiVlZtb0RqdWpSRXZsYWcwaUVpQmhnVWVlbk1nVnJRNWVSVkl2Mjgzcy9sTXl5YkRjL0VLTXlBMjRyeDhPNm53Yjl3MFVnQ3ZiaFdTMnhzd3FHU0wzTU1Wd0JuM1pkYkg0NzBlME9rZ01idnYrWW1peDBnQUt5N2ZtVXNDbXB4UFkiLCJtYWMiOiI2MTFkZTM4OWZhY2I4ZTYzOTUyOGMyZjM0ODhlNzZiMjhiNDQ5Y2Q4MjlhYWM1ZDQxY2M2MTU4ZjYxMzdhMmI1IiwidGFnIjoiIn0%3D; expires=Tue, 10 Jun 2025 09:55:17 GMT; Max-Age=3600; path=/; secure',
  '_session=eyJpdiI6ImFEYVFNeklQaTduVkx2TC85bFg4R2c9PSIsInZhbHVlIjoiamkydXFtc2lobkJXTDMxWThTYmNWejBnZnM0bk5CYTY2Zi9aanZ0K2lBRThiNk9iSkJOSVFXTzVqVm5WS2ZPcE1iSUNwUXV2b0VwSkpXN2Z2UWd2M2xxMXUxekNTa1BlR1IzK1RiYzB4UU8yU1huSG52V2c5UVY5eHA4dm1VS08iLCJtYWMiOiI0MzQyZDUxMjZlNDNhMjA0NzFmNTZmZjI4ZmUzODQ4OWZkM2RiMmE3Y2NlZDdmNDc3ZjI0Y2I4MmNhOGU1YzgzIiwidGFnIjoiIn0%3D; path=/; secure; httponly'
const XSRF_TOKEN="eyJpdiI6InVxWHFrZk8rUDh0TDdJV3hqeHJBaFE9PSIsInZhbHVlIjoiVlZtb0RqdWpSRXZsYWcwaUVpQmhnVWVlbk1nVnJRNWVSVkl2Mjgzcy9sTXl5YkRjL0VLTXlBMjRyeDhPNm53Yjl3MFVnQ3ZiaFdTMnhzd3FHU0wzTU1Wd0JuM1pkYkg0NzBlME9rZ01idnYrWW1peDBnQUt5N2ZtVXNDbXB4UFkiLCJtYWMiOiI2MTFkZTM4OWZhY2I4ZTYzOTUyOGMyZjM0ODhlNzZiMjhiNDQ5Y2Q4MjlhYWM1ZDQxY2M2MTU4ZjYxMzdhMmI1IiwidGFnIjoiIn0%3D"
const SESSION="=eyJpdiI6ImFEYVFNeklQaTduVkx2TC85bFg4R2c9PSIsInZhbHVlIjoiamkydXFtc2lobkJXTDMxWThTYmNWejBnZnM0bk5CYTY2Zi9aanZ0K2lBRThiNk9iSkJOSVFXTzVqVm5WS2ZPcE1iSUNwUXV2b0VwSkpXN2Z2UWd2M2xxMXUxekNTa1BlR1IzK1RiYzB4UU8yU1huSG52V2c5UVY5eHA4dm1VS08iLCJtYWMiOiI0MzQyZDUxMjZlNDNhMjA0NzFmNTZmZjI4ZmUzODQ4OWZkM2RiMmE3Y2NlZDdmNDc3ZjI0Y2I4MmNhOGU1YzgzIiwidGFnIjoiIn0%3D"
*/

/*
const XSRF_TOKEN="eyJpdiI6IlU5Sy90aEh6ckptV3kwWUlITzdPR2c9PSIsInZhbHVlIjoiWjdSV1F2WnZJSnMxMjhRR2ZwZnUwaXpsRDZVTUlSenNyWHQ3eDllNVBZT1psU2Z0bXNKR0NlUzNscHhXQkdrMCIsIm1hYyI6IjI4ZDI2NWM0NDkxYWExOGNlMGI4YWU0M2UwYzc4ZDhhNDM4NmZiNmYzYjI1ODI3MWIxMGJmNzA2MGJlY2Y0OWUiLCJ0YWciOiIifQ%3D%3D"
const SESSION="eyJpdiI6IjgzWWhKd0w0SEsyWVNTcC9MLzU3Y2c9PSIsInZhbHVlIjoiUW1jS0RuVy92ZUZYRkR4ZDVTN09TMEZONjVyaEhUSnAxRzlBcHczNFQrblUwT1BMenNlbWpudlNLbHFRa2VWVHI3UytHemlWaHJyT29vRXhjVmo3UFdHNW5MUSszMWp1Ymc3R0VqUnVUdGY0OStDTEE0UUN0VWpudGc5ZmZQaSsiLCJtYWMiOiI1MmE2MDFjZjk1MzcwZWJmNjhkYjFjODNkMWE5MmMxMTNmNTM4MjBkMWRkMWQxNDlhMTI1YmNmMjQwOGQzZGU1IiwidGFnIjoiIn0%3D"
/*
const SESSION="eyJpdiI6IjRkVHlOQXBSZVNQcWZVTk80L0xRTXc9PSIsInZhbHVlIjoiUzhmVUxtek85b2d0R1NJUDRNVlphUENSa1BCWXdCQ2pQWmJFeWIwOWE1Y05RM3Z2c2o1Q1cwcjFhajlTQ2ZqVDF4eXBVZHIvOVpMaUlLbWJESVowaXpzS1JhRnhMbDcrS0huWDl0VUk2OEs2cmNqKyswdTBnZFJMYmxZKzhydGUiLCJtYWMiOiI5Nzg1YTQ0NDEzYzYwMzlhMmVhZWYyOThjNDQwNWQyMTUzNWYwNzlhNmIyNTNjNzE4MWY0MzM1YjA3MDZhNjZkIiwidGFnIjoiIn0%3D"
const XSRF_TOKEN="eyJpdiI6Imk2c0xEWWQrZE9QMFRuZk5rUU8rekE9PSIsInZhbHVlIjoiK05TajVJSGxSdGNxaUhNeGdGdW5UQjdJbGtjZlZpTEQxWklnVkdFcFFKYVNSeHR0Y1hxWWpzbEJkUnluT0NIM2Frb1dZbDJhaitCemYzYkkyVitHbDEwUDZraFp6WFB0Mm9NdiswWkxPRkpjMUZVSVQ4bm8yQTJmcHgyUHRlRnYiLCJtYWMiOiI0MWI1NGM5YzM2NDZlYzIwZTY1NzMyYTA3ZGVhZDVmZGNkZDkxMDYxMTVhNjZmN2IyZjU3YjhkZjExY2UyNTViIiwidGFnIjoiIn0%3D"
const TOKEN="AM8DRbgk9tuw4TyxgbPXZeQZrxYFrBEyc8iBwKOu"
const SESSION="eyJpdiI6ImxMVTZHTmpzYlFJK0F6TzJIQ2ZVWXc9PSIsInZhbHVlIjoiOXo1Sm1CWStvUmNyWUJFRWZIQmxDR1h5bFl6ZkVVSysvZmlsd1dUMzBCdldjWm81SUNFSVdQemdMeFNDTGcvbDEyUWRxSCs5KzBJYU9OL2pDTndBRGd1aFVpRDRiaC9JVFI0NG5BalZEazVCSXhEU2orZGY1UmhoWlJhTm5LMGciLCJtYWMiOiI0NjM0ZmUzMTIzMzlhNGUxOGY0NDAwMzE5ZDgyMjM2MjMyYjJlYzdlMjA1ZjM3NmZlMDFjYmQ1MjUwYjBkNDE4IiwidGFnIjoiIn0%3D"
const XSRF_TOKEN="eyJpdiI6IlFGeU1MVHdqTnF4eCtUMUxZSFhzYUE9PSIsInZhbHVlIjoiaHl3WXkyZ3lFbkdpVTRyVUJQMjdCb1FGYUNXdkJQTWFtQ043R3RST1dvemZuYUtyZ2tXbkpUY0FRMy9ZcUM3ZFZCVlNhdG1yZTJsVURINTNkd251RGNqN212bzJ2QStkSDJZVEVHV2tES1pzZjhRK2ZGYjc4V2xKVFI5Z3owMU4iLCJtYWMiOiJhMTQ4Y2JhOTBhNDM5MTg0YjJlMGFiMmM2Njc1ZjA1YzdiZDFiYjA4MjhjYmRkMTE1Y2E1Njc2N2FmNDkwZmViIiwidGFnIjoiIn0%3D"
const TOKEN="dXX2PYHLLELcn0luw0dixAEnecCLGDax7g6UWkMg"
*/
/*
 * fuck
const TOKEN="RUXwa5YT8xmRmuEr0NRWALtebPPhYgCDUsH45qGf";
const XSRF_TOKEN="eyJpdiI6IkZwbURPSm00UXNJcVk4MnEydTM2TEE9PSIsInZhbHVlIjoibnZjbWhwMzRnQm03eENhZUxUT3U4TkxxMkRBUWg3Uy9tcHA4Si82TEQ5ZkNKejlRTU04bFA3a0xtczNvd0d4KyIsIm1hYyI6IjNjZWJmMzQ2YmY3MjUyMTg3ZmQyOTQ4MWRlMzUzMmM5ZDRmMDI5OWJkNmQ2OTAxMTI3M2YzODBkYTNhZDUwNTkiLCJ0YWciOiIifQ%3D%3D"
const SESSION="eyJpdiI6IjNpeTMzejQxclpWTDJ4OVQ1aExMS0E9PSIsInZhbHVlIjoiZWhQNHR5endLWTZtQUVPTFpVOTVHOWJoWklMWnYxWml1Qk1BQUNoNlRWNzNHeU5iVDVESjN3ZmFnZ1BhcktlTjg0bm9IaGcyQ2xtTldWeDdub25qZ1BpdDNzRkg4U3hMUHZoN1g5ZHRNcXhSK3FNbjU4UHB2elN6RFNkUUMyWjgiLCJtYWMiOiJhOTgyYWEwNmRhZGRmMDViMjEwMDU1MDE5ZGMxNWY1ZDQwM2IyN2Y4OWQ3NzMwMjM5ZGJkY2Q5NDBjNWZmZTVhIiwidGFnIjoiIn0%3D"
*/
const XSRF_TOKEN="eyJpdiI6ImF0d2tsc3hqMXJlMXZqQngwdG9rMGc9PSIsInZhbHVlIjoiZXNMUEYvNDZCZDlRb1FQQm5QRExqS2psazZPNUJOQUZ6YzB2ZEI2RnVNNmJIV1pBZ1hSWE1GT3pLQ3VxaTYvQVVIY0RIY2pZZFI1Z0xBRU1FbklwNUhWSTJNYjB4ZUxKdkZRcEl6NlZRMVRSQ3d1VFhkUlBIdmtyTE9OK2N1eEMiLCJtYWMiOiJhZWJiNjljYzU5MGYwNDE0YWY4NmQ3NmMwZmE5NTJlMzAxN2ZiNzdhODczYTViYTIxNzM5ZmU3YWZlMjE0ODdhIiwidGFnIjoiIn0%3D;"
const SESSION="eyJpdiI6InJNM2M1eDBlQWxJMDIvQTZXUnoyc1E9PSIsInZhbHVlIjoiLzNReXR3eGxKZXRLTFJIZ1FDR1pYUDdZZTdpc2d0MnNVT0tnSDU1Qjc4aGtzclRyZEdiYm9OTytjQ1R2RHVJcEhDMXI1MkZhQnBKSmJOTDRSMlFuY3ZGNzh4OUVjNEhMRmpVbUFxU3E4TmRxMndmamNpK1RCNFZoQTVSTlE5eW4iLCJtYWMiOiJhNTE4NjE4NWY1M2FjZTI4MTBhNDRhN2EyMzY3M2RmNWM5MTBiMDc0YjYyMDEyNjUyY2MzZmQ5YjY2YzRiMGZhIiwidGFnIjoiIn0%3D;"
const TOKEN="Z24AHV0DodZu5FtMaaGbsaKUgejE8OnXyspWTgNG";

// 請求 URL
const URL = 'https://sis.ncnu.edu.tw/b09/b09120';

// 組裝 URLencoded 表單數據
const formParams = new URLSearchParams();
formParams.append('_token', TOKEN);
formParams.append('srh[ACADYear][]', '114');
formParams.append('srh[Semester][]', '1');
formParams.append('srh[DayfgID][]', '');
formParams.append('srh[ClassTypeID][]', '');
formParams.append('srh[CollegeID][]', '');
formParams.append('srh[UnitID][]', '93');
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
formParams.append('tb_length', '2000');
formParams.append('tb_sel', '');
formParams.append('tb_cancel', '');

// 發送 POST 請求
(async () => {
  try {
    console.log("final", {
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

    // 輸出回應結果
    const html = await response.text();
    console.log(html);
    // now retrieve all Set-Cookie headers
  const raw = response.headers.raw();
  const setCookieHeaders = raw['set-cookie'] || [];
  console.log('Set-Cookie headers:', setCookieHeaders);
  } catch (error) {
    console.error('Request failed:', error);
  }
})();

