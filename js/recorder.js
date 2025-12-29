/**
 * Recorder - 录制功能
 */

class Recorder {
    constructor(canvas) {
        this.canvas = canvas;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.startTime = null;
        this.onTimeUpdate = null;

        // GIF 录制
        this.gifFrames = [];
        this.gifMode = false;
    }

    startRecording(format = 'webm') {
        if (this.isRecording) return false;

        const stream = this.canvas.captureStream(30);
        const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';

        try {
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm'
            });
        } catch (e) {
            console.error('MediaRecorder error:', e);
            return false;
        }

        this.recordedChunks = [];
        this.startTime = Date.now();
        this.isRecording = true;

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.saveRecording();
        };

        this.mediaRecorder.start(100);
        this.updateTimer();
        return true;
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        this.isRecording = false;
        this.mediaRecorder.stop();
    }

    updateTimer() {
        if (!this.isRecording) return;

        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const timeString = [
            hours.toString().padStart(2, '0'),
            (minutes % 60).toString().padStart(2, '0'),
            (seconds % 60).toString().padStart(2, '0')
        ].join(':');

        if (this.onTimeUpdate) {
            this.onTimeUpdate(timeString);
        }

        requestAnimationFrame(() => this.updateTimer());
    }

    saveRecording() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `avatar_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    }

    takeScreenshot() {
        const link = document.createElement('a');
        link.download = `avatar_${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    // GIF 录制
    startGifCapture() {
        this.gifFrames = [];
        this.gifMode = true;
        this.startTime = Date.now();
    }

    captureGifFrame() {
        if (!this.gifMode) return;
        if (this.gifFrames.length < 60) { // Max 60 frames
            this.gifFrames.push(this.canvas.toDataURL('image/png'));
        }
    }

    async saveGif() {
        if (this.gifFrames.length === 0) return;
        this.gifMode = false;

        // Simple fallback - download as ZIP of PNGs
        // In production, would use gif.js library
        console.log(`Captured ${this.gifFrames.length} frames for GIF`);

        // For now, just save first frame
        const link = document.createElement('a');
        link.download = `avatar_gif_${Date.now()}.png`;
        link.href = this.gifFrames[0];
        link.click();

        this.gifFrames = [];
    }
}

window.Recorder = Recorder;
