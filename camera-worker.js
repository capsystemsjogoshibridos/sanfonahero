/* Detection runs away from the rendering/audio thread. No images leave the device. */
importScripts('vendor/aruco/cv.js?v=0.4.5', 'vendor/aruco/aruco.js?v=0.4.5', 'vendor/aruco/dictionary.js?v=0.4.5');
const detector = new AR.Detector({ dictionaryName: 'SANFONA_4X4_50', maxHammingDistance: 1 });
self.onmessage = ({ data }) => {
  try {
    const markers = detector.detect(data.image).filter(marker => marker.id === 0 || marker.id === 1);
    self.postMessage({ markers, capturedAt: data.capturedAt });
  } catch (error) {
    self.postMessage({ error: String(error), capturedAt: data.capturedAt });
  }
};
