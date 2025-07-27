#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import re
import html
from pathlib import Path

def read_temp_file(file_name='temp'):
    """讀取temp檔案"""
    try:
        with open(file_name, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"錯誤: 找不到檔案 {file_name}")
        return None
    except Exception as e:
        print(f"讀取檔案失敗: {e}")
        return None

def extract_json_data(html_content):
    """從HTML內容中提取JSON資料"""
    try:
        # 尋找包含課程資料的JavaScript變數
        pattern = r'var\s+data\s*=\s*(\[.*?\]);'
        match = re.search(pattern, html_content, re.DOTALL)
        
        if not match:
            print("錯誤: 在HTML中找不到課程資料")
            return None
        
        json_str = match.group(1)
        data = json.loads(json_str)
        print(f"成功提取到 {len(data)} 筆課程資料")
        return data
        
    except Exception as e:
        print(f"解析JSON資料失敗: {e}")
        return None

def extract_semester_info(html_content):
    """提取學年和學期資訊"""
    semester_info = {
        'academicYear': '未知學年',
        'semester': '未知學期',
        'department': '未知系所'
    }
    
    # 尋找學年資訊
    year_match = re.search(r'(\d{3})學年', html_content)
    if year_match:
        semester_info['academicYear'] = year_match.group(1)
    
    # 尋找學期資訊
    semester_match = re.search(r'([上下])學期', html_content)
    if semester_match:
        semester_info['semester'] = semester_match.group(1) + '學期'
    
    # 尋找系所資訊
    dept_match = re.search(r'資訊管理學系', html_content)
    if dept_match:
        semester_info['department'] = '資訊管理學系'
    
    return semester_info

def decode_unicode(text):
    """解碼Unicode轉義序列"""
    return html.unescape(text)

def process_course_data(data):
    """處理課程資料"""
    courses = []
    
    for item in data:
        course = {}
        
        # 解碼Unicode轉義序列
        for key, value in item.items():
            if isinstance(value, str):
                course[key] = decode_unicode(value)
            else:
                course[key] = value
        
        courses.append(course)
    
    return courses

def format_course_info(courses, semester_info):
    """格式化輸出課程資訊"""
    year_text = f"{semester_info['academicYear']}學年" if semester_info['academicYear'] != '未知學年' else '未知學年'
    semester_text = semester_info['semester'] or '未知學期'
    dept_text = semester_info['department'] or '未知系所'
    
    print(f"=== {year_text}{semester_text} {dept_text}課程資訊 ===\n")
    
    for i, course in enumerate(courses, 1):
        print(f"{i}. 課程編號: {course.get('CourseNo', 'N/A')}")
        print(f"   課程名稱: {course.get('SemesterCourseName', 'N/A').replace('<[^>]*>', '')}")
        print(f"   英文名稱: {course.get('SemesterCourseENGName', 'N/A')}")
        print(f"   班級: {course.get('StudyClassName', '無')}")
        print(f"   修別: {course.get('CourseClassName', 'N/A')}")
        print(f"   學分: {course.get('Credit', 'N/A')}")
        print(f"   系所: {course.get('UnitName', 'N/A')}")
        print(f"   學制: {course.get('DayfgClassTypeName', 'N/A')}")
        print(f"   開課年級: {course.get('Grade', 'N/A')}")
        print(f"   任課教師: {course.get('Teacher', 'N/A')}")
        print(f"   上課時間: {course.get('SemCourseTime', '無')}")
        print(f"   上課教室: {course.get('ClassRoom', '無')}")
        print(f"   授課語言: {course.get('TeaLanguage', 'N/A')}")
        print(f"   選別: {course.get('Choose', 'N/A')}")
        print(f"   備註: {course.get('Memo', '無')}")
        print("   ---")

def save_decoded_data(courses, semester_info, output_prefix=''):
    """儲存解碼後的資料到檔案"""
    try:
        year_text = f"{semester_info['academicYear']}學年" if semester_info['academicYear'] != '未知學年' else '未知學年'
        semester_text = semester_info['semester'] or '未知學期'
        dept_text = semester_info['department'] or '未知系所'
        
        output_data = {
            'semester': f"{year_text}{semester_text}",
            'department': dept_text,
            'totalCourses': len(courses),
            'courses': courses
        }
        
        # 使用學年和學期資訊來命名檔案
        file_name = f"{output_prefix}courses_{semester_info.get('academicYear', 'unknown')}_{semester_info.get('semester', 'unknown')}"
        
        # 儲存JSON檔案
        with open(f"{file_name}.json", 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        print(f"\n解碼後的課程資料已儲存到 {file_name}.json")
        
        # 儲存CSV檔案
        csv_header = '課程編號,課程名稱,英文名稱,班級,修別,學分,系所,學制,開課年級,任課教師,上課時間,上課教室,授課語言,選別,備註,SemesterCourseName\n'
        
        csv_content = []
        for course in courses:
            # 處理任課教師欄位（如有逗號則加雙引號）
            teacher = course.get('Teacher', '')
            if ',' in teacher:
                teacher = f'"{teacher.replace('"', '""')}"'
            
            # 處理課程名稱（移除HTML標籤）
            course_name = re.sub(r'<[^>]*>', '', course.get('SemesterCourseName', ''))
            
            row = [
                course.get('CourseNo', ''),
                f'"{course_name}"',
                f'"{course.get("SemesterCourseENGName", "")}"',
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
                f'"{course.get("Memo", "")}"',
                f'"{course.get("SemesterCourseName", "")}"'
            ]
            csv_content.append(','.join(row))
        
        with open(f"{file_name}.csv", 'w', encoding='utf-8') as f:
            f.write(csv_header + '\n'.join(csv_content))
        print(f"解碼後的課程資料已儲存到 {file_name}.csv")
        
    except Exception as error:
        print(f'儲存檔案失敗: {error}')

def show_usage():
    """顯示使用說明"""
    print("""
課程資料解碼工具

使用方法:
  python3 decode_courses.py [輸入檔案] [輸出前綴]

參數:
  輸入檔案    要解碼的檔案名稱 (預設: temp)
  輸出前綴    輸出檔案的前綴 (可選)

範例:
  python3 decode_courses.py                    # 解碼 temp 檔案
  python3 decode_courses.py temp1              # 解碼 temp1 檔案
  python3 decode_courses.py temp1 114_1_       # 解碼 temp1 檔案，輸出檔案前綴為 114_1_

輸出檔案:
  - courses_[學年]_[學期].json  (JSON格式)
  - courses_[學年]_[學期].csv   (CSV格式)
""")

def main():
    """主函數"""
    # 解析命令行參數
    args = sys.argv[1:]
    
    if '--help' in args or '-h' in args:
        show_usage()
        return
    
    input_file = args[0] if args else 'temp'
    output_prefix = args[1] if len(args) > 1 else ''
    
    print("開始解碼課程資料...\n")
    print(f"輸入檔案: {input_file}")
    if output_prefix:
        print(f"輸出前綴: {output_prefix}")
    print()
    
    # 讀取temp檔案
    html_content = read_temp_file(input_file)
    if not html_content:
        return
    
    # 提取學年和學期資訊
    semester_info = extract_semester_info(html_content)
    print('提取到的學期資訊:', semester_info)
    
    # 提取JSON資料
    data = extract_json_data(html_content)
    if not data:
        return
    
    # 處理課程資料
    courses = process_course_data(data)
    
    # 格式化輸出課程資訊
    format_course_info(courses, semester_info)
    
    # 儲存解碼後的資料
    save_decoded_data(courses, semester_info, output_prefix)

if __name__ == "__main__":
    main() 