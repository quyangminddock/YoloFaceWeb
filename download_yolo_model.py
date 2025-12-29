#!/usr/bin/env python3
"""
下载 YOLO 人脸检测模型
"""
from ultralytics import YOLO

print("正在下载 YOLOv8n 模型...")
model = YOLO('yolov8n.pt')  # 通用检测模型（包含人脸）
print("✅ 模型下载完成！")
