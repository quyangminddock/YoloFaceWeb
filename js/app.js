/**
 * OpenSeeFace Web - 主应用
 */

class App {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 组件
        this.faceRenderer = new FaceRenderer(this.canvas);
        this.avatarSystem = new AvatarSystem(this.canvas);
        this.effectsSystem = new EffectsSystem(this.canvas);
        this.recorder = new Recorder(this.canvas);
        this.cameraTracker = new CameraTracker();

        // 状态
        this.isConnected = false;
        this.isDemoMode = false;
        this.isCameraActive = false;
        this.showLandmarks = false;
        this.isMirrored = true;
        this.currentTheme = 'gradient1';
        this.ws = null;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        this.lastOpenSeeFaceData = 0; // 上次收到 OpenSeeFace 数据的时间戳
        this.openSeeFaceTimeout = 500; // OpenSeeFace 数据超时阈值 (ms)

        // 设置
        this.settings = {
            wsAddress: 'ws://localhost:8765',
            resolution: '1080',
            recordFormat: 'webm',
            smoothness: 50,
            autoConnect: false,
            videoOpacity: 30 // 摄像头视频透明度 (0-100)
        };

        this.loadSettings();
        this.initCanvas();
        this.bindEvents();
        this.initCameraTracker();
        this.startRenderLoop();
    }

    async initCameraTracker() {
        try {
            await this.cameraTracker.init();
            this.cameraTracker.onResults = (landmarks) => {
                this.handleCameraLandmarks(landmarks);
            };
            console.log('Camera tracker initialized');
        } catch (e) {
            console.error('Failed to init camera tracker:', e);
        }
    }

    handleCameraLandmarks(landmarks) {
        if (!this.isCameraActive) return;

        // 如果已连接到 OpenSeeFace 并且正在接收数据，优先使用 OpenSeeFace 数据
        // 只有当 OpenSeeFace 超时未发送数据时，才使用本地摄像头追踪作为 fallback
        if (this.isConnected) {
            const now = Date.now();
            if (now - this.lastOpenSeeFaceData < this.openSeeFaceTimeout) {
                return; // OpenSeeFace 数据有效，跳过本地追踪
            }
            // OpenSeeFace 连接但无数据，使用本地追踪作为 fallback
            document.getElementById('trackingInfo').textContent = '追踪: 本地摄像头 (OpenSeeFace 无数据)';
        }

        // 缩放关键点到画布尺寸
        // landmarks 已经是基于视频实际尺寸的像素坐标
        // 需要转换到画布尺寸
        const video = this.cameraTracker.getVideoElement();
        const videoWidth = video.videoWidth || 1280;
        const videoHeight = video.videoHeight || 720;

        const scaleX = this.canvas.width / videoWidth;
        const scaleY = this.canvas.height / videoHeight;

        const scaledLandmarks = landmarks.map(p => ({
            x: p.x * scaleX,
            y: p.y * scaleY
        }));

        this.faceRenderer.setLandmarks(scaledLandmarks);
        const expressions = this.faceRenderer.getExpressions();
        const headPose = this.faceRenderer.getHeadPose();

        this.avatarSystem.update({ expressions, headPose });

        // 更新表情条
        document.getElementById('blinkBar').style.width = (expressions.blink * 100) + '%';
        document.getElementById('smileBar').style.width = (expressions.smile * 100) + '%';
        document.getElementById('mouthBar').style.width = (expressions.mouthOpen * 100) + '%';

        document.getElementById('trackingInfo').textContent = '追踪: 摄像头检测到面部';
    }

    async toggleCamera() {
        const btn = document.getElementById('cameraBtn');

        if (this.isCameraActive) {
            await this.cameraTracker.stop();
            this.isCameraActive = false;
            btn.classList.remove('active');
            this.updateStatus('摄像头已关闭');
            document.getElementById('trackingInfo').textContent = '追踪: 未检测到面部';
        } else {
            this.showToast('正在启动摄像头...', 'info');
            const success = await this.cameraTracker.start();
            if (success) {
                this.isCameraActive = true;
                this.isDemoMode = false;
                document.getElementById('demoBtn').classList.remove('active');
                btn.classList.add('active');
                this.updateStatus('摄像头追踪中');
                this.showToast('摄像头已启动 📷', 'success');
            } else {
                this.showToast('无法启动摄像头，请检查权限', 'error');
            }
        }
    }

    initCanvas() {
        const resolutions = {
            '480': [854, 480],
            '720': [1280, 720],
            '1080': [1920, 1080]
        };
        const [w, h] = resolutions[this.settings.resolution] || [1280, 720];
        this.canvas.width = w;
        this.canvas.height = h;
        this.avatarSystem.setSmoothness(this.settings.smoothness / 100);
    }

    bindEvents() {
        // 摄像头按钮
        document.getElementById('cameraBtn').addEventListener('click', () => this.toggleCamera());

        // 连接按钮
        document.getElementById('connectBtn').addEventListener('click', () => {
            if (this.isConnected) this.disconnect();
            else this.connect();
        });

        // 演示模式
        document.getElementById('demoBtn').addEventListener('click', () => {
            this.isDemoMode = !this.isDemoMode;
            document.getElementById('demoBtn').classList.toggle('active', this.isDemoMode);
            this.updateStatus(this.isDemoMode ? '演示模式' : '等待连接...');
        });

        // 镜像
        document.getElementById('mirrorBtn').addEventListener('click', () => {
            this.isMirrored = !this.isMirrored;
            this.faceRenderer.mirrorMode = this.isMirrored;
            document.getElementById('mirrorBtn').classList.toggle('active', this.isMirrored);
        });

        // 显示关键点
        document.getElementById('showLandmarksBtn').addEventListener('click', () => {
            this.showLandmarks = !this.showLandmarks;
            this.faceRenderer.showLandmarks = this.showLandmarks;
            document.getElementById('showLandmarksBtn').classList.toggle('active', this.showLandmarks);
        });

        // 录制
        document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecording());

        // 截图
        document.getElementById('screenshotBtn').addEventListener('click', () => {
            this.recorder.takeScreenshot();
            this.showToast('截图已保存', 'success');
        });

        // GIF
        document.getElementById('gifBtn').addEventListener('click', () => this.captureGif());

        // 全屏
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.getElementById('canvasContainer').requestFullscreen();
            }
        });

        // 形象选择 - 多选模式
        document.getElementById('avatarGrid').addEventListener('click', (e) => {
            const item = e.target.closest('.avatar-item');
            if (item) {
                const avatarName = item.dataset.avatar;
                // 切换选中状态
                item.classList.toggle('active');
                this.avatarSystem.toggleAvatar(avatarName);
            }
        });

        // 主题选择
        document.getElementById('themeGrid').addEventListener('click', (e) => {
            const item = e.target.closest('.theme-item');
            if (item) {
                document.querySelectorAll('.theme-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentTheme = item.dataset.theme;
            }
        });

        // 装饰物选择
        document.getElementById('decorationGrid').addEventListener('click', (e) => {
            const item = e.target.closest('.decoration-item');
            if (item) {
                document.querySelectorAll('.decoration-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.avatarSystem.setDecoration(item.dataset.decoration);
            }
        });

        // 特效选择
        document.getElementById('effectList').addEventListener('click', (e) => {
            const item = e.target.closest('.effect-item');
            if (item) {
                document.querySelectorAll('.effect-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.effectsSystem.setEffect(item.dataset.effect);
            }
        });

        // 设置
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('active');
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('active');
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
            document.getElementById('settingsModal').classList.remove('active');
            this.showToast('设置已保存', 'success');
        });

        document.getElementById('smoothness').addEventListener('input', (e) => {
            document.getElementById('smoothnessValue').textContent = e.target.value + '%';
        });

        document.getElementById('videoOpacity').addEventListener('input', (e) => {
            document.getElementById('videoOpacityValue').textContent = e.target.value + '%';
            // 实时更新透明度
            this.settings.videoOpacity = parseInt(e.target.value);
        });

        // 录制计时器
        this.recorder.onTimeUpdate = (time) => {
            document.getElementById('recordingTime').textContent = '⏺️ ' + time;
        };
    }

    async connect() {
        const address = document.getElementById('wsAddress').value || this.settings.wsAddress;

        try {
            // 不再自动关闭本地摄像头，让用户可以在连接追踪器的同时使用本地摄像头
            // 本地摄像头追踪会作为 OpenSeeFace 无数据时的 fallback
            if (this.isCameraActive) {
                this.showToast('本地摄像头将在 OpenSeeFace 无数据时作为备用追踪', 'info');
            }

            this.ws = new WebSocket(address);

            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateConnectionUI(true);
                this.updateStatus('已连接');
                this.showToast('已连接到追踪器', 'success');
            };

            this.ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    // 调试：打印收到的原始数据
                    console.log('Received OpenSeeFace data:', {
                        success: data.success,
                        euler: data.euler,
                        quaternion: data.quaternion,
                        landmarksCount: data.landmarks ? data.landmarks.length : 0
                    });
                    this.handleTrackingData(data);
                } catch (err) {
                    console.error('Parse error:', err);
                }
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionUI(false);
                this.updateStatus('连接已断开');
            };

            this.ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                this.showToast('连接失败', 'error');
            };
        } catch (err) {
            console.error('WebSocket error:', err);
            this.showToast('无法创建连接', 'error');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.updateConnectionUI(false);
    }

    handleTrackingData(data) {
        if (data.landmarks) {
            // 更新 OpenSeeFace 数据时间戳，用于 fallback 判断
            this.lastOpenSeeFaceData = Date.now();

            // 缩放关键点到画布尺寸
            // data.width 和 data.height 是追踪器发送的原始分辨率
            const sourceWidth = data.width || 1280;
            const sourceHeight = data.height || 720;

            const scaleX = this.canvas.width / sourceWidth;
            const scaleY = this.canvas.height / sourceHeight;

            const scaledLandmarks = data.landmarks.map(p => ({
                x: p.x * scaleX,
                y: p.y * scaleY
            }));

            this.faceRenderer.setLandmarks(scaledLandmarks);
            const expressions = this.faceRenderer.getExpressions();
            const headPose = this.faceRenderer.getHeadPose();

            // 如果有 OpenSeeFace 特有的欧拉角数据，优先使用
            if (data.euler && data.euler.length === 3) {
                // OpenSeeFace euler: [pitch, yaw, roll]
                // 转换为角度显示
                const pitch = Math.round(data.euler[0]);
                const yaw = Math.round(data.euler[1]);
                const roll = Math.round(data.euler[2]);

                // 更新 OpenSeeFace 面板
                const panel = document.getElementById('openSeeFacePanel');
                if (panel.style.display === 'none') panel.style.display = 'block';

                document.getElementById('pitchValue').textContent = pitch + '°';
                document.getElementById('yawValue').textContent = yaw + '°';
                document.getElementById('rollValue').textContent = roll + '°';

                // 追踪质量 (success字段)
                const qualityEl = document.getElementById('qualityValue');
                if (data.success) {
                    qualityEl.textContent = '良好';
                    qualityEl.style.color = '#51cf66';
                } else {
                    qualityEl.textContent = '丢失';
                    qualityEl.style.color = '#ff6b6b';
                }
            }

            this.avatarSystem.update({
                expressions,
                headPose
            });

            // 更新表情条
            document.getElementById('blinkBar').style.width = (expressions.blink * 100) + '%';
            document.getElementById('smileBar').style.width = (expressions.smile * 100) + '%';
            document.getElementById('mouthBar').style.width = (expressions.mouthOpen * 100) + '%';

            document.getElementById('trackingInfo').textContent = '追踪: OpenSeeFace 3D 追踪中';
        }
    }

    startRenderLoop() {
        const render = (time) => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 绘制背景
            this.drawBackground();

            // 绘制摄像头视频（半透明）
            if (this.isCameraActive) {
                const video = this.cameraTracker.getVideoElement();
                if (video && video.readyState >= 2) {
                    const opacity = this.settings.videoOpacity / 100;
                    this.ctx.save();
                    this.ctx.globalAlpha = opacity;

                    // 计算视频绘制尺寸以保持宽高比
                    const videoAspect = video.videoWidth / video.videoHeight;
                    const canvasAspect = this.canvas.width / this.canvas.height;
                    let drawWidth, drawHeight, offsetX, offsetY;

                    if (videoAspect > canvasAspect) {
                        drawHeight = this.canvas.height;
                        drawWidth = drawHeight * videoAspect;
                        offsetX = (this.canvas.width - drawWidth) / 2;
                        offsetY = 0;
                    } else {
                        drawWidth = this.canvas.width;
                        drawHeight = drawWidth / videoAspect;
                        offsetX = 0;
                        offsetY = (this.canvas.height - drawHeight) / 2;
                    }

                    // 镜像翻转
                    if (this.isMirrored) {
                        this.ctx.translate(this.canvas.width, 0);
                        this.ctx.scale(-1, 1);
                    }

                    this.ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
                    this.ctx.restore();
                }
            }

            // 演示模式
            if (this.isDemoMode) {
                this.avatarSystem.demo(time);
            }

            // 特效预处理
            this.effectsSystem.preRender();

            // 渲染形象
            this.avatarSystem.render();

            // 渲染面部关键点
            if (this.showLandmarks) {
                this.faceRenderer.render();
            }

            // 特效后处理
            this.effectsSystem.postRender();

            // GIF 帧捕获
            if (this.recorder.gifMode) {
                this.recorder.captureGifFrame();
            }

            // FPS 计算
            this.frameCount++;
            const now = Date.now();
            if (now - this.lastFpsUpdate >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = now;
                document.getElementById('fpsCounter').textContent = 'FPS: ' + this.fps;
            }

            requestAnimationFrame(render);
        };

        requestAnimationFrame(render);
    }

    drawBackground() {
        const themes = {
            gradient1: ['#667eea', '#764ba2'],
            gradient2: ['#f093fb', '#f5576c'],
            gradient3: ['#4facfe', '#00f2fe'],
            gradient4: ['#43e97b', '#38f9d7'],
            gradient5: ['#fa709a', '#fee140'],
            solid: ['#1a1a2e', '#1a1a2e']
        };

        const colors = themes[this.currentTheme] || themes.gradient1;
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    toggleRecording() {
        const btn = document.getElementById('recordBtn');
        const timeDisplay = document.getElementById('recordingTime');

        if (this.recorder.isRecording) {
            this.recorder.stopRecording();
            btn.classList.remove('recording');
            btn.querySelector('.record-icon').textContent = '⏺️';
            timeDisplay.classList.add('hidden');
            this.showToast('录制已保存', 'success');
        } else {
            if (this.recorder.startRecording(this.settings.recordFormat)) {
                btn.classList.add('recording');
                btn.querySelector('.record-icon').textContent = '⏹️';
                timeDisplay.classList.remove('hidden');
                this.showToast('开始录制', 'info');
            } else {
                this.showToast('录制启动失败', 'error');
            }
        }
    }

    captureGif() {
        if (this.recorder.gifMode) {
            this.recorder.saveGif();
            this.showToast('GIF 已保存', 'success');
        } else {
            this.recorder.startGifCapture();
            this.showToast('GIF 录制中... 再次点击保存', 'info');
            setTimeout(() => {
                if (this.recorder.gifMode) {
                    this.recorder.saveGif();
                    this.showToast('GIF 已保存', 'success');
                }
            }, 3000);
        }
    }

    updateConnectionUI(connected) {
        const btn = document.getElementById('connectBtn');
        const dot = btn.querySelector('.status-dot');

        if (connected) {
            dot.classList.add('connected');
            btn.innerHTML = '<span class="status-dot connected"></span> 断开连接';
        } else {
            dot.classList.remove('connected');
            btn.innerHTML = '<span class="status-dot"></span> 连接追踪器';
        }
    }

    updateStatus(text) {
        document.getElementById('connectionStatus').querySelector('.status-text').textContent = text;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('openSeeFaceWebSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) { }

        // 应用设置到 UI
        document.getElementById('wsAddress').value = this.settings.wsAddress;
        document.getElementById('resolution').value = this.settings.resolution;
        document.getElementById('recordFormat').value = this.settings.recordFormat;
        document.getElementById('smoothness').value = this.settings.smoothness;
        document.getElementById('smoothnessValue').textContent = this.settings.smoothness + '%';
        document.getElementById('videoOpacity').value = this.settings.videoOpacity;
        document.getElementById('videoOpacityValue').textContent = this.settings.videoOpacity + '%';
        document.getElementById('autoConnect').checked = this.settings.autoConnect;
    }

    saveSettings() {
        this.settings = {
            wsAddress: document.getElementById('wsAddress').value,
            resolution: document.getElementById('resolution').value,
            recordFormat: document.getElementById('recordFormat').value,
            smoothness: parseInt(document.getElementById('smoothness').value),
            videoOpacity: parseInt(document.getElementById('videoOpacity').value),
            autoConnect: document.getElementById('autoConnect').checked
        };

        localStorage.setItem('openSeeFaceWebSettings', JSON.stringify(this.settings));
        this.initCanvas();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
