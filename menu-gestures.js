(() => {
  class MenuGestures {
    reset(key = '') {
      this.key = key; this.index = 0; this.phase = 'idle'; this.history = [];
      this.base = null; this.lastTime = null; this.cooldown = 0; this.progress = 0;
      this.reason = '';
    }
    constructor() { this.reset(); }
    update({key, count, points, now, closedSpan, openSpan}) {
      if (key !== this.key) this.reset(key);
      this.index = Math.min(this.index, Math.max(0, count - 1));
      const result = (action = null) => ({action, index:this.index, progress:this.progress, phase:this.phase, reason:this.reason});
      if (!points || !count) {
        this.reason='tracking';
        this.phase = 'idle'; this.progress = 0; this.history = []; this.lastTime = null;
        return result();
      }
      if (this.lastTime !== null && now-this.lastTime>250) { this.reason='stale'; this.phase='idle'; this.progress=0; this.history=[]; }
      this.lastTime = now;
      const span = Math.hypot(points[1].x-points[0].x, points[1].y-points[0].y);
      const center = {x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};
      this.base = Math.min(this.base ?? span, span);
      const calibrated = Number.isFinite(closedSpan) && openSpan-closedSpan>.05;
      const opening = calibrated ? (span-closedSpan)/(openSpan-closedSpan) : (span-this.base)/Math.max(.08,this.base*.4);
      this.history=this.history.filter(s=>now-s.time<=350);
      const old=this.history[0];
      this.history.push({time:now,center,span});
      if(now<this.cooldown) return result();
      // Detect translation of both markers, not a change in bellows width.
      if(old && now-old.time>=80 && Math.abs(center.x-old.center.x)>.10 && Math.abs(center.y-old.center.y)<.10 && Math.abs(span-old.span)<.06) {
        const action=center.x<old.center.x?'right':'left';
        this.history=[]; this.phase='idle'; this.progress=0; this.cooldown=now+900;
        return result(action);
      }
      if (this.phase==='hold') {
        if(opening>.4 || Math.hypot(center.x-this.anchor.x,center.y-this.anchor.y)>.10) {
          this.reason='movement';this.phase='idle';this.progress=0;return result();
        }
        this.progress=Math.min(1,(now-this.holdStart)/3000);
        if(this.progress>=1) {
          this.phase='idle';this.progress=0;this.cooldown=now+1200;
          return result('confirm');
        }
      } else if (opening>.65) {
        if(this.phase!=='open') { this.reason='';this.phase='open';this.nextAt=now+1000; }
        if(now>=this.nextAt) { this.index=(this.index+1)%count;this.nextAt=now+1400;return result('focus'); }
      } else if(this.phase==='open' && opening<.35) {
        this.phase='hold';this.holdStart=now;this.anchor=center;this.progress=0;
      }
      return result();
    }
  }
  window.SanfonaMenuGestures=MenuGestures;
})();
