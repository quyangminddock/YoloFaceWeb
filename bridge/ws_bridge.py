#!/usr/bin/env python3
"""
OpenSeeFace WebSocket Bridge
将 OpenSeeFace 的 UDP 数据包转发到 WebSocket，供 Web 前端使用
"""

import asyncio
import json
import struct
import websockets
from collections import defaultdict

# 配置
UDP_IP = "127.0.0.1"
UDP_PORT = 11573
WS_HOST = "0.0.0.0"
WS_PORT = 8765

# WebSocket 客户端列表
clients = set()

def parse_openseeface_packet(data):
    """
    解析 OpenSeeFace UDP 数据包
    参考: https://github.com/emilianavt/OpenSeeFace
    """
    try:
        offset = 0
        
        # 读取时间戳 (double, 8 bytes)
        timestamp = struct.unpack_from('d', data, offset)[0]
        offset += 8
        
        # 读取 face ID (int, 4 bytes)
        face_id = struct.unpack_from('i', data, offset)[0]
        offset += 4
        
        # 读取分辨率 (float * 2, 8 bytes)
        width = struct.unpack_from('f', data, offset)[0]
        offset += 4
        height = struct.unpack_from('f', data, offset)[0]
        offset += 4

        # 读取眼睛眨眼数据 (float * 2, 8 bytes) - 之前缺失!
        eye_blink_left = struct.unpack_from('f', data, offset)[0]
        offset += 4
        eye_blink_right = struct.unpack_from('f', data, offset)[0]
        offset += 4

        # 读取是否检测到成功 (byte, 1 byte) - 注意是 B 不是 i
        success = struct.unpack_from('B', data, offset)[0]
        offset += 1
        
        # pnp error
        pnp_error = struct.unpack_from('f', data, offset)[0]
        offset += 4
        
        # quaternion (4 floats)
        quat = struct.unpack_from('ffff', data, offset)
        offset += 16
        
        # euler angles (3 floats)
        euler = struct.unpack_from('fff', data, offset)
        offset += 12
        
        # translation (3 floats)  
        translation = struct.unpack_from('fff', data, offset)
        offset += 12
        
        # 读取 68 个关键点
        # 格式：先 68 个 confidence，然后 68 对 (y, x) 坐标
        landmarks = []

        # 先读取 68 个 confidence 值
        confidences = []
        for i in range(68):
            conf = struct.unpack_from('f', data, offset)[0]
            offset += 4
            confidences.append(conf)

        # 再读取 68 对 (y, x) 坐标
        for i in range(68):
            y = struct.unpack_from('f', data, offset)[0]
            offset += 4
            x = struct.unpack_from('f', data, offset)[0]
            offset += 4
            landmarks.append({'x': x, 'y': y, 'confidence': confidences[i]})
        
        # 特征数据 (如果有的话)
        features = {}
        if len(data) > offset:
            # 眼睛开合度
            try:
                features['eyeLeft'] = struct.unpack_from('f', data, offset)[0]
                offset += 4
                features['eyeRight'] = struct.unpack_from('f', data, offset)[0]
                offset += 4
            except:
                pass
        
        return {
            'timestamp': timestamp,
            'faceId': face_id,
            'width': width,
            'height': height,
            'eyeBlinkLeft': eye_blink_left,
            'eyeBlinkRight': eye_blink_right,
            'success': success == 1,
            'quaternion': list(quat),
            'euler': list(euler),
            'translation': list(translation),
            'landmarks': landmarks,
            'features': features
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Parse error: {e}")
        return None

async def udp_listener():
    """监听 OpenSeeFace UDP 数据"""
    loop = asyncio.get_event_loop()
    
    # 创建 UDP socket
    transport, protocol = await loop.create_datagram_endpoint(
        lambda: UDPProtocol(),
        local_addr=(UDP_IP, UDP_PORT)
    )
    
    print(f"UDP listener started on {UDP_IP}:{UDP_PORT}")
    
    try:
        while True:
            await asyncio.sleep(1)
    finally:
        transport.close()

class UDPProtocol(asyncio.DatagramProtocol):
    def datagram_received(self, data, addr):
        # print(f"Received data: {len(data)} bytes") # Too noisy
        parsed = parse_openseeface_packet(data)
        if parsed:
            print(f"Parsed: success={parsed['success']}")
            if parsed['success']:
                # 广播到所有 WebSocket 客户端
                message = json.dumps(parsed)
                asyncio.create_task(broadcast(message))
            else:
                print("Tracking failed (success=0)")
        else:
            print(f"Failed to parse packet of size {len(data)}")

async def broadcast(message):
    """向所有连接的客户端广播消息"""
    if clients:
        await asyncio.gather(
            *[client.send(message) for client in clients],
            return_exceptions=True
        )

async def ws_handler(websocket, path=None):
    """处理 WebSocket 连接"""
    clients.add(websocket)
    print(f"Client connected. Total clients: {len(clients)}")
    
    try:
        async for message in websocket:
            # 可以处理来自客户端的消息
            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(websocket)
        print(f"Client disconnected. Total clients: {len(clients)}")

async def main():
    print("=" * 50)
    print("OpenSeeFace WebSocket Bridge")
    print("=" * 50)
    print(f"UDP listening on: {UDP_IP}:{UDP_PORT}")
    print(f"WebSocket server on: ws://{WS_HOST}:{WS_PORT}")
    print("-" * 50)
    print("Usage:")
    print("1. Start OpenSeeFace: python facetracker.py -c 0")
    print("2. Open the web interface in your browser")
    print("3. Click 'Connect' in the web interface")
    print("=" * 50)
    
    # 启动 WebSocket 服务器
    ws_server = await websockets.serve(ws_handler, WS_HOST, WS_PORT)
    
    # 启动 UDP 监听器
    udp_task = asyncio.create_task(udp_listener())
    
    # 运行
    await asyncio.gather(
        ws_server.wait_closed(),
        udp_task
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down...")
