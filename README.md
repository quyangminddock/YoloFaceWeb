# YoloFaceWeb 🎭

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/status-beta-blue)](https://github.com/quyangminddock/YoloFaceWeb)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-v0.10+-green)](https://google.github.io/mediapipe/)

现代化的 Web 虚拟形象系统，支持**纯浏览器模式**和**高精度 Python 追踪模式**，适用于 VTuber、视频制作和虚拟形象动画。

![Preview](https://img.shields.io/badge/preview-coming_soon-orange)

## 🌟 系统优势

与传统 VTuber 方案对比：

| 特性 | YoloFaceWeb | 传统 VTuber 方案 |
|------|-------------|------------------|
| **零配置使用** | ✅ 打开浏览器即用 | ❌ 需要安装软件 |
| **跨平台支持** | ✅ Windows/Mac/Linux | ⚠️ 通常仅支持 Windows |
| **部署成本** | ✅ 完全免费开源 | ❌ 商业软件收费 |
| **追踪精度** | 🎯 MediaPipe 478 点 | 📍 通常 68-70 点 |
| **双模式** | ✅ 浏览器 + Python | ❌ 单一模式 |
| **实时录制** | ✅ WebM/MP4/GIF | ⚠️ 依赖第三方软件 |
| **特效系统** | ✅ 内置滤镜+装饰物 | ❌ 需要后期处理 |
| **二次开发** | ✅ 开源可定制 | ❌ 闭源黑盒 |

## ✨ 核心特性

### 🚀 双追踪模式
- **浏览器模式** (推荐新手)
  - 零安装，打开即用
  - MediaPipe Face Mesh（478 个面部关键点）
  - 支持所有现代浏览器（Chrome、Edge、Safari）

- **Python 后端模式** (专业用户)
  - 更高追踪精度
  - 3D 头部姿态估计（Pitch/Yaw/Roll）
  - 眨眼检测（EAR 算法）
  - 支持多摄像头选择

### 🎨 虚拟形象与特效
- 🐱 **6 种预设形象**: 猫、狗、兔子、熊猫、狐狸、小熊
- 🎭 **装饰物系统**: 眼镜、墨镜、帽子、皇冠、粒子特效
- ✨ **实时滤镜**: 发光、彩虹、霓虹灯、复古等
- 🌈 **多彩背景**: 6 种渐变主题

### 📹 录制与导出
- 🎬 **视频录制**: WebM/MP4 格式
- 📸 **截图功能**: 一键保存 PNG
- 🎞️ **GIF 生成**: 循环动画导出
- ⛶ **全屏模式**: 沉浸式体验

### 🎮 交互功能
- 🪞 镜像翻转
- 👁️ 关键点可视化
- 🎚️ 实时参数调节
- ⚙️ 自定义设置保存

## 🚀 快速开始

### 方式一：浏览器模式（零配置，5 秒启动）

**适合人群**: 新手、快速体验、无需安装任何软件

```bash
# 1. 克隆项目
git clone https://github.com/quyangminddock/YoloFaceWeb.git
cd YoloFaceWeb

# 2. 直接打开
open index.html  # macOS
# 或双击 index.html 文件

# 3. 点击 📷 摄像头按钮
# 4. 授权摄像头权限
# 5. 完成！开始玩耍 🎉
```

**系统架构**:
```
浏览器 MediaPipe (JS)
    ↓
面部追踪 (478 点)
    ↓
Canvas 渲染 (60fps)
    ↓
虚拟形象动画
```

### 方式二：Python 后端模式（高精度，专业用户）

**适合人群**: 专业 VTuber、需要 3D 姿态、高精度追踪

**安装步骤**:

```bash
# 1. 克隆项目
git clone https://github.com/quyangminddock/YoloFaceWeb.git
cd YoloFaceWeb

# 2. 安装 Python 依赖
pip install opencv-python mediapipe numpy websockets

# 3. 下载 MediaPipe 模型（仅首次）
# 从 https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
# 下载并放置到项目根目录

# 4. 启动 Python 追踪器（终端 1）
python yolo_tracker.py -c 0  # 0 是摄像头 ID

# 5. 启动 WebSocket 桥接（终端 2）
cd bridge
python ws_bridge.py

# 6. 打开浏览器（终端 3）
open index.html

# 7. 点击 🔗 连接追踪器 按钮
```

**系统架构**:
```
摄像头
  ↓
Python MediaPipe (478 点)
  ↓
姿态估计 (Pitch/Yaw/Roll)
  ↓
UDP (端口 11573)
  ↓
WebSocket 桥接 (端口 8765)
  ↓
浏览器 Canvas
  ↓
虚拟形象动画
```

## 📁 项目结构

```
YoloFaceWeb/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件（玻璃态设计）
├── js/
│   ├── app.js              # 主应用控制器
│   ├── faceRenderer.js     # 面部关键点渲染引擎
│   ├── avatar.js           # 虚拟形象系统（6 种形象）
│   ├── effects.js          # 特效系统（滤镜+装饰物）
│   ├── recorder.js         # 录制功能（Video/GIF）
│   └── cameraTracker.js    # 浏览器 MediaPipe 集成
├── bridge/
│   └── ws_bridge.py        # UDP → WebSocket 桥接
├── yolo_tracker.py         # MediaPipe 追踪器（Python）
├── list_cameras.py         # 摄像头枚举工具
├── test_camera_id.py       # 摄像头测试工具
└── README.md
```

## 🎮 使用说明

### 控制面板

| 按钮 | 功能 | 快捷键 |
|------|------|--------|
| 📷 摄像头 | 启动/关闭浏览器摄像头追踪 | - |
| 🔗 连接追踪器 | 连接 Python 后端（需先启动） | - |
| 🎬 演示 | 演示模式（无需摄像头） | - |
| 🪞 镜像 | 切换镜像翻转 | M |
| 👁️ 关键点 | 显示/隐藏面部关键点 | K |
| ⏺️ 录制 | 开始/停止录制视频 | R |
| 📸 截图 | 保存当前画面 | S |
| 🎞️ GIF | 生成 GIF 动画（3 秒） | G |
| ⛶ 全屏 | 全屏模式 | F |
| ⚙️ 设置 | 打开设置面板 | - |

### 虚拟形象选择

左侧面板提供 6 种预设形象：
- 🐱 **小猫咪** - 可爱风格，适合萌系 VTuber
- 🐶 **小狗狗** - 活泼阳光
- 🐰 **小兔子** - 优雅清新
- 🐼 **熊猫** - 憨态可掬
- 🦊 **小狐狸** - 灵动俏皮
- 🐻 **小熊** - 温暖治愈

### 装饰物与特效

右侧面板提供：
- **配饰**: 👓 眼镜、🕶️ 墨镜、🎩 礼帽、👑 皇冠
- **粒子**: 💕 爱心、⭐ 星星、✨ 闪烁
- **滤镜**: 发光、彩虹、霓虹灯、复古、黑白

### 设置选项

点击 ⚙️ 设置可调整：
- **WebSocket 服务器**: `ws://localhost:8765`（默认）
- **画布分辨率**: 480p / 720p / 1080p
- **录制格式**: WebM / MP4
- **形象平滑度**: 0.1 - 1.0（值越小越平滑）
- **自动连接**: 启动时自动连接追踪器

## 🔧 技术架构

### 浏览器端技术栈
- **MediaPipe Face Mesh**: 478 个 3D 面部关键点
- **Canvas 2D API**: 60fps 实时渲染
- **MediaRecorder API**: 视频/GIF 录制
- **WebSocket API**: 实时数据通信

### Python 后端技术栈
- **MediaPipe (Python)**: 面部检测与关键点提取
- **OpenCV**: 摄像头捕获与图像处理
- **NumPy**: 数值计算与姿态估计
- **WebSockets**: 实时数据传输

### 关键算法

**1. MediaPipe 478 点 → iBUG 68 点映射**
```python
# 关键点映射表（cameraTracker.js 和 yolo_tracker.py）
mapping = {
    # 面部轮廓 (0-16)
    0: 10, 1: 338, 2: 297, 3: 332, 4: 284,
    # ... 省略其余 63 个点
}
```

**2. 头部姿态估计（欧拉角）**
```python
# yolo_tracker.py:108
def estimate_head_pose(landmarks_68):
    # 提取关键点：鼻尖、眼睛、下巴
    # 计算 Yaw（左右）、Pitch（上下）、Roll（倾斜）
    return [pitch, yaw, roll]
```

**3. 眨眼检测（EAR 算法）**
```javascript
// app.js - 基于眼睛长宽比
EAR = (vertical_dist1 + vertical_dist2) / (2.0 * horizontal_dist)
// EAR < 0.2 时判定为眨眼
```

**4. 坐标缩放（多分辨率适配）**
```javascript
// app.js:handleTrackingData
const scaleX = canvas.width / sourceWidth;
const scaleY = canvas.height / sourceHeight;
scaledLandmarks = landmarks.map(p => ({
    x: p.x * scaleX,
    y: p.y * scaleY
}));
```

## 🛠️ 常见问题 (FAQ)

### Q1: 浏览器模式关键点不准确？
**A**: 确保光线充足，面部正对摄像头。如果关键点偏移，检查浏览器控制台是否有错误信息。

### Q2: Python 模式摄像头显示黑屏（macOS）？
**A**: macOS 摄像头需要初始化时间。已在 `yolo_tracker.py` 中添加修复：
```python
# yolo_tracker.py:28-36
if sys.platform == 'darwin':
    time.sleep(2)  # 等待初始化
    for i in range(10):  # 读取 10 帧预热
        self.cap.read()
```

### Q3: 多个摄像头如何选择？
**A**: 使用工具脚本枚举和测试：
```bash
# 列出所有摄像头
python list_cameras.py

# 输出示例：
# ✅ 摄像头 0: 1920x1080
# ✅ 摄像头 1: 1280x720

# 测试特定摄像头
python test_camera_id.py 1  # 测试摄像头 1

# 使用指定摄像头启动追踪器
python yolo_tracker.py -c 1
```

### Q4: 连接追踪器后关键点偏移？
**A**: 已修复坐标缩放问题（`app.js:handleTrackingData`）。确保：
1. Python 追踪器正在运行
2. WebSocket 桥接已启动
3. 浏览器控制台显示 "WebSocket connected"

### Q5: MediaPipe API 报错 `AttributeError: module 'mediapipe' has no attribute 'solutions'`？
**A**: MediaPipe 0.10+ 更改了 API。确保使用新版本：
```bash
pip install --upgrade mediapipe
```

项目已适配新 API（`mediapipe.tasks.vision.FaceLandmarker`）。

### Q6: 录制视频无声音？
**A**: 当前版本仅录制视频流，不包含音频。计划在未来版本添加音频同步功能。

### Q7: 支持自定义虚拟形象吗？
**A**: 当前版本提供 6 种预设形象。自定义形象导入功能正在开发中，敬请期待。

### Q8: 性能优化建议？
**A**:
- 降低画布分辨率（设置 → 480p）
- 关闭不需要的特效和装饰物
- 使用现代浏览器（Chrome/Edge 性能最佳）
- Python 模式下，确保摄像头分辨率不超过 1280x720

### Q9: WebSocket 连接失败？
**A**: 检查步骤：
```bash
# 1. 确认 ws_bridge.py 正在运行
cd bridge
python ws_bridge.py
# 输出应显示：WebSocket server started on ws://localhost:8765

# 2. 确认 yolo_tracker.py 正在运行并发送数据
python yolo_tracker.py -c 0
# 应看到 "FPS: XX | 检测: ✅"

# 3. 检查防火墙是否阻止端口 8765
```

## 🧑‍💻 开发指南

### 添加新虚拟形象

编辑 `js/avatar.js`:
```javascript
// 1. 添加形象定义
class DragonAvatar extends Avatar {
    constructor() {
        super();
        this.name = 'dragon';
        this.color = '#ff6b35';
        this.features = {
            ears: 'horns',  // 龙角
            tail: 'long'     // 长尾巴
        };
    }

    draw(ctx, landmarks) {
        // 实现绘制逻辑
    }
}

// 2. 注册形象
AvatarFactory.register('dragon', DragonAvatar);
```

在 `index.html` 添加按钮：
```html
<button class="avatar-btn" data-avatar="dragon">
    🐉 小龙
</button>
```

### 添加新特效

编辑 `js/effects.js`:
```javascript
class CustomEffect {
    constructor(name, intensity = 1.0) {
        this.name = name;
        this.intensity = intensity;
    }

    apply(ctx, imageData) {
        // 实现特效逻辑
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            // 修改 RGBA 值
        }
        return imageData;
    }
}

// 注册特效
EffectManager.register('custom', CustomEffect);
```

### 调试技巧

**浏览器模式**:
```javascript
// app.js - 打开调试日志
handleCameraLandmarks(landmarks) {
    console.log('Landmarks:', landmarks.length);
    console.log('First point:', landmarks[0]);
    // ...
}
```

**Python 模式**:
```python
# yolo_tracker.py - 打印关键点
if frame_count % 30 == 0:
    print(f"鼻尖: x={landmarks_68[30][0]:.1f}, y={landmarks_68[30][1]:.1f}")
```

### 代码规范

- JavaScript: ES6+ 语法，使用 `const`/`let`
- Python: PEP 8 风格，类型注释
- 注释: 中英文双语，关键逻辑必须注释

## 📝 路线图

- [x] 浏览器 MediaPipe 集成
- [x] Python 后端追踪
- [x] 6 种预设虚拟形象
- [x] 视频/GIF 录制
- [x] 特效与装饰物系统
- [ ] 自定义形象导入（SVG/PNG）
- [ ] 音频同步功能
- [ ] 直播推流支持（RTMP/WebRTC）
- [ ] 多语言支持（English/日本語）
- [ ] 移动端适配（iOS/Android）
- [ ] 云端录制与存储

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [MediaPipe](https://google.github.io/mediapipe/) - Google 的开源机器学习框架
- [Yolo](https://github.com/emilianavt/Yolo) - 面部追踪参考实现
- [Ultralytics](https://github.com/ultralytics/ultralytics) - YOLO 框架

## 📧 联系方式

- GitHub Issues: [https://github.com/quyangminddock/YoloFaceWeb/issues](https://github.com/quyangminddock/YoloFaceWeb/issues)
- Email: [your-email@example.com](mailto:your-email@example.com)

---

⭐ 如果这个项目对你有帮助，请给个 Star！

**Happy Coding!** 🎉
