#!/usr/bin/env python3
"""
简单的摄像头测试脚本
"""
import cv2
import numpy as np

print("正在打开摄像头...")

# 尝试摄像头 0
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ 无法打开摄像头 0，尝试摄像头 1...")
    cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("❌ 摄像头打开失败！")
    exit(1)

print("✅ 摄像头已打开")

# 尝试设置摄像头参数
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)  # 启用自动曝光
cap.set(cv2.CAP_PROP_EXPOSURE, -1)  # 自动
cap.set(cv2.CAP_PROP_BRIGHTNESS, 128)  # 增加亮度
cap.set(cv2.CAP_PROP_CONTRAST, 128)  # 增加对比度
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))  # 使用 MJPEG 格式

print(f"分辨率: {cap.get(cv2.CAP_PROP_FRAME_WIDTH)}x{cap.get(cv2.CAP_PROP_FRAME_HEIGHT)}")
print(f"曝光: {cap.get(cv2.CAP_PROP_EXPOSURE)}")
print(f"亮度: {cap.get(cv2.CAP_PROP_BRIGHTNESS)}")

# 等待摄像头初始化
print("等待摄像头初始化...")
import time
time.sleep(2)

# 尝试读取几帧来"预热"摄像头
for i in range(10):
    ret, _ = cap.read()
    print(f"预热帧 {i+1}/10: {'✅' if ret else '❌'}")
    time.sleep(0.1)

print("\n开始正常读取:")

while True:
    ret, frame = cap.read()

    if not ret:
        print("❌ 无法读取帧")
        break

    # 检查画面
    mean_brightness = np.mean(frame)
    print(f"画面平均亮度: {mean_brightness:.2f} (0=全黑, 255=全白, 正常应在30-200之间)")

    cv2.imshow('Camera Test', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("按 q 退出")
        break

cap.release()
cv2.destroyAllWindows()
print("测试结束")
