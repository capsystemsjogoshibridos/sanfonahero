importScripts('vendor/pose/kernel.js?v=0.8.0','vendor/pose/model.js?v=0.8.0','air-detector.js?v=0.8.0');
const detector=new AirDetector();
self.onmessage=({data})=>{
  try {
    const markers=detector.detect(data.image);
    self.postMessage({markers,joints:detector.joints,capturedAt:data.capturedAt});
  } catch(error) { self.postMessage({error:String(error)}); }
};
