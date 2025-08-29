# NCNU IM Course
以 **Node.js** 後端 + **純前端頁面** + **資料蒐集/解析腳本** 組成的課程排程小系統。
資料來源（例如 NCNU SIS）可由 scripts/ 下的工具抓取並寫入 courses_data/，前端頁面讀取/顯示，後端提供靜態頁與 API（視 backend/server.js 實作而定）。

## 目錄結構
```bash=
.
│  .env                  # 服務環境變數（請依 .env.example 複製/填寫）
│  .env.example          # 環境變數範例
│  docker-compose.yml    # 以單一服務啟動（node: backend/server.js）
│  Dockerfile            # 建置 image，預設以 backend/server.js 為入口
│  package.json          # 有共用 package 可放這層
│  start_services.sh     #（測試）啟動/初始化腳本
│
├─backend
│      package.json
│      server.js         # 服務入口
│
├─courses_data
│      .gitkeep          # 課程資料產物放這裡（例如 114-1/ ...）
│
├─frontend
│  │  index.html
│  │  courses.html
│  │  upload.html
│  ├─css
│  │      style.css
│  └─js
│         app.js
│         courses.js
│         upload.js
│
└─scripts
       crawler.js        # 抓取原始資料
       parser.js         # 解析並轉成 csv
```

## Generate course infomations (csv) by crawling iNCNU
1. Download the repo: `git clone https://github.com/nora6633/IM_Course_Scheduling.git`

2. Get **XSRF-TOKEN** , **_session** , **_token** in `https://sis.ncnu.edu.tw/b09/b09120`
   <img width="647" height="577" alt="image" src="https://github.com/user-attachments/assets/f661492e-6b83-45c4-8cab-05e55bed430f" />

   <img width="655" height="512" alt="image" src="https://github.com/user-attachments/assets/387483aa-87d6-4a4f-883b-6dae3e64fd8b" />

   <img width="679" height="343" alt="image" src="https://github.com/user-attachments/assets/42aa1cf7-f28f-45ce-8150-f8974cebf2b8" />

3. Update the **XSRF-TOKEN** , **_session** , **_token**
   - `sudo vim .env`

4. Generate the course whichever you want: `sudo node scripts/parser.js --crawler --year <year> --semester <semester>`
   <img width="1210" height="329" alt="image" src="https://github.com/user-attachments/assets/37841529-5c1f-43ae-8643-347ce0c74c52" />

## Upload Workflow(Admin Only)
5. Initially,there is no course information in website
   - <img width="707" height="677" alt="image" src="https://github.com/user-attachments/assets/87149785-49f5-4b16-ba69-39bb91fd446e" />

6. Turn on OpenVPN,and click "課程資料上傳系統"
   - <img width="690" height="659" alt="image" src="https://github.com/user-attachments/assets/d109a856-659f-4c62-91bf-6acecb3fb470" />

7. Upload the csv file you just generated at Step4, and upload the Excel file also.
  - <img width="736" height="632" alt="image" src="https://github.com/user-attachments/assets/b9509dc8-3711-4a24-9e3e-d224d73fbdf3" />

8. Finally,you get courses informations from all semesters!

<img width="1920" height="1314" alt="圖片" src="https://github.com/user-attachments/assets/73f3aba1-2a85-494d-a49d-d7d8f1d59ead" />

