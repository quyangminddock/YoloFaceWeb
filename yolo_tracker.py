#!/usr/bin/env python3
"""
YOLO + MediaPipe 人脸追踪器
替换 OpenSeeFace，使用现代化的模型
"""

import cv2
import numpy as np
import socket
import struct
import time
import mediapipe as mp

class YOLOFaceTracker:
    def __init__(self, camera_id=0, width=1280, height=720, target_ip="127.0.0.1", target_port=11573):
        self.camera_id = camera_id
        self.width = width
        self.height = height
        self.target_ip = target_ip
        self.target_port = target_port

        # 初始化摄像头
        print("正在打开摄像头...")
        self.cap = cv2.VideoCapture(camera_id)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

        # macOS 摄像头初始化修复
        import sys
        if sys.platform == 'darwin':
            print("等待 macOS 摄像头初始化...")
            time.sleep(2)
            for i in range(10):
                self.cap.read()
                time.sleep(0.1)
            print("✅ 摄像头初始化完成")

        # 不使用 YOLO，直接用 MediaPipe 检测
        # MediaPipe 已经包含了人脸检测功能
        print("✅ 使用 MediaPipe 进行人脸检测和关键点提取")
        self.yolo = None

        # 初始化 MediaPipe Face Mesh (新 API)
        print("初始化 MediaPipe Face Landmarker...")
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        # 创建 Face Landmarker
        base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.face_landmarker = vision.FaceLandmarker.create_from_options(options)

        # UDP socket
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

        print(f"✅ 初始化完成！发送数据到 {target_ip}:{target_port}")

    def mediapipe_to_68_points(self, landmarks, frame_width, frame_height):
        """
        将 MediaPipe 的 478 点转换为 iBUG 标准的 68 点
        """
        # MediaPipe 到 iBUG 68 点的映射（与 cameraTracker.js 中一致）
        mapping = {
            # 面部轮廓 (0-16)
            0: 10, 1: 338, 2: 297, 3: 332, 4: 284,
            5: 251, 6: 389, 7: 356, 8: 454, 9: 323,
            10: 361, 11: 288, 12: 397, 13: 365, 14: 379,
            15: 378, 16: 400,
            # 左眉毛 (17-21)
            17: 70, 18: 63, 19: 105, 20: 66, 21: 107,
            # 右眉毛 (22-26)
            22: 336, 23: 296, 24: 334, 25: 293, 26: 300,
            # 鼻梁 (27-30)
            27: 168, 28: 6, 29: 197, 30: 195,
            # 鼻底 (31-35)
            31: 98, 32: 97, 33: 2, 34: 326, 35: 327,
            # 左眼 (36-41)
            36: 33, 37: 160, 38: 158, 39: 133, 40: 153, 41: 144,
            # 右眼 (42-47)
            42: 362, 43: 385, 44: 387, 45: 263, 46: 373, 47: 380,
            # 外嘴唇 (48-59)
            48: 61, 49: 39, 50: 37, 51: 0, 52: 267, 53: 269,
            54: 291, 55: 405, 56: 314, 57: 17, 58: 84, 59: 181,
            # 内嘴唇 (60-67)
            60: 78, 61: 82, 62: 13, 63: 312, 64: 308,
            65: 317, 66: 14, 67: 87
        }

        points_68 = []
        for i in range(68):
            mp_idx = mapping[i]
            if mp_idx < len(landmarks):
                lm = landmarks[mp_idx]
                x = lm.x * frame_width
                y = lm.y * frame_height
                points_68.append((x, y, 1.0))  # (x, y, confidence)
            else:
                points_68.append((0, 0, 0))

        return points_68

    def estimate_head_pose(self, landmarks_68):
        """
        简化的头部姿态估计（返回欧拉角）
        """
        # 使用关键点估算头部旋转
        # 这里用简单的几何计算，你可以用 PnP 求解更精确

        # 提取关键点
        nose_tip = np.array(landmarks_68[30][:2])  # 鼻尖
        left_eye = np.array(landmarks_68[36][:2])  # 左眼外角
        right_eye = np.array(landmarks_68[45][:2]) # 右眼外角
        chin = np.array(landmarks_68[8][:2])       # 下巴

        # 计算眼睛中心
        eye_center = (left_eye + right_eye) / 2

        # Yaw (左右转头)
        eye_width = np.linalg.norm(right_eye - left_eye)
        nose_offset = nose_tip[0] - eye_center[0]
        yaw = (nose_offset / eye_width) * 45  # 粗略估计，范围 ±45°

        # Pitch (上下点头)
        face_height = np.linalg.norm(chin - eye_center)
        nose_to_eye = nose_tip[1] - eye_center[1]
        pitch = (nose_to_eye / face_height - 0.4) * 60  # 粗略估计

        # Roll (左右歪头)
        roll = np.arctan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]) * 180 / np.pi

        return [pitch, yaw, roll]

    def quaternion_from_euler(self, pitch, yaw, roll):
        """
        从欧拉角转换为四元数
        """
        # 转换为弧度
        pitch_rad = pitch * np.pi / 180
        yaw_rad = yaw * np.pi / 180
        roll_rad = roll * np.pi / 180

        cy = np.cos(yaw_rad * 0.5)
        sy = np.sin(yaw_rad * 0.5)
        cp = np.cos(pitch_rad * 0.5)
        sp = np.sin(pitch_rad * 0.5)
        cr = np.cos(roll_rad * 0.5)
        sr = np.sin(roll_rad * 0.5)

        w = cr * cp * cy + sr * sp * sy
        x = sr * cp * cy - cr * sp * sy
        y = cr * sp * cy + sr * cp * sy
        z = cr * cp * sy - sr * sp * cy

        return [w, x, y, z]

    def send_tracking_data(self, landmarks_68, euler, frame_width, frame_height):
        """
        发送追踪数据到 UDP socket（兼容 OpenSeeFace 格式）
        """
        packet = bytearray()

        # 时间戳 (double, 8 bytes)
        packet.extend(struct.pack("d", time.time()))

        # Face ID (int, 4 bytes)
        packet.extend(struct.pack("i", 0))

        # 分辨率 (float * 2, 8 bytes)
        packet.extend(struct.pack("f", float(frame_width)))
        packet.extend(struct.pack("f", float(frame_height)))

        # 眼睛眨眼数据 (float * 2, 8 bytes) - 暂时用固定值
        packet.extend(struct.pack("f", 1.0))  # left eye open
        packet.extend(struct.pack("f", 1.0))  # right eye open

        # Success (byte, 1 byte)
        packet.extend(struct.pack("B", 1))

        # PnP error (float, 4 bytes)
        packet.extend(struct.pack("f", 0.1))

        # Quaternion (4 floats, 16 bytes)
        quat = self.quaternion_from_euler(*euler)
        for q in quat:
            packet.extend(struct.pack("f", q))

        # Euler angles (3 floats, 12 bytes)
        for angle in euler:
            packet.extend(struct.pack("f", angle))

        # Translation (3 floats, 12 bytes) - 暂时用固定值
        packet.extend(struct.pack("f", 0.0))
        packet.extend(struct.pack("f", 0.0))
        packet.extend(struct.pack("f", 0.0))

        # 68 个关键点：先 confidence，再 (y, x)
        # 先发送 68 个 confidence
        for (x, y, c) in landmarks_68:
            packet.extend(struct.pack("f", c))

        # 再发送 68 对 (y, x) 坐标
        for (x, y, c) in landmarks_68:
            packet.extend(struct.pack("f", y))
            packet.extend(struct.pack("f", x))

        # 发送数据包
        self.sock.sendto(packet, (self.target_ip, self.target_port))

    def run(self, visualize=True):
        """
        运行追踪循环
        """
        print("\n开始追踪... 按 'q' 退出\n")

        frame_count = 0
        fps_start = time.time()

        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    print("❌ 无法读取帧")
                    break

                frame_count += 1

                # MediaPipe 人脸检测和关键点提取 (新 API)
                import mediapipe as mp
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

                detection_result = self.face_landmarker.detect(mp_image)

                detected = False

                if detection_result.face_landmarks:
                    face_landmarks = detection_result.face_landmarks[0]

                    # 转换为 68 点
                    landmarks_68 = self.mediapipe_to_68_points(
                        face_landmarks, frame.shape[1], frame.shape[0]
                    )

                    # DEBUG: 打印前几个关键点
                    if frame_count % 30 == 0:
                        print(f"\nDEBUG 关键点示例:")
                        print(f"  鼻尖(30): x={landmarks_68[30][0]:.1f}, y={landmarks_68[30][1]:.1f}")
                        print(f"  左眼(36): x={landmarks_68[36][0]:.1f}, y={landmarks_68[36][1]:.1f}")
                        print(f"  右眼(45): x={landmarks_68[45][0]:.1f}, y={landmarks_68[45][1]:.1f}")
                        print(f"  帧大小: {frame.shape[1]}x{frame.shape[0]}")

                    # 估算头部姿态
                    euler = self.estimate_head_pose(landmarks_68)

                    # 发送追踪数据
                    self.send_tracking_data(landmarks_68, euler, frame.shape[1], frame.shape[0])

                    detected = True

                    # 可视化
                    if visualize:
                        for (x, y, c) in landmarks_68:
                            cv2.circle(frame, (int(x), int(y)), 2, (0, 255, 0), -1)

                        # 显示姿态信息
                        cv2.putText(frame, f"Pitch: {euler[0]:.1f}", (10, 30),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                        cv2.putText(frame, f"Yaw: {euler[1]:.1f}", (10, 60),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                        cv2.putText(frame, f"Roll: {euler[2]:.1f}", (10, 90),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                # 计算 FPS
                if frame_count % 30 == 0:
                    elapsed = time.time() - fps_start
                    fps = 30 / elapsed if elapsed > 0 else 0
                    print(f"FPS: {fps:.1f} | 检测: {'✅' if detected else '❌'}")
                    fps_start = time.time()

                # 显示画面
                if visualize:
                    cv2.imshow('YOLO Face Tracker', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

        except KeyboardInterrupt:
            print("\n用户中断")

        finally:
            self.cap.release()
            cv2.destroyAllWindows()
            self.sock.close()
            print("追踪器已关闭")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="YOLO + MediaPipe 人脸追踪器")
    parser.add_argument("-c", "--camera", type=int, default=0, help="摄像头 ID")
    parser.add_argument("-W", "--width", type=int, default=1280, help="宽度")
    parser.add_argument("-H", "--height", type=int, default=720, help="高度")
    parser.add_argument("-i", "--ip", default="127.0.0.1", help="目标 IP")
    parser.add_argument("-p", "--port", type=int, default=11573, help="目标端口")
    parser.add_argument("--no-visualize", action="store_true", help="禁用可视化")

    args = parser.parse_args()

    tracker = YOLOFaceTracker(
        camera_id=args.camera,
        width=args.width,
        height=args.height,
        target_ip=args.ip,
        target_port=args.port
    )

    tracker.run(visualize=not args.no_visualize)
