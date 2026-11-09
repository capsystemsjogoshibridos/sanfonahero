importScripts('vendor/pose/kernel.js?v=0.11.0','vendor/pose/model.js?v=0.11.0','air-hybrid.js?v=0.11.0','air-detector.js?v=0.11.0');
const detector=new AirDetector();
self.onmessage=({data})=>{
  try {
    if(data.alignment) { detector.fusion ??= new AirFusion(); detector.fusion.offsets=data.alignment; }
    const markers=detector.detect(data.image);
    self.postMessage({markers,joints:detector.joints,alignment:detector.fusion.offsets,capturedAt:data.capturedAt});
  } catch(error) { self.postMessage({error:String(error)}); }
};
