#!/usr/bin/env python3
"""
测试 OpenSeeFace 检测器
"""
import cv2
import numpy as np
import time

print("正在打开摄像头...")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ 无法打开摄像头")
    exit(1)

# 初始化
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("等待摄像头初始化...")
time.sleep(2)
for i in range(10):
    cap.read()
    time.sleep(0.1)

print("✅ 摄像头初始化完成")

# 加载 OpenSeeFace 检测器
import sys
sys.path.insert(0, 'OpenSeeFace')
from tracker import Tracker

print("加载 Tracker...")
tracker = Tracker(640, 480, threshold=None, max_threads=1, max_faces=1,
                  detection_threshold=0.01, use_retinaface=0, model_type=3)

print("\n开始检测:")

for i in range(30):
    ret, frame = cap.read()
    if not ret:
        print("❌ 无法读取帧")
        continue

    # 检查画面亮度
    brightness = np.mean(frame)

    # 运行检测
    faces = tracker.predict(frame)

    print(f"帧 {i+1}: 亮度={brightness:.2f}, 检测到人脸数={len(faces)}")

    if len(faces) > 0:
        print(f"  ✅ 成功！置信度: {faces[0].conf:.4f}")
        break

    time.sleep(0.1)

cap.release()
print("\n测试结束")
