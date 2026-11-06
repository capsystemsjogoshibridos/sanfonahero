// Detect the two printed, black-rimmed AirCcordion dots in camera pixels.
class AirColorDetector {
  detect({width, height, data}) {
    const size = width * height;
    if (this.mask?.length !== size) {
      this.mask = new Uint8Array(size);
      this.queue = new Int32Array(size);
    }
    const {mask, queue} = this;
    for (let p = 0; p < size; p++) {
      const i = p * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      const cyan = Math.min(g,b) > 48 && Math.min(g,b)-r > Math.max(20,.25*Math.max(g,b)) && g > .55*b && b > .65*g;
      const lime = Math.min(r,g) > 54 && Math.min(r,g)-b > Math.max(24,.30*Math.max(r,g)) && r > .58*g && g > .80*r;
      mask[p] = cyan ? 1 : lime ? 2 : 0;
    }
    const markers = [];
    for (let start = 0; start < size; start++) {
      const color = mask[start];
      if (!color) continue;
      let head=0, tail=1, left=width, right=0, top=height, bottom=0;
      queue[0]=start;
      mask[start]=0;
      const visit = p => {
        if (mask[p] === color) { mask[p]=0; queue[tail++]=p; }
      };
      while (head < tail) {
        const p=queue[head++], x=p%width, y=Math.floor(p/width);
        left=Math.min(left,x); right=Math.max(right,x);
        top=Math.min(top,y); bottom=Math.max(bottom,y);
        if (x>0) visit(p-1);
        if (x+1<width) visit(p+1);
        if (y>0) visit(p-width);
        if (y+1<height) visit(p+width);
      }
      const w=right-left+1, h=bottom-top+1, fill=tail/(w*h);
      if (Math.min(w,h)<8 || Math.max(w,h)>Math.min(width,height)*.55 ||
          w/h<.5 || w/h>2 || fill<.52 || fill>.93) continue;
      const cx=(left+right)/2, cy=(top+bottom)/2;
      const brightness=(x,y)=>{
        if(x<0 || x>=width || y<0 || y>=height) return 255;
        const i=(Math.round(y)*width+Math.round(x))*4;
        return Math.max(data[i],data[i+1],data[i+2]);
      };
      const dark=brightness(cx,cy)*.68;
      let rim=0;
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        if ([1.02,1.08,1.14].some(scale=>brightness(cx+dx*w*.5*scale,cy+dy*h*.5*scale)<dark)) rim++;
      }
      if (rim>=2) markers.push({id:color-1,confidence:Math.min(.95,.65+rim*.075),corners:[
        {x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}
      ]});
    }
    return markers;
  }
}
globalThis.AirColorDetector = AirColorDetector;

// Both observations belong to the same camera frame. Missing sources are optional.
class AirFusion {
  constructor() { this.colors=new AirColorDetector(); this.offsets=[null,null]; this.last=[null,null]; }
  combine(skeleton, colors, width, height, now=performance.now()) {
    const center=m=>({x:m.corners.reduce((s,p)=>s+p.x,0)/4/width,y:m.corners.reduce((s,p)=>s+p.y,0)/4/height});
    return [0,1].flatMap(id=>{
      const bodies=skeleton.filter(m=>m.id===id), dots=colors.filter(m=>m.id===id);
      const body=bodies.length===1?bodies[0]:null, dot=dots.length===1?dots[0]:null;
      const b=body?center(body):null, c=dot?center(dot):null;
      const bc=body?.confidence||0, cc=dot?.confidence||0;
      const separation=b&&c?Math.hypot(b.x-c.x,b.y-c.y):Infinity;
      if(b&&c&&bc>=.65&&cc>=.8&&separation<.22) {
        const delta={x:b.x-c.x,y:b.y-c.y};
        const old=this.offsets[id];
        this.offsets[id]=old?{x:old.x+(delta.x-old.x)*.15,y:old.y+(delta.y-old.y)*.15}:delta;
      }
      const offset=this.offsets[id]||{x:0,y:0};
      const corrected=c?{x:c.x+offset.x,y:c.y+offset.y}:null;
      let point, source;
      if(b&&corrected) {
        const agreement=Math.hypot(b.x-corrected.x,b.y-corrected.y)<.10;
        if(agreement) {
          const weight=cc/(bc+cc);point={x:b.x+(corrected.x-b.x)*weight,y:b.y+(corrected.y-b.y)*weight};source='combined';
        } else if(bc>=.65) {point=b;source='skeleton';}
        else {point=corrected;source='color';}
      } else if(b) {point=b;source='skeleton';}
      else if(corrected) {point=corrected;source='color';}
      else {this.last[id]=null;return [];}
      const old=this.last[id];
      if(old&&now-old.time<1200) {
        const a=old.source===source ? .65 : .35;
        point={x:old.x+(point.x-old.x)*a,y:old.y+(point.y-old.y)*a};
      }
      this.last[id]={...point,source,time:now};
      const x=point.x*width,y=point.y*height;
      return [{id,source,corners:[{x:x-4,y:y-4},{x:x+4,y:y-4},{x:x+4,y:y+4},{x:x-4,y:y+4}]}];
    });
  }
}
globalThis.AirFusion=AirFusion;
