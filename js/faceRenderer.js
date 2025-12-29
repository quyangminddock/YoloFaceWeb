/**
 * Face Renderer - 面部关键点渲染器
 * 用于可视化 OpenSeeFace 的 68 点面部关键点
 */

class FaceRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.landmarks = null;
        this.showLandmarks = true;
        this.showConnections = true;
        this.mirrorMode = true;
        
        // 颜色配置
        this.colors = {
            point: '#667eea',
            pointGlow: 'rgba(102, 126, 234, 0.5)',
            connection: 'rgba(255, 255, 255, 0.3)',
            outline: '#f093fb',
            eyebrow: '#4facfe',
            nose: '#43e97b',
            eye: '#fa709a',
            mouth: '#ff6b6b'
        };
        
        // 面部区域连接定义 (基于 iBUG 68 点)
        this.connections = {
            // 面部轮廓 (0-16)
            outline: [
                [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
                [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16]
            ],
            // 左眉毛 (17-21)
            leftEyebrow: [[17, 18], [18, 19], [19, 20], [20, 21]],
            // 右眉毛 (22-26)
            rightEyebrow: [[22, 23], [23, 24], [24, 25], [25, 26]],
            // 鼻梁 (27-30)
            noseBridge: [[27, 28], [28, 29], [29, 30]],
            // 鼻底 (31-35)
            noseBottom: [[31, 32], [32, 33], [33, 34], [34, 35]],
            // 左眼 (36-41)
            leftEye: [[36, 37], [37, 38], [38, 39], [39, 40], [40, 41], [41, 36]],
            // 右眼 (42-47)
            rightEye: [[42, 43], [43, 44], [44, 45], [45, 46], [46, 47], [47, 42]],
            // 外嘴唇 (48-59)
            outerLip: [
                [48, 49], [49, 50], [50, 51], [51, 52], [52, 53], [53, 54],
                [54, 55], [55, 56], [56, 57], [57, 58], [58, 59], [59, 48]
            ],
            // 内嘴唇 (60-67)
            innerLip: [
                [60, 61], [61, 62], [62, 63], [63, 64], [64, 65], [65, 66], [66, 67], [67, 60]
            ]
        };
    }
    
    /**
     * 更新面部关键点数据
     * @param {Array} landmarks - 68个关键点的数组 [{x, y}, ...]
     */
    setLandmarks(landmarks) {
        this.landmarks = landmarks;
    }
    
    /**
     * 渲染面部关键点
     */
    render() {
        if (!this.landmarks || !this.showLandmarks) return;
        
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 应用镜像
        if (this.mirrorMode) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-width, 0);
        }
        
        // 绘制连接线
        if (this.showConnections) {
            this.drawConnections();
        }
        
        // 绘制关键点
        this.drawPoints();
        
        if (this.mirrorMode) {
            ctx.restore();
        }
    }
    
    /**
     * 绘制连接线
     */
    drawConnections() {
        const ctx = this.ctx;
        
        // 面部轮廓
        this.drawConnectionGroup(this.connections.outline, this.colors.outline, 2);
        
        // 眉毛
        this.drawConnectionGroup(this.connections.leftEyebrow, this.colors.eyebrow, 2);
        this.drawConnectionGroup(this.connections.rightEyebrow, this.colors.eyebrow, 2);
        
        // 鼻子
        this.drawConnectionGroup(this.connections.noseBridge, this.colors.nose, 1.5);
        this.drawConnectionGroup(this.connections.noseBottom, this.colors.nose, 1.5);
        
        // 眼睛
        this.drawConnectionGroup(this.connections.leftEye, this.colors.eye, 2);
        this.drawConnectionGroup(this.connections.rightEye, this.colors.eye, 2);
        
        // 嘴唇
        this.drawConnectionGroup(this.connections.outerLip, this.colors.mouth, 2);
        this.drawConnectionGroup(this.connections.innerLip, this.colors.mouth, 1.5);
    }
    
    /**
     * 绘制一组连接线
     */
    drawConnectionGroup(connections, color, lineWidth) {
        const ctx = this.ctx;
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (const [i, j] of connections) {
            if (this.landmarks[i] && this.landmarks[j]) {
                ctx.moveTo(this.landmarks[i].x, this.landmarks[i].y);
                ctx.lineTo(this.landmarks[j].x, this.landmarks[j].y);
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * 绘制关键点
     */
    drawPoints() {
        const ctx = this.ctx;
        
        for (let i = 0; i < this.landmarks.length; i++) {
            const point = this.landmarks[i];
            if (!point) continue;
            
            // 发光效果
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.pointGlow;
            ctx.fill();
            
            // 实心点
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.point;
            ctx.fill();
        }
    }
    
    /**
     * 获取表情数据
     * @returns {Object} 表情检测结果
     */
    getExpressions() {
        if (!this.landmarks || this.landmarks.length < 68) {
            return { blink: 0, smile: 0, mouthOpen: 0 };
        }
        
        // 计算眨眼 (基于眼睛高度)
        const leftEyeHeight = this.getDistance(37, 41) + this.getDistance(38, 40);
        const leftEyeWidth = this.getDistance(36, 39);
        const leftEAR = leftEyeHeight / (2 * leftEyeWidth);
        
        const rightEyeHeight = this.getDistance(43, 47) + this.getDistance(44, 46);
        const rightEyeWidth = this.getDistance(42, 45);
        const rightEAR = rightEyeHeight / (2 * rightEyeWidth);
        
        const avgEAR = (leftEAR + rightEAR) / 2;
        const blink = Math.max(0, Math.min(1, 1 - avgEAR * 3));
        
        // 计算微笑 (基于嘴角上扬)
        const mouthWidth = this.getDistance(48, 54);
        const mouthCornerLeft = this.landmarks[48].y;
        const mouthCornerRight = this.landmarks[54].y;
        const mouthCenter = (this.landmarks[51].y + this.landmarks[57].y) / 2;
        const smileRatio = (mouthCenter - (mouthCornerLeft + mouthCornerRight) / 2) / mouthWidth;
        const smile = Math.max(0, Math.min(1, smileRatio * 5));
        
        // 计算张嘴 (基于嘴巴高度)
        const mouthHeight = this.getDistance(51, 57);
        const mouthOpenRatio = mouthHeight / mouthWidth;
        const mouthOpen = Math.max(0, Math.min(1, mouthOpenRatio * 2));
        
        return { blink, smile, mouthOpen };
    }
    
    /**
     * 计算两个关键点之间的距离
     */
    getDistance(i, j) {
        const p1 = this.landmarks[i];
        const p2 = this.landmarks[j];
        if (!p1 || !p2) return 0;
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }
    
    /**
     * 获取头部姿态（简化版）
     * @returns {Object} 头部姿态 {yaw, pitch, roll}
     */
    getHeadPose() {
        if (!this.landmarks || this.landmarks.length < 68) {
            return { yaw: 0, pitch: 0, roll: 0 };
        }
        
        // 简化的头部姿态估计
        const nose = this.landmarks[30];
        const leftEye = this.landmarks[36];
        const rightEye = this.landmarks[45];
        const chin = this.landmarks[8];
        
        // Yaw (左右转头) - 基于鼻子相对于两眼中点的位置
        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2
        };
        const eyeWidth = this.getDistance(36, 45);
        const yaw = (nose.x - eyeCenter.x) / eyeWidth;
        
        // Pitch (抬头低头) - 基于鼻子和眼睛中心的垂直距离
        const noseToChin = this.getDistance(30, 8);
        const noseToEyes = this.getDistance(30, 27);
        const pitch = (noseToEyes / noseToChin - 0.4) * 2;
        
        // Roll (歪头) - 基于两眼连线的角度
        const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
        
        return {
            yaw: Math.max(-1, Math.min(1, yaw)),
            pitch: Math.max(-1, Math.min(1, pitch)),
            roll: roll
        };
    }
    
    /**
     * 切换关键点显示
     */
    toggleLandmarks() {
        this.showLandmarks = !this.showLandmarks;
        return this.showLandmarks;
    }
    
    /**
     * 切换镜像模式
     */
    toggleMirror() {
        this.mirrorMode = !this.mirrorMode;
        return this.mirrorMode;
    }
}

// 导出
window.FaceRenderer = FaceRenderer;
