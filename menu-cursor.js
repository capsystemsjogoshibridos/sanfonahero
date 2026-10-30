(() => {
  class DwellCursor {
    constructor() { this.reset(); }
    reset() { this.key=null; this.target=null; this.anchor=null; this.lastTime=null; this.blockedAt=null; }
    update({key,target,point,now}) {
      const moved=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
      if(key!==this.key || (this.lastTime!==null && now-this.lastTime>250)) { this.key=key;this.target=null;this.anchor=null; }
      this.lastTime=now;
      if(!point) { this.target=null;this.anchor=null;return {progress:0,click:false}; }
      // Require an intentional move after activating, including across screen changes.
      if(this.blockedAt) {
        if(moved(point,this.blockedAt)<28) return {progress:0,click:false};
        this.blockedAt=null;
      }
      if(!target) { this.target=null;this.anchor=null;return {progress:0,click:false}; }
      if(target!==this.target || !this.anchor || moved(point,this.anchor)>20) {
        this.target=target;this.anchor={...point};this.since=now;
      }
      const progress=Math.min(1,(now-this.since)/2000);
      if(progress===1) { this.blockedAt={...point};this.target=null;return {progress,click:true}; }
      return {progress,click:false};
    }
  }
  window.SanfonaDwellCursor=DwellCursor;
})();
