#!/usr/bin/env python3
"""
列出所有可用摄像头
"""
import cv2

print("正在检测摄像头...\n")

for i in range(10):  # 检查 0-9
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        # 读取一帧来确认
        ret, frame = cap.read()
        if ret:
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            print(f"✅ 摄像头 {i}: {width}x{height}")
        else:
            print(f"⚠️  摄像头 {i}: 可以打开但无法读取帧")
        cap.release()
    else:
        # 第一个失败后就停止检查
        if i > 0:
            break

print("\n完成！")
