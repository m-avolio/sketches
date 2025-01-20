// parameters
let p = {
  // Tile size
  tileSize: 64,
  tileSizeMin: 30,
  tileSizeMax: 128,

  // Shape scale
  scale: 1.0,
  scaleMin: 0.1,
  scaleMax: 3,
  scaleStep: 0.01,

  // Color max range
  colorHigh: 150,
  colorHighMin: 0,
  colorHighMax: 360,

  // Color min range
  colorLow: 50,
  colorLowMin: 0,
  colorLowMax: 360
};

let video;
let hands;
let handOpenness = 1;

let agents = [];

function setup() {
  // Canvas size defined in index.html
  let container = document.getElementById('canvas-container');
  let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('canvas-container');

  // Start webcam
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // Prepare Mediapipe
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  hands.onResults(onResults);
  startMediapipe();
  
  // Add params to Settings GUI
  createSettingsGui(p, { callback: paramChanged, load: false });

  // Init agents
  initAgents();
}

function draw() {
  background(255);

  // Update and draw each agent
  for (let agent of agents) {
      agent.update();
      agent.draw();
  }
}

function initAgents() {
  agents = [];

  let cols = floor(width / p.tileSize);
  let rows = floor(height / p.tileSize);

  let leftoverX = width - (cols * p.tileSize);
  let leftoverY = height - (rows * p.tileSize);

  let marginX = leftoverX / 2;
  let marginY = leftoverY / 2;

  // Using HSL colors for convenience
  colorMode(HSL, 360, 100, 100);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = marginX + i * p.tileSize + p.tileSize / 2;
      let y = marginY + j * p.tileSize + p.tileSize / 2;
      let pastelColor = color(random(p.colorLow, p.colorHigh), 70, 80);
      let agent = new Agent(x, y, pastelColor, p.scale * 50);
      agents.push(agent);
    }
  }
  // Back to RGB
  colorMode(RGB, 255);
}

function onResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    handOpenness = 1;
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  let distances = computeDistances(landmarks);

  let mapped  = (distances - 4) / (7 - 4); // map 4 -> 0, 7 -> 1
  handOpenness = constrain(mapped, 0, 1);
}

function euclideanDist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function computeDistances(landmarks) {
  // Reference distance: from wrist (0) to middle finger base (9)
  const wrist = landmarks[0];
  const midBase = landmarks[9];
  const refDist = euclideanDist(wrist, midBase);

  if (refDist < 1e-6) {
    return 0;
  }

  // Sum of distances from wrist to each fingertip
  const fingertips = [4, 8, 12, 16, 20];
  let sumDistances = 0;
  for (let i = 0; i < fingertips.length; i++) {
    sumDistances += euclideanDist(landmarks[fingertips[i]], wrist);
  }

  // Normalize by the reference distance
  return sumDistances / refDist;
}

function startMediapipe() {
  const camera = new Camera(video.elt, {
    onFrame: async () => {
      await hands.send({ image: video.elt });
    },
    width: width,
    height: height
  });
  camera.start();
}

function windowResized() {
  let container = document.getElementById('canvas-container');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}

// Global callback from the settings GUI
function paramChanged(name) {
  if (name == "tileSize" || name == "scale" || name == "colorLow" || name == "colorHigh") {
    initAgents();
  }

}