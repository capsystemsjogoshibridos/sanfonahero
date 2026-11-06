/* Single-player inference for the bundled quantized PoseNet MobileNet model. */
(() => {
  function unpack([shape, min, scale, bytes]) {
    const binary=atob(bytes);
    return Float32Array.from({length:binary.length/2},(_,i)=>min+scale*(binary.charCodeAt(i*2)+256*binary.charCodeAt(i*2+1)));
  }

  function runLayer(input, layer) {
    const {size, channels, data} = input;
    const {kernelSize, depthwise, outputChannels, stride, dilation, weights, bias, head} = layer;
    const side = Math.ceil(size / stride);
    const padding = Math.floor(Math.max(0, (side-1)*stride + (kernelSize-1)*dilation+1-size)/2);
    const out = new Float32Array(side*side*outputChannels);
    for (let y=0; y<side; y++) for (let x=0; x<side; x++) {
      const dest=(y*side+x)*outputChannels;
      for (let c=0; c<outputChannels; c++) {
        let sum=bias[c];
        if (kernelSize===1) {
          const start=(y*stride*size+x*stride)*channels;
          const k=c*channels;
          for (let i=0;i<channels;i++) sum+=data[start+i]*weights[k+i];
        } else {
          for(let ky=0;ky<kernelSize;ky++) {
            const iy=y*stride+ky*dilation-padding;
            if(iy<0 || iy>=size) continue;
            for(let kx=0;kx<kernelSize;kx++) {
              const ix=x*stride+kx*dilation-padding;
              if(ix<0 || ix>=size) continue;
              const pos=(iy*size+ix)*channels;
              const k=(ky*kernelSize+kx)*channels;
              if(depthwise) sum+=data[pos+c]*weights[k+c];
              else for(let i=0;i<channels;i++) sum+=data[pos+i]*weights[(k+i)*outputChannels+c];
            }
          }
        }
        out[dest+c]=head ? sum : Math.min(6,Math.max(0,sum));
      }
    }
    return {data:out,size:side,channels:outputChannels};
  }

  class AirDetector {
    constructor() {
      try {
        const bytes=Uint8Array.from(atob(globalThis.poseKernel),ch=>ch.charCodeAt(0));
        this.kernel=new WebAssembly.Instance(new WebAssembly.Module(bytes)).exports;
      } catch { this.kernel=null; }
      this.layers=globalThis.poseNetLayers.map(layer=>{
        const [ks,,channels,filters]=layer.kernel[0];
        let weights=unpack(layer.kernel);
        if(!this.kernel && ks===1) {
          const transposed=new Float32Array(weights.length);
          for(let i=0;i<channels;i++) for(let c=0;c<filters;c++) transposed[c*channels+i]=weights[i*filters+c];
          weights=transposed;
        }
        const depthwise=layer.kind==='DepthwiseConv2dNative';
        return {...layer,weights,bias:unpack(layer.bias),kernelSize:ks,depthwise,outputChannels:depthwise?channels:filters};
      });
    }
    fastLayer(input, layer) {
      const {size,channels}=input;
      const {stride,dilation,kernelSize:k,outputChannels:n,depthwise}=layer;
      const side=Math.ceil(size/stride);
      const padding=Math.floor(Math.max(0,(side-1)*stride+(k-1)*dilation+1-size)/2);
      const heap=new Float32Array(this.kernel.memory.buffer);
      const out=input.data.length+4, end=out+side*side*n, weights=end+4;
      heap.set(input.data); heap.set(layer.weights,weights);
      for(let y=0;y<side;y++) for(let x=0;x<side;x++) {
        const dest=out+(y*side+x)*n;
        heap.set(layer.bias,dest);
        for(let ky=0;ky<k;ky++) for(let kx=0;kx<k;kx++) {
          const iy=y*stride+ky*dilation-padding, ix=x*stride+kx*dilation-padding;
          if(iy<0 || iy>=size || ix<0 || ix>=size) continue;
          const start=(iy*size+ix)*channels;
          const kernelOffset=(ky*k+kx)*channels*(depthwise?1:n);
          this.kernel.accumulate(dest*4,start*4,(weights+kernelOffset)*4,channels,n,Number(depthwise));
        }
      }
      const data=heap.slice(out,end);
      if(!layer.head) for(let i=0;i<data.length;i++) data[i]=Math.max(0,Math.min(6,data[i]));
      return {data,size:side,channels:n};
    }
    detect(image) {
      const {width,height}=image;
      this.fusion ??= new globalThis.AirFusion();
      const colors=this.fusion.colors.detect(image);
      const size=257, scale=(size-1)/Math.max(width-1,height-1);
      const dx=(size-1-(width-1)*scale)/2, dy=(size-1-(height-1)*scale)/2;
      const data=new Float32Array(size*size*3).fill(-1);
      for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
        const ix=Math.round((x-dx)/scale), iy=Math.round((y-dy)/scale);
        if(ix<0 || ix>=width || iy<0 || iy>=height) continue;
        const src=(iy*width+ix)*4, dst=(y*size+x)*3;
        for(let c=0;c<3;c++) data[dst+c]=image.data[src+c]/127.5-1;
      }
      let features={data,size,channels:3};
      const heads={};
      for(const layer of this.layers) {
        const result=this.kernel ? this.fastLayer(features,layer) : runLayer(features,layer);
        if(layer.head) heads[layer.head]=result;
        else features=result;
      }
      const heat=heads.heatmap, offsets=heads.offset.data;
      this.joints=Array.from({length:17},(_,j)=>{
        let best=j;
        for(let i=j+17;i<heat.data.length;i+=17) if(heat.data[i]>heat.data[best]) best=i;
        const cell=(best-j)/17;
        return {score:1/(1+Math.exp(-heat.data[best])),
          x:((cell%heat.size)*16+offsets[cell*34+17+j]-dx)/scale,
          y:(Math.floor(cell/heat.size)*16+offsets[cell*34+j]-dy)/scale};
      });
      const skeleton = [9,10].flatMap((joint,id)=>{
        const wrist=this.joints[joint], shoulder=this.joints[5+id], elbow=this.joints[7+id];
        if(wrist.score<.35 || Math.max(shoulder.score,elbow.score)<.4) return [];
        const {x,y}=wrist;
        return [{id,confidence:Math.min(wrist.score,Math.max(shoulder.score,elbow.score)),corners:[{x:x-4,y:y-4},{x:x+4,y:y-4},{x:x+4,y:y+4},{x:x-4,y:y+4}]}];
      });
      return this.fusion.combine(skeleton,colors,width,height);
    }
  }
  globalThis.AirDetector=AirDetector;
})();
