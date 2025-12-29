/**
 * Effects System - 特效系统
 */

class EffectsSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentEffect = null;
        this.effects = {
            glow: new GlowEffect(),
            rainbow: new RainbowEffect(),
            pixelate: new PixelateEffect(),
            neon: new NeonEffect()
        };
    }

    setEffect(effectName) {
        this.currentEffect = effectName === 'none' ? null : effectName;
    }

    preRender() {
        if (!this.currentEffect || !this.effects[this.currentEffect]) return;
        this.effects[this.currentEffect].preRender(this.ctx, this.canvas);
    }

    postRender() {
        if (!this.currentEffect || !this.effects[this.currentEffect]) return;
        this.effects[this.currentEffect].postRender(this.ctx, this.canvas);
    }
}

class GlowEffect {
    preRender(ctx, canvas) {
        ctx.save();
        ctx.shadowColor = 'rgba(102, 126, 234, 0.8)';
        ctx.shadowBlur = 30;
    }
    postRender(ctx, canvas) {
        ctx.restore();
    }
}

class RainbowEffect {
    postRender(ctx, canvas) {
        const time = Date.now() / 1000;
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.6
        );
        const hue = (time * 50) % 360;
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'transparent');
        gradient.addColorStop(1, `hsla(${hue}, 70%, 50%, 0.15)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    preRender() { }
}

class PixelateEffect {
    postRender(ctx, canvas) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelSize = 8;
        for (let y = 0; y < canvas.height; y += pixelSize) {
            for (let x = 0; x < canvas.width; x += pixelSize) {
                const i = (y * canvas.width + x) * 4;
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, pixelSize, pixelSize);
            }
        }
    }
    preRender() { }
}

class NeonEffect {
    preRender(ctx, canvas) {
        ctx.save();
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 20;
    }
    postRender(ctx, canvas) {
        ctx.restore();
        // Neon border
        const time = Date.now() / 1000;
        const hue = (time * 60) % 360;
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.6)`;
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    }
}

window.EffectsSystem = EffectsSystem;
