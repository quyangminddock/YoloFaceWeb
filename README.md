# OpenSeeFace Web 🎭

现代化的 Web 前端，与 [OpenSeeFace](https://github.com/emilianavt/OpenSeeFace) 面部追踪系统集成，用于视频制作和虚拟形象动画。

![Preview](https://img.shields.io/badge/status-beta-blue)

## ✨ 特性

- 🐱 **6 种可爱虚拟形象** - 猫、狗、兔子、熊猫、狐狸、小熊
- 📷 **浏览器摄像头支持** - 使用 MediaPipe 直接在浏览器中追踪面部
- 🔗 **OpenSeeFace 集成** - 通过 WebSocket 桥接接收追踪数据
- 🎬 **视频录制** - 录制虚拟形象动画为 WebM 视频
- 📸 **截图和 GIF** - 一键截图或生成 GIF
- ✨ **特效滤镜** - 发光、彩虹、霓虹灯等效果
- 🎨 **装饰物系统** - 眼镜、帽子、皇冠、粒子特效
- 🌈 **多彩背景** - 6 种渐变主题
- 🌙 **现代化 UI** - 暗黑主题、玻璃态设计

## 🚀 快速开始

### 方式一：浏览器摄像头模式（推荐）

无需安装任何依赖，直接在浏览器中使用：

1. 打开 `index.html`
2. 点击 **📷 摄像头** 按钮
3. 授权摄像头权限
4. 开始玩耍！

### 方式二：OpenSeeFace 集成模式

如需更高精度的面部追踪，可以配合 OpenSeeFace 使用：

**1. 安装依赖**

```bash
# 安装 Python 桥接依赖
pip install websockets
```

**2. 下载 OpenSeeFace**

从 [OpenSeeFace Releases](https://github.com/emilianavt/OpenSeeFace/releases) 下载最新版本。

**3. 启动服务**

```bash
# 终端 1: 启动 OpenSeeFace
cd OpenSeeFace/Binary
./facetracker -c 0

# 终端 2: 启动 WebSocket 桥接
cd OpenSeeFaceWeb/bridge
python ws_bridge.py
```

**4. 打开前端**

在浏览器中打开 `index.html`，点击 **连接追踪器** 按钮。

## 📁 项目结构

```
OpenSeeFaceWeb/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主应用
│   ├── faceRenderer.js # 面部关键点渲染
│   ├── avatar.js       # 虚拟形象系统
│   ├── effects.js      # 特效系统
│   ├── recorder.js     # 录制功能
│   └── cameraTracker.js# 浏览器摄像头追踪
├── bridge/
│   └── ws_bridge.py    # UDP->WebSocket 桥接
└── README.md
```

## 🎮 使用说明

### 控制面板

| 按钮 | 功能 |
|------|------|
| 📷 摄像头 | 启动/关闭浏览器摄像头追踪 |
| 🎬 演示 | 演示模式（无需摄像头） |
| 🪞 镜像 | 切换镜像翻转 |
| 👁️ 关键点 | 显示/隐藏面部关键点 |
| ⏺️ 录制 | 开始/停止录制视频 |
| 📸 截图 | 保存截图 |
| 🎞️ GIF | 生成 GIF 动画 |
| ⛶ 全屏 | 全屏模式 |

### 虚拟形象

在左侧面板选择你喜欢的形象：
- 🐱 小猫咪
- 🐶 小狗狗
- 🐰 小兔子
- 🐼 熊猫
- 🦊 小狐狸
- 🐻 小熊

### 装饰物

在右侧面板添加装饰：
- 👓 眼镜
- 🕶️ 墨镜
- 🎩 礼帽
- 👑 皇冠
- 💕 爱心粒子
- ⭐ 星星粒子
- ✨ 闪烁效果

## 🔧 配置

点击 **⚙️ 设置** 可以调整：

- WebSocket 服务器地址
- 画布分辨率（480p/720p/1080p）
- 录制格式（WebM/MP4）
- 形象平滑度
- 自动连接

## 📝 TODO

- [ ] 添加更多虚拟形象
- [ ] 支持自定义形象导入
- [ ] 音频同步功能
- [ ] 直播推流支持

## 📄 License

MIT License
