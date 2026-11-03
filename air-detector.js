// Detect the two printed, black-rimmed AirCcordion dots in camera pixels.
class AirDetector {
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
      if (rim>=2) markers.push({id:color-1,corners:[
        {x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}
      ]});
    }
    return markers;
  }
}
window.AirDetector = AirDetector;
