(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const average = samples => [0, 1].map(hand => ({
    x: samples.reduce((sum, s) => sum + s[hand].x, 0) / samples.length,
    y: samples.reduce((sum, s) => sum + s[hand].y, 0) / samples.length
  }));

  class SanfonaCamera {
    constructor({ onFrame, onError }) {
      this.onFrame = onFrame;
      this.onError = onError;
      this.video = document.querySelector('#camera-video');
      this.preview = document.querySelector('#camera-overlay');
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      this.templates = {};
      this.lastSeen = -Infinity;
      this.generation = 0;
      this.history = [];
      this.latency = 80;
    }
    get active() { return !!this.stream?.getVideoTracks().some(track => track.readyState === 'live'); }
    get tracked() { return this.active && !!this.points && performance.now() - this.lastSeen < 250; }
    get calibrated() { return Object.keys(this.templates).length === 8; }
    restoreCalibration() {
      if (this.calibrated) return;
      const saved = window.SanfonaCalibrationStore?.load();
      const ids = ['closed', 'open', 'right', 'left', 'up', 'down', 'curve-right', 'curve-left'];
      if (!saved || saved.version !== 1 || !Number.isFinite(saved.aspect)) return;
      if (!ids.every(id => Array.isArray(saved.templates?.[id]) && saved.templates[id].length === 2 && saved.templates[id].every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1))) return;
      this.templates = saved.templates;
      this.calibrationAspect = saved.aspect;
      this.poseCacheValid = false;
    }
    async start() {
      this.stop();
      this.restoreCalibration();
      const generation = this.generation;
      if (window.origin === 'null') {
        throw new Error('Este ambiente isola o jogo e não permite câmera. Volte e use o modo Toque. O modo câmera exige uma hospedagem que autorize esse acesso.');
      }
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('A câmera precisa de HTTPS ou localhost. Abra o jogo em um endereço seguro.');
      }
      const policy = document.permissionsPolicy || document.featurePolicy;
      if (policy?.allowsFeature && !policy.allowsFeature('camera')) {
        throw new Error('O catálogo bloqueou a câmera neste jogo. A plataforma precisa liberar camera no iframe e na Permissions-Policy.');
      }
      if (!window.AR?.Detector || !window.AR.DICTIONARIES?.SANFONA_4X4_50) {
        throw new Error('O detector não foi carregado. Recarregue a página do jogo para atualizar os arquivos.');
      }
      // Validate local detection before requesting access to the camera.
      this.detector = new window.AR.Detector({ dictionaryName: 'SANFONA_4X4_50', maxHammingDistance: 1 });
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
          facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }
        }});
        if (generation !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false; }
        this.stream = stream;
        this.video.srcObject = stream;
        await this.video.play();
        if (generation !== this.generation) return false;
        const aspect = this.video.videoWidth / this.video.videoHeight;
        if (this.calibrated && this.calibrationAspect && Math.abs(aspect / this.calibrationAspect - 1) > .1) {
          this.templates = {};
          window.SanfonaCalibrationStore?.clear();
        }
        this.calibrationAspect = aspect;
        // Some hosts permit the camera but block workers or their importScripts.
        // Normal local scripts provide a fallback without changing permissions.
        this.detectorMode = 'página';
        try {
          const worker = new Worker('camera-worker.js?v=0.4.6');
          this.worker = worker;
          this.detectorMode = 'segundo plano';
          worker.onmessage = event => {
            if (generation !== this.generation || this.worker !== worker) return;
            if (event.data.error) { this.usePageDetector(); return; }
            this.receive(event.data);
          };
          worker.onerror = event => {
            event.preventDefault();
            if (generation === this.generation && this.worker === worker) this.usePageDetector();
          };
        } catch { this.usePageDetector(); }
        stream.getVideoTracks()[0].onended = () => this.fail('A câmera foi desconectada. Abra a calibração novamente.');
        this.lastVideoTime = -1;
        this.busy = false;
        this.loop();
        return true;
      } catch (error) {
        if (generation !== this.generation) return false;
        this.stop();
        const messages = {
          NotAllowedError: 'Câmera não autorizada. Permita o acesso no navegador; se estiver no catálogo, ele também precisa liberar a câmera.',
          NotFoundError: 'Nenhuma câmera encontrada neste aparelho.',
          NotReadableError: 'A câmera está ocupada ou indisponível. Feche outros aplicativos que a utilizam.'
        };
        throw new Error(messages[error.name] || error.message);
      }
    }
    fail(message) { this.stop(); this.onError(message); }
    usePageDetector() {
      this.worker?.terminate();
      this.worker = null;
      this.detectorMode = 'página';
      this.busy = false;
      this.lastVideoTime = -1;
    }
    stop() {
      this.generation++;
      cancelAnimationFrame(this.raf);
      this.worker?.terminate();
      this.worker = null;
      this.detector = null;
      this.stream?.getTracks().forEach(track => { track.onended = null; track.stop(); });
      this.stream = null;
      this.video.srcObject = null;
      this.points = null;
      this.lastSeen = -Infinity;
      this.history = [];
      this.poseCacheValid = false;
    }
    loop() {
      if (!this.active) return;
      const now = performance.now();
      if (this.busy && now - this.sentAt > 3000) {
        this.usePageDetector();
      }
      const interval = Math.max(50, Math.min(100, (this.processingAverage || 0) * 2));
      if (!document.hidden && !this.busy && this.video.readyState >= 2 && this.video.currentTime !== this.lastVideoTime && now - (this.sentAt || 0) >= interval) {
        this.lastVideoTime = this.video.currentTime;
        const scale = Math.min(1, 640 / this.video.videoWidth);
        const width = Math.round(this.video.videoWidth * scale);
        const height = Math.round(this.video.videoHeight * scale);
        if (this.canvas.width !== width || this.canvas.height !== height) {
          this.canvas.width = width; this.canvas.height = height;
        }
        this.ctx.drawImage(this.video, 0, 0, width, height);
        const image = this.ctx.getImageData(0, 0, width, height);
        this.sentAt = now;
        this.busy = true;
        if (this.worker) {
          try { this.worker.postMessage({ image, capturedAt: now }, [image.data.buffer]); }
          catch { this.usePageDetector(); }
        } else {
          try {
            const markers = this.detector.detect(image).filter(marker => marker.id === 0 || marker.id === 1);
            this.receive({ markers, capturedAt: now });
          } catch (error) {
            console.warn('Falha no detector local:', error.message);
            this.fail('Não foi possível ler a imagem da câmera. Reabra a câmera e confira se todos os arquivos do jogo foram carregados.');
            return;
          }
        }
      }
      this.raf = requestAnimationFrame(() => this.loop());
    }
    receive({ markers, capturedAt, error }) {
      this.busy = false;
      if (error) { this.fail('Falha no reconhecimento dos marcadores. Tente abrir a câmera novamente.'); return; }
      this.processingMs = Math.round(performance.now() - capturedAt);
      this.processingAverage = (this.processingAverage ?? this.processingMs) * .8 + this.processingMs * .2;
      this.poseCacheValid = false;
      const pair = [0, 1].map(id => markers.filter(m => m.id === id));
      // Duplicated IDs and tiny/out-of-frame squares are never trusted.
      const valid = pair.every(group => group.length === 1 && group[0].corners.every((p, i, corners) =>
        p.x > 3 && p.y > 3 && p.x < this.canvas.width - 3 && p.y < this.canvas.height - 3 && distance(p, corners[(i + 1) % 4]) >= 18));
      this.draw(markers);
      if (valid && performance.now() - capturedAt < 250) {
        const raw = pair.map(([marker]) => ({
          x: marker.corners.reduce((s, p) => s + p.x, 0) / 4 / this.canvas.width,
          y: marker.corners.reduce((s, p) => s + p.y, 0) / 4 / this.canvas.height
        }));
        const fresh = capturedAt - this.lastSeen < 250;
        this.points = raw.map((p, i) => fresh && this.points ? {
          x: this.points[i].x + (p.x - this.points[i].x) * .65,
          y: this.points[i].y + (p.y - this.points[i].y) * .65
        } : p);
        this.lastSeen = capturedAt;
        this.history.push({ time: capturedAt, points: raw });
        this.history = this.history.filter(s => capturedAt - s.time < 1200);
      } else { this.points = null; this.history = []; }
      this.onFrame(this);
    }
    draw(markers) {
      if (!document.querySelector('#camera-screen').classList.contains('active')) return;
      const canvas = this.preview;
      if (canvas.width !== this.canvas.width || canvas.height !== this.canvas.height) {
        canvas.width = this.canvas.width; canvas.height = this.canvas.height;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const marker of markers) {
        ctx.strokeStyle = marker.id === 0 ? '#00ffcc' : '#ffd75f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        marker.corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath(); ctx.stroke();
      }
    }
    capture(id) {
      const recent = this.history.filter(s => performance.now() - s.time < 850);
      if (!this.tracked || recent.length < 5 || recent.at(-1).time - recent[0].time < 550) {
        throw new Error('Mantenha os dois marcadores visíveis e firmes por um segundo.');
      }
      const mean = average(recent.map(s => s.points));
      if (recent.some(s => s.points.some((p, i) => distance(p, mean[i]) > .018))) {
        throw new Error('Houve movimento durante a captura. Segure a pose firme e tente novamente.');
      }
      if (id === 'open' && distance(mean[0], mean[1]) < distance(this.templates.closed[0], this.templates.closed[1]) + .06) {
        throw new Error('Abra mais o fole: a diferença para a pose fechada ficou pequena.');
      }
      for (const [otherId, other] of Object.entries(this.templates)) {
        if (otherId !== id && Math.max(...mean.map((p, i) => distance(p, other[i]))) < .045) {
          throw new Error('Esta pose ficou muito parecida com outra. Aumente o movimento, dentro do seu conforto.');
        }
      }
      this.templates[id] = mean;
      this.poseCacheValid = false;
      if (this.calibrated) window.SanfonaCalibrationStore?.save({ version: 1, aspect: this.calibrationAspect, templates: this.templates });
    }
    score(id) {
      if (!this.tracked || !this.templates[id]) return Infinity;
      const target = this.templates[id];
      const span = this.templates.open ? distance(...this.templates.open) : .5;
      const tolerance = clamp(span * .12, .025, .075);
      return Math.max(...this.points.map((p, i) => distance(p, target[i]) / tolerance));
    }
    pose() {
      if (!this.tracked) return null;
      if (this.poseCacheValid) return this.cachedPose;
      const ranked = Object.keys(this.templates).map(id => ({ id, score: this.score(id) })).sort((a,b) => a.score - b.score);
      this.cachedPose = ranked[0]?.score <= 1 && (!ranked[1] || ranked[1].score - ranked[0].score > .12) ? ranked[0].id : null;
      this.poseCacheValid = true;
      return this.cachedPose;
    }
    matches(id) { return this.calibrated && this.pose() === id; }
    opening() {
      if (!this.tracked || !this.templates.open || !this.templates.closed) return 0;
      const closed = distance(...this.templates.closed);
      return clamp((distance(...this.points) - closed) / (distance(...this.templates.open) - closed), 0, 1);
    }
    positions() {
      if (!this.tracked || !this.calibrated) return null;
      return Object.fromEntries(['left', 'right'].map((side, i) => {
        const closed = this.templates.closed[i], open = this.templates.open[i];
        const point = this.points[i];
        const horizontal = Math.abs(open.x - closed.x) > .025 ? (point.x - closed.x) / (open.x - closed.x) : this.opening();
        const baseline = (open.y + closed.y) / 2;
        const up = this.templates.up[i].y, down = this.templates.down[i].y;
        const vertical = point.y < baseline ? (point.y - baseline) / Math.max(.04, baseline - up) : (point.y - baseline) / Math.max(.04, down - baseline);
        return [side, { x: clamp((i ? .62 : .38) + horizontal * (i ? .24 : -.24), .08, .92), y: clamp(.72 + vertical * .15, .56, .91) }];
      }));
    }
  }
  window.SanfonaCamera = SanfonaCamera;
})();
