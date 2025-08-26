// API 配置
const API_BASE_URL = '/api';

// 上傳 CSV 檔案
async function uploadCsvFile() {
    const fileInput = document.getElementById('csvFile');
    const resultDiv = document.getElementById('csvResult');
    const uploadBtn = document.getElementById('uploadCsvBtn');
    
    if (!fileInput.files[0]) {
        showResult(resultDiv, 'error', '請選擇要上傳的 CSV 檔案');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = '上傳中...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload-csv`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showResult(resultDiv, 'success', 
                `CSV 檔案上傳成功！<br>
                 年份學期：${result.yearSemester}<br>
                 課程數量：${result.totalCourses}<br>
                 儲存路徑：${result.savedPath}`);
            fileInput.value = '';
        } else {
            showResult(resultDiv, 'error', result.error || '上傳失敗');
        }
    } catch (error) {
        console.error('上傳錯誤:', error);
        if (error.message.includes('403')) {
            showResult(resultDiv, 'error', '訪問被拒絕：僅限管理員 IP 上傳檔案');
        } else {
            showResult(resultDiv, 'error', '網路錯誤，請檢查連線');
        }
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '上傳 CSV 檔案';
    }
}

// 上傳 Excel 檔案
async function uploadExcelFile() {
    const fileInput = document.getElementById('excelFile');
    const resultDiv = document.getElementById('excelResult');
    const uploadBtn = document.getElementById('uploadExcelBtn');
    
    if (!fileInput.files[0]) {
        showResult(resultDiv, 'error', '請選擇要上傳的 Excel 檔案');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = '上傳中...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload-excel`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showResult(resultDiv, 'success', 
                `Excel 檔案上傳成功！<br>
                 年份學期：${result.yearSemester}<br>
                 資料筆數：${result.totalRows}<br>
                 儲存路徑：${result.savedPath}`);
            fileInput.value = '';
        } else {
            showResult(resultDiv, 'error', result.error || '上傳失敗');
        }
    } catch (error) {
        console.error('上傳錯誤:', error);
        if (error.message.includes('403')) {
            showResult(resultDiv, 'error', '訪問被拒絕：僅限管理員 IP 上傳檔案');
        } else {
            showResult(resultDiv, 'error', '網路錯誤，請檢查連線');
        }
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '上傳 Excel 檔案';
    }
}

// 顯示結果訊息
function showResult(element, type, message) {
    element.className = `result-message ${type}`;
    element.innerHTML = message;
    element.style.display = 'block';
    
    // 5 秒後自動隱藏成功訊息
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('uploadCsvBtn').addEventListener('click', uploadCsvFile);
    document.getElementById('uploadExcelBtn').addEventListener('click', uploadExcelFile);
    
    // 檔案選擇變更時隱藏之前的結果訊息
    document.getElementById('csvFile').addEventListener('change', function() {
        document.getElementById('csvResult').style.display = 'none';
    });
    
    document.getElementById('excelFile').addEventListener('change', function() {
        document.getElementById('excelResult').style.display = 'none';
    });
});