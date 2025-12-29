/**
 * Camera Tracker - 浏览器端摄像头追踪
 * 使用 MediaPipe Face Mesh 进行面部追踪
 */

class CameraTracker {
    constructor() {
        this.video = null;
        this.faceMesh = null;
        this.isRunning = false;
        this.onResults = null;
        this.cameras = [];
        this.currentCameraId = null;
    }

    async init() {
        // 创建 video 元素（不显示，仅用作画布源）
        this.video = document.createElement('video');
        this.video.id = 'cameraPreview';
        this.video.setAttribute('playsinline', '');
        this.video.style.position = 'absolute';
        this.video.style.opacity = '0';
        this.video.style.pointerEvents = 'none';
        this.video.style.width = '1px';
        this.video.style.height = '1px';
        document.body.appendChild(this.video);

        // 获取可用摄像头列表
        await this.listCameras();

        // 加载 MediaPipe Face Mesh
        return new Promise((resolve, reject) => {
            // 检查 MediaPipe 是否已加载
            if (typeof FaceMesh === 'undefined') {
                console.log('Loading MediaPipe Face Mesh...');
                this.loadMediaPipe().then(() => {
                    this.initFaceMesh();
                    resolve();
                }).catch(reject);
            } else {
                this.initFaceMesh();
                resolve();
            }
        });
    }

    loadMediaPipe() {
        return new Promise((resolve, reject) => {
            // 加载 MediaPipe 脚本
            const scripts = [
                'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
                'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
            ];

            let loaded = 0;
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loaded++;
                    if (loaded === scripts.length) {
                        resolve();
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
    }

    initFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults((results) => {
            if (this.onResults && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = this.convertLandmarks(results.multiFaceLandmarks[0]);
                this.onResults(landmarks);
            }
        });
    }

    async listCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(d => d.kind === 'videoinput');
            return this.cameras;
        } catch (e) {
            console.error('Failed to enumerate cameras:', e);
            return [];
        }
    }

    async start(cameraId = null) {
        if (this.isRunning) {
            await this.stop();
        }

        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };

            if (cameraId) {
                constraints.video.deviceId = { exact: cameraId };
                this.currentCameraId = cameraId;
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            await this.video.play();

            this.isRunning = true;
            this.processFrame();

            return true;
        } catch (e) {
            console.error('Failed to start camera:', e);
            return false;
        }
    }

    async stop() {
        this.isRunning = false;

        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    async processFrame() {
        if (!this.isRunning || !this.faceMesh) return;

        if (this.video.readyState >= 2) {
            await this.faceMesh.send({ image: this.video });
        }

        requestAnimationFrame(() => this.processFrame());
    }

    /**
     * 将 MediaPipe 478 点转换为 OpenSeeFace 兼容的 68 点格式
     */
    convertLandmarks(mpLandmarks) {
        // MediaPipe 到 iBUG 68 点的映射
        // MediaPipe 有 478 个点，我们需要提取对应的 68 个点
        const mapping = {
            // 面部轮廓 (0-16)
            0: 10, 1: 338, 2: 297, 3: 332, 4: 284,
            5: 251, 6: 389, 7: 356, 8: 454, 9: 323,
            10: 361, 11: 288, 12: 397, 13: 365, 14: 379,
            15: 378, 16: 400,
            // 左眉毛 (17-21)
            17: 70, 18: 63, 19: 105, 20: 66, 21: 107,
            // 右眉毛 (22-26)
            22: 336, 23: 296, 24: 334, 25: 293, 26: 300,
            // 鼻梁 (27-30)
            27: 168, 28: 6, 29: 197, 30: 195,
            // 鼻底 (31-35)
            31: 98, 32: 97, 33: 2, 34: 326, 35: 327,
            // 左眼 (36-41)
            36: 33, 37: 160, 38: 158, 39: 133, 40: 153, 41: 144,
            // 右眼 (42-47)
            42: 362, 43: 385, 44: 387, 45: 263, 46: 373, 47: 380,
            // 外嘴唇 (48-59)
            48: 61, 49: 39, 50: 37, 51: 0, 52: 267, 53: 269,
            54: 291, 55: 405, 56: 314, 57: 17, 58: 84, 59: 181,
            // 内嘴唇 (60-67)
            60: 78, 61: 82, 62: 13, 63: 312, 64: 308,
            65: 317, 66: 14, 67: 87
        };

        const landmarks = [];
        const w = this.video.videoWidth || 1280;
        const h = this.video.videoHeight || 720;

        for (let i = 0; i < 68; i++) {
            const mpIdx = mapping[i];
            if (mpIdx !== undefined && mpLandmarks[mpIdx]) {
                landmarks.push({
                    x: mpLandmarks[mpIdx].x * w,
                    y: mpLandmarks[mpIdx].y * h
                });
            } else {
                landmarks.push({ x: 0, y: 0 });
            }
        }

        return landmarks;
    }

    getVideoElement() {
        return this.video;
    }
}

window.CameraTracker = CameraTracker;
