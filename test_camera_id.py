#!/usr/bin/env python3
"""
测试指定 ID 的摄像头
"""
import cv2
import sys

if len(sys.argv) < 2:
    print("用法: python test_camera_id.py <摄像头ID>")
    print("示例: python test_camera_id.py 0")
    sys.exit(1)

camera_id = int(sys.argv[1])

print(f"\n正在测试摄像头 {camera_id}...")
print("请观察画面是哪个摄像头")
print("按 'q' 退出\n")

cap = cv2.VideoCapture(camera_id)

if not cap.isOpened():
    print(f"❌ 无法打开摄像头 {camera_id}")
    sys.exit(1)

print(f"✅ 摄像头 {camera_id} 已打开")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ 无法读取帧")
        break

    # 在画面上显示摄像头 ID
    cv2.putText(frame, f"Camera ID: {camera_id}", (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3)

    cv2.imshow(f'Camera {camera_id} Test', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print(f"\n摄像头 {camera_id} 测试结束")
