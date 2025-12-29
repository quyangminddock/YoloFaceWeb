/**
 * Avatar System - 2D 虚拟形象系统
 */

class AvatarSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // 改为数组存储多个选中的虚拟形象
        this.selectedAvatars = ['cat']; // 默认只有猫
        this.smoothness = 0.5;

        this.state = {
            headX: 0, headY: 0, headRotation: 0,
            leftEyeOpen: 1, rightEyeOpen: 1,
            mouthOpen: 0, smile: 0,
            leftEyebrowRaise: 0, rightEyebrowRaise: 0
        };
        this.targetState = { ...this.state };

        this.avatars = {
            cat: new CatAvatar(),
            dog: new DogAvatar(),
            rabbit: new RabbitAvatar(),
            panda: new PandaAvatar(),
            fox: new FoxAvatar(),
            bear: new BearAvatar()
        };

        this.decoration = null;
        this.decorations = {
            glasses: new GlassesDecoration(),
            sunglasses: new SunglassesDecoration(),
            hat: new HatDecoration(),
            crown: new CrownDecoration(),
            hearts: new HeartsDecoration(),
            stars: new StarsDecoration(),
            sparkles: new SparklesDecoration()
        };

        // 定义8个预设位置（环绕布局）
        this.positions = [
            { x: 0.2, y: 0.2, scale: 0.15 },   // 左上
            { x: 0.5, y: 0.15, scale: 0.15 },  // 上中
            { x: 0.8, y: 0.2, scale: 0.15 },   // 右上
            { x: 0.15, y: 0.5, scale: 0.15 },  // 左中
            { x: 0.85, y: 0.5, scale: 0.15 },  // 右中
            { x: 0.2, y: 0.8, scale: 0.15 },   // 左下
            { x: 0.5, y: 0.85, scale: 0.15 },  // 下中
            { x: 0.8, y: 0.8, scale: 0.15 }    // 右下
        ];
    }

    // 添加虚拟形象
    addAvatar(name) {
        if (!this.avatars[name]) return;
        if (!this.selectedAvatars.includes(name)) {
            this.selectedAvatars.push(name);
        }
    }

    // 移除虚拟形象
    removeAvatar(name) {
        const index = this.selectedAvatars.indexOf(name);
        if (index > -1) {
            this.selectedAvatars.splice(index, 1);
        }
    }

    // 切换虚拟形象选中状态
    toggleAvatar(name) {
        if (this.selectedAvatars.includes(name)) {
            this.removeAvatar(name);
        } else {
            this.addAvatar(name);
        }
    }

    // 检查是否选中
    isAvatarSelected(name) {
        return this.selectedAvatars.includes(name);
    }

    setDecoration(name) { this.decoration = name === 'none' ? null : name; }
    setSmoothness(value) { this.smoothness = value; }

    update(faceData) {
        if (!faceData) return;
        this.targetState = {
            headX: faceData.headPose?.yaw || 0,
            headY: faceData.headPose?.pitch || 0,
            headRotation: faceData.headPose?.roll || 0,
            leftEyeOpen: 1 - (faceData.expressions?.blink || 0),
            rightEyeOpen: 1 - (faceData.expressions?.blink || 0),
            mouthOpen: faceData.expressions?.mouthOpen || 0,
            smile: faceData.expressions?.smile || 0,
            leftEyebrowRaise: 0, rightEyebrowRaise: 0
        };
        const lerp = 1 - this.smoothness * 0.9;
        for (const key in this.state) {
            this.state[key] += (this.targetState[key] - this.state[key]) * lerp;
        }
    }

    render() {
        const ctx = this.ctx;
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;

        // 遍历所有选中的虚拟形象
        this.selectedAvatars.forEach((avatarName, index) => {
            if (index >= this.positions.length) return; // 最多8个位置

            const pos = this.positions[index];
            const x = canvasW * pos.x;
            const y = canvasH * pos.y;
            const scale = Math.min(canvasW, canvasH) * pos.scale;

            ctx.save();
            // 添加头部运动效果（但幅度减小）
            ctx.translate(
                x + this.state.headX * 20,
                y + this.state.headY * 15
            );
            ctx.rotate(this.state.headRotation * 0.3);

            const avatar = this.avatars[avatarName];
            if (avatar) avatar.render(ctx, this.state, scale);

            // 装饰物只在第一个虚拟形象上显示
            if (index === 0 && this.decoration && this.decorations[this.decoration]) {
                this.decorations[this.decoration].render(ctx, this.state, scale);
            }

            ctx.restore();
        });
    }

    demo(time) {
        const t = time / 1000;
        this.targetState = {
            headX: Math.sin(t * 0.5) * 0.3,
            headY: Math.sin(t * 0.7) * 0.2,
            headRotation: Math.sin(t * 0.3) * 0.1,
            leftEyeOpen: 0.5 + Math.sin(t * 2) * 0.5,
            rightEyeOpen: 0.5 + Math.sin(t * 2) * 0.5,
            mouthOpen: 0.3 + Math.sin(t * 3) * 0.3,
            smile: 0.5 + Math.sin(t * 0.8) * 0.5,
            leftEyebrowRaise: Math.sin(t * 1.2) * 0.3,
            rightEyebrowRaise: Math.sin(t * 1.2) * 0.3
        };
        const lerp = 0.15;
        for (const key in this.state) {
            this.state[key] += (this.targetState[key] - this.state[key]) * lerp;
        }
    }
}

