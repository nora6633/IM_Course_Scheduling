# NCNU IM Course

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

<img width="1328" height="790" alt="image" src="https://github.com/user-attachments/assets/134b91dd-d778-4e12-926e-3bf6fff41f79" />

