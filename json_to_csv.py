#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import csv
import re

def json_to_csv(json_file, csv_file):
    """將JSON檔案轉換為CSV檔案，包含SemesterCourseName欄位"""
    
    # 讀取JSON檔案
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    courses = data['courses']
    
    # 準備CSV檔案
    with open(csv_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        
        # 寫入標題行
        header = [
            '課程編號', '課程名稱', '英文名稱', '班級', '修別', '學分', 
            '系所', '學制', '開課年級', '任課教師', '上課時間', '上課教室', 
            '授課語言', '選別', '備註', 'SemesterCourseName'
        ]
        writer.writerow(header)
        
        # 寫入課程資料
        for course in courses:
            # 處理任課教師欄位（如有逗號則加雙引號）
            teacher = course.get('Teacher', '')
            if ',' in teacher:
                teacher = f'"{teacher}"'
            
            # 處理課程名稱（移除HTML標籤）
            course_name = re.sub(r'<[^>]*>', '', course.get('SemesterCourseName', ''))
            
            row = [
                course.get('CourseNo', ''),
                course_name,
                course.get('SemesterCourseENGName', ''),
                course.get('StudyClassName', ''),
                course.get('CourseClassName', ''),
                course.get('Credit', ''),
                course.get('UnitName', ''),
                course.get('DayfgClassTypeName', ''),
                course.get('Grade', ''),
                teacher,
                course.get('SemCourseTime', ''),
                course.get('ClassRoom', ''),
                course.get('TeaLanguage', ''),
                course.get('Choose', ''),
                course.get('Memo', ''),
                course.get('SemesterCourseName', '')
            ]
            writer.writerow(row)
    
    print(f"已成功將 {json_file} 轉換為 {csv_file}")
    print(f"共處理 {len(courses)} 筆課程資料")

if __name__ == "__main__":
    json_to_csv('courses_unknown_上學期.json', 'courses_114_1_with_links.csv') 