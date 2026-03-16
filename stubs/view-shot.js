// Stub web pour react-native-view-shot
// Sur web, la capture de vue native n'est pas disponible.
module.exports = {
  captureRef: async () => null,
  captureScreen: async () => null,
  releaseCapture: () => {},
  default: { captureRef: async () => null },
};