class BaseAvatar {
    drawEye(ctx, x, y, size, openness) {
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * openness, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (openness > 0.2) {
            ctx.beginPath();
            ctx.arc(x, y, size * 0.5 * openness, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x - size * 0.3, y - size * 0.3 * openness, size * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = '#FFF';
            ctx.fill();
        }
    }
}

class CatAvatar extends BaseAvatar {
    render(ctx, state, s) {
        // Ears
        ctx.fillStyle = '#FFE4C4';
        [[-0.35, -0.5, -0.3], [0.35, -0.5, 0.3]].forEach(([ex, ey, rot]) => {
            ctx.save();
            ctx.translate(ex * s, ey * s);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.moveTo(-s * 0.12, s * 0.12);
            ctx.lineTo(0, -s * 0.12);
            ctx.lineTo(s * 0.12, s * 0.12);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-s * 0.06, s * 0.08);
            ctx.lineTo(0, -s * 0.05);
            ctx.lineTo(s * 0.06, s * 0.08);
            ctx.closePath();
            ctx.fillStyle = '#FFB6C1';
            ctx.fill();
            ctx.restore();
        });
        // Head
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.5, s * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE4C4';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Eyes
        this.drawCatEye(ctx, -s * 0.18, -s * 0.05, s * 0.12, state.leftEyeOpen);
        this.drawCatEye(ctx, s * 0.18, -s * 0.05, s * 0.12, state.rightEyeOpen);
        // Nose
        ctx.beginPath();
        ctx.moveTo(0, s * 0.08);
        ctx.lineTo(-s * 0.05, s * 0.15);
        ctx.lineTo(s * 0.05, s * 0.15);
        ctx.closePath();
        ctx.fillStyle = '#FFB6C1';
        ctx.fill();
        // Whiskers
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-s * 0.2, s * 0.12 + i * s * 0.04);
            ctx.lineTo(-s * 0.45, s * 0.05 + i * s * 0.06);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s * 0.2, s * 0.12 + i * s * 0.04);
            ctx.lineTo(s * 0.45, s * 0.05 + i * s * 0.06);
            ctx.stroke();
        }
        // Mouth
        if (state.mouthOpen > 0.2) {
            ctx.beginPath();
            ctx.ellipse(0, s * 0.22, s * 0.08, s * 0.08 * state.mouthOpen, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FF6B6B';
            ctx.fill();
        } else {
            const sm = state.smile * 5;
            ctx.beginPath();
            ctx.moveTo(-s * 0.08, s * 0.22 + sm);
            ctx.quadraticCurveTo(0, s * 0.22 - sm, s * 0.08, s * 0.22 + sm);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
    drawCatEye(ctx, x, y, size, open) {
        if (open < 0.1) {
            ctx.beginPath();
            ctx.moveTo(x - size, y);
            ctx.quadraticCurveTo(x, y + size * 0.3, x + size, y);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.ellipse(x, y, size, size * open, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#90EE90';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.2, size * 0.8 * open, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x - size * 0.3, y - size * 0.3 * open, size * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = '#FFF';
            ctx.fill();
        }
    }
}

class DogAvatar extends BaseAvatar {
    render(ctx, state, s) {
        // Floppy ears
        ctx.fillStyle = '#D2691E';
        [[-0.45, -0.1, -0.2], [0.45, -0.1, 0.2]].forEach(([ex, ey, rot]) => {
            ctx.save();
            ctx.translate(ex * s, ey * s);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.ellipse(0, s * 0.15, s * 0.12, s * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        });
        // Head
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.5, s * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#D2691E';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Face
        ctx.beginPath();
        ctx.ellipse(0, s * 0.15, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE4C4';
        ctx.fill();
        // Eyes
        this.drawEye(ctx, -s * 0.18, -s * 0.08, s * 0.1, state.leftEyeOpen);
        this.drawEye(ctx, s * 0.18, -s * 0.08, s * 0.1, state.rightEyeOpen);
        // Nose
        ctx.beginPath();
        ctx.ellipse(0, s * 0.12, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        // Mouth
        if (state.mouthOpen > 0.3) {
            ctx.beginPath();
            ctx.ellipse(0, s * 0.25, s * 0.12, s * 0.12 * state.mouthOpen, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FF6B6B';
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0, s * 0.35, s * 0.1, s * 0.12, 0, 0, Math.PI);
            ctx.fillStyle = '#FF9494';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(-s * 0.08, s * 0.22);
            ctx.quadraticCurveTo(0, s * 0.28 + state.smile * 8, s * 0.08, s * 0.22);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

class RabbitAvatar extends BaseAvatar {
    render(ctx, state, s) {
        // Long ears
        ctx.fillStyle = '#FFF';
        [[-0.2, -0.55, -0.1], [0.2, -0.55, 0.1]].forEach(([ex, ey, rot]) => {
            ctx.save();
            ctx.translate(ex * s, ey * s);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.25, s * 0.1, s * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.25, s * 0.06, s * 0.28, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFB6C1';
            ctx.fill();
            ctx.restore();
        });
        // Head
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.45, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Blush
        ctx.fillStyle = 'rgba(255,182,193,0.5)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, s * 0.1, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.3, s * 0.1, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes (red)
        [[-0.15, -0.02], [0.15, -0.02]].forEach(([ex, ey]) => {
            const open = state.leftEyeOpen;
            if (open < 0.1) {
                ctx.beginPath();
                ctx.arc(ex * s, ey * s, s * 0.08, 0.2, Math.PI - 0.2);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.ellipse(ex * s, ey * s, s * 0.08, s * 0.08 * open, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#FF6B6B';
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
        // Nose
        ctx.beginPath();
        ctx.ellipse(0, s * 0.12, s * 0.04, s * 0.03, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB6C1';
        ctx.fill();
        // Y mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.12);
        ctx.lineTo(0, s * 0.18);
        ctx.moveTo(0, s * 0.18);
        ctx.lineTo(-s * 0.06, s * 0.25);
        ctx.moveTo(0, s * 0.18);
        ctx.lineTo(s * 0.06, s * 0.25);
        ctx.stroke();
    }
}

class PandaAvatar extends BaseAvatar {
    render(ctx, state, s) {
        // Ears
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-s * 0.35, -s * 0.35, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.35, -s * 0.35, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Eye patches
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(-s * 0.18, -s * 0.02, s * 0.15, s * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.18, -s * 0.02, s * 0.15, s * 0.12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        [[-0.18, -0.02], [0.18, -0.02]].forEach(([ex, ey]) => {
            if (state.leftEyeOpen > 0.1) {
                ctx.beginPath();
                ctx.ellipse(ex * s, ey * s, s * 0.06, s * 0.06 * state.leftEyeOpen, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#FFF';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(ex * s, ey * s, s * 0.03 * state.leftEyeOpen, 0, Math.PI * 2);
                ctx.fillStyle = '#000';
                ctx.fill();
            }
        });
        // Nose
        ctx.beginPath();
        ctx.ellipse(0, s * 0.12, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        // Mouth
        ctx.beginPath();
        ctx.moveTo(-s * 0.06, s * 0.2);
        ctx.quadraticCurveTo(0, s * 0.25 + state.smile * 5, s * 0.06, s * 0.2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class FoxAvatar extends BaseAvatar {
    render(ctx, state, s) {
        // Ears
        ctx.fillStyle = '#FF8C00';
        [[-0.35, -0.45, -0.2], [0.35, -0.45, 0.2]].forEach(([ex, ey, rot]) => {
            ctx.save();
            ctx.translate(ex * s, ey * s);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.moveTo(-s * 0.1, s * 0.1);
            ctx.lineTo(0, -s * 0.16);
            ctx.lineTo(s * 0.1, s * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-s * 0.05, s * 0.06);
            ctx.lineTo(0, -s * 0.08);
            ctx.lineTo(s * 0.05, s * 0.06);
            ctx.closePath();
            ctx.fillStyle = '#333';
            ctx.fill();
            ctx.restore();
        });
        // Head
        ctx.beginPath();
        ctx.moveTo(-s * 0.45, -s * 0.1);
        ctx.quadraticCurveTo(-s * 0.5, s * 0.2, -s * 0.2, s * 0.4);
        ctx.quadraticCurveTo(0, s * 0.5, s * 0.2, s * 0.4);
        ctx.quadraticCurveTo(s * 0.5, s * 0.2, s * 0.45, -s * 0.1);
        ctx.quadraticCurveTo(s * 0.3, -s * 0.4, 0, -s * 0.45);
        ctx.quadraticCurveTo(-s * 0.3, -s * 0.4, -s * 0.45, -s * 0.1);
        ctx.fillStyle = '#FF8C00';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        // White face
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, s * 0.05);
        ctx.quadraticCurveTo(-s * 0.2, s * 0.35, 0, s * 0.42);
        ctx.quadraticCurveTo(s * 0.2, s * 0.35, s * 0.25, s * 0.05);
        ctx.quadraticCurveTo(0, s * 0.15, -s * 0.25, s * 0.05);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        // Eyes
        [[-0.15, 0], [0.15, 0]].forEach(([ex, ey]) => {
            if (state.leftEyeOpen < 0.1) {
                ctx.beginPath();
                ctx.moveTo((ex - 0.08) * s, ey * s);
                ctx.lineTo((ex + 0.08) * s, ey * s);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.ellipse(ex * s, ey * s, s * 0.08, s * 0.056 * state.leftEyeOpen, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#FFD700';
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(ex * s, ey * s, s * 0.024, s * 0.04 * state.leftEyeOpen, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#333';
                ctx.fill();
            }
        });
        // Nose
        ctx.beginPath();
        ctx.arc(0, s * 0.25, s * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        // Mouth
        ctx.beginPath();
        ctx.moveTo(-s * 0.06, s * 0.32);
        ctx.quadraticCurveTo(0, s * 0.35 + state.smile * 5, s * 0.06, s * 0.32);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class BearAvatar extends BaseAvatar {
    render(ctx, state, s) {
        // Ears
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(-s * 0.35, -s * 0.35, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-s * 0.35, -s * 0.35, s * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#D2B48C';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.35, -s * 0.35, s * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * 0.35, -s * 0.35, s * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#D2B48C';
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Face
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.25, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#D2B48C';
        ctx.fill();
        // Eyes
        this.drawEye(ctx, -s * 0.15, -s * 0.08, s * 0.08, state.leftEyeOpen);
        this.drawEye(ctx, s * 0.15, -s * 0.08, s * 0.08, state.rightEyeOpen);
        // Nose
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        // Mouth
        ctx.beginPath();
        ctx.moveTo(-s * 0.05, s * 0.18);
        ctx.quadraticCurveTo(0, s * 0.22 + state.smile * 5, s * 0.05, s * 0.18);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Decorations
class GlassesDecoration {
    render(ctx, state, s) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(-s * 0.18, -s * 0.05, s * 0.12, s * 0.1, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(s * 0.18, -s * 0.05, s * 0.12, s * 0.1, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s * 0.06, -s * 0.05);
        ctx.quadraticCurveTo(0, -s * 0.02, s * 0.06, -s * 0.05);
        ctx.stroke();
    }
}

class SunglassesDecoration {
    render(ctx, state, s) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.18, -s * 0.05, s * 0.14, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.18, -s * 0.05, s * 0.14, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-s * 0.04, -s * 0.05);
        ctx.lineTo(s * 0.04, -s * 0.05);
        ctx.stroke();
    }
}

class HatDecoration {
    render(ctx, state, s) {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.4, s * 0.4, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, -s * 0.4);
        ctx.lineTo(-s * 0.2, -s * 0.7);
        ctx.quadraticCurveTo(0, -s * 0.75, s * 0.2, -s * 0.7);
        ctx.lineTo(s * 0.25, -s * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(-s * 0.25, -s * 0.5, s * 0.5, s * 0.05);
    }
}

class CrownDecoration {
    render(ctx, state, s) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.4);
        ctx.lineTo(-s * 0.25, -s * 0.6);
        ctx.lineTo(-s * 0.12, -s * 0.45);
        ctx.lineTo(0, -s * 0.7);
        ctx.lineTo(s * 0.12, -s * 0.45);
        ctx.lineTo(s * 0.25, -s * 0.6);
        ctx.lineTo(s * 0.3, -s * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#F00';
        ctx.beginPath();
        ctx.arc(0, -s * 0.55, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
    }
}

class HeartsDecoration {
    constructor() { this.particles = []; }
    render(ctx, state, s) {
        if (state.smile > 0.5 && Math.random() > 0.7) {
            this.particles.push({ x: (Math.random() - 0.5) * s * 0.5, y: -s * 0.2, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 3 - 1, size: Math.random() * 10 + 5, life: 1 });
        }
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.02;
            if (p.life > 0) { ctx.globalAlpha = p.life; ctx.font = `${p.size}px sans-serif`; ctx.fillText('❤️', p.x, p.y); ctx.globalAlpha = 1; return true; }
            return false;
        });
    }
}

class StarsDecoration {
    constructor() { this.particles = []; }
    render(ctx, state, s) {
        if (state.leftEyeOpen < 0.3 && Math.random() > 0.5) {
            this.particles.push({ x: (Math.random() - 0.5) * s, y: -s * 0.3 + Math.random() * s * 0.3, size: Math.random() * 15 + 10, rot: Math.random() * Math.PI * 2, life: 1 });
        }
        this.particles = this.particles.filter(p => {
            p.rot += 0.1; p.life -= 0.03;
            if (p.life > 0) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.life; ctx.font = `${p.size}px sans-serif`; ctx.fillText('⭐', -p.size / 2, p.size / 2); ctx.restore(); ctx.globalAlpha = 1; return true; }
            return false;
        });
    }
}

class SparklesDecoration {
    constructor() {
        this.sparkles = [];
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({ angle: Math.random() * Math.PI * 2, dist: Math.random() * 100 + 50, size: Math.random() * 10 + 5, speed: Math.random() * 0.02 + 0.01, phase: Math.random() * Math.PI * 2 });
        }
    }
    render(ctx, state, s) {
        const t = Date.now() / 1000;
        for (const sp of this.sparkles) {
            sp.angle += sp.speed;
            const x = Math.cos(sp.angle) * sp.dist;
            const y = Math.sin(sp.angle) * sp.dist * 0.5 - s * 0.2;
            ctx.globalAlpha = (Math.sin(t * 5 + sp.phase) + 1) / 2 * 0.8;
            ctx.font = `${sp.size}px sans-serif`;
            ctx.fillText('✨', x, y);
        }
        ctx.globalAlpha = 1;
    }
}

window.AvatarSystem = AvatarSystem;
