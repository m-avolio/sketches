// parameters
let p = {
  // Color max range
  colorHigh: 190,
  colorHighMin: 0,
  colorHighMax: 360,

  // Color min range
  colorLow: 170,
  colorLowMin: 0,
  colorLowMax: 360,

  // Line size min
  sizeLow: 0.5,
  sizeLowMin: 0.5,
  sizeLowMax: 10,
  sizeLowStep: 0.1,

  // Line size max
  sizeHigh: 5,
  sizeHighMin: 0.5,
  sizeHighMax: 10,
  sizeHighStep: 0.1,

  // Fade rate
  fadeRate: 1,
  fadeRateMin: 0.1,
  fadeRateMax: 10,
  fadeRateStep: 0.01,
};

// Globals
let flock;
let numBoids = 1;
let maxBoids = 100;
let video;
let hands;
let handOpenness = 1;
let handX, handY;
let faceMesh;
let mouthOpenness = 0;
let mouthActive = false;

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

  // Initialize FaceMesh
  faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onFaceResults);

  startMediapipe();

  

  // Add params to Settings GUI
//   createSettingsGui(p, { callback: paramChanged, load: false });

  colorMode(HSL, 360, 100, 100);

  initBoids();
}

function windowResized() {
  // Resize the canvas when the window size changes
  let container = document.getElementById('canvas-container');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}

// For convenience: add boids on mouse drag
function mouseDragged() {
  if (numBoids == maxBoids) {
    flock.removeBoid();
    numBoids--;
  }


  let boidColor = color(random(p.colorLow, p.colorHigh), 70, 35);
  let randomSize = random(p.sizeLow, p.sizeHigh);
  flock.addBoid(new Boid(mouseX, mouseY, boidColor, randomSize));
  numBoids++; 
}

function draw() {
  background(0);
  drawLineSegments();
  flock.run();

  fill(360, 100, 20 + 50*handOpenness);
  noStroke();
  circle(handX, handY, 20);
  if (keyIsDown(32)) {
    flock.removeBoid();
    numBoids--;
  }
}

// Global callback from the settings GUI
function paramChanged(name) {
  if (name == "colorLow" || name == "colorHigh" || name == "sizeLow" || name == "sizeHigh" || name == "fadeRate") {
    initBoids();
  }
}

function initBoids() {
    // Create flock
    flock = new Flock();
    lineSegments = [];

    // Add an initial set of boids into the system
    for (let i = 0; i < numBoids; i++) {
      let boidColor = color(random(p.colorLow, p.colorHigh), 70, 35);
      let randomSize = random(p.sizeLow, p.sizeHigh);
      let b = new Boid(width / 2, height / 2, boidColor, randomSize);
      flock.addBoid(b);
    }
}

function onResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      handOpenness = 1;
      return;
    }
  
    const landmarks = results.multiHandLandmarks[0];
    getHandLocation(landmarks);
    let distances = computeDistances(landmarks);
  
    let mapped  = (distances - 4) / (7 - 4); // map 4 -> 0, 7 -> 1
    handOpenness = constrain(mapped, 0, 1);
}

function onFaceResults(results) {
  if (mouthActive) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      mouthOpenness = 0;
      return;
    }
    const landmarks = results.multiFaceLandmarks[0];
    mouthOpenness = computeMouthOpenness(landmarks);
  } else {
    mouthOpenness = 1;
  }
}

function euclideanDist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function computeMouthOpenness(landmarks) {
  const topLip = landmarks[13];
  const bottomLip = landmarks[14];
  const leftCorner = landmarks[78];
  const rightCorner = landmarks[308];

  const mouthWidth = euclideanDist(leftCorner, rightCorner);
  const mouthHeight = euclideanDist(topLip, bottomLip);

  let ratio = mouthHeight / mouthWidth;

  let mapped = (ratio - 0.02) / (0.7 - 0.02);
  return constrain(mapped, 0, 1);
}

function getHandLocation(landmarks) {
    let sumX = 0, sumY = 0;
    for (let i = 0; i < landmarks.length; i++) {
      sumX += landmarks[i].x;
      sumY += landmarks[i].y;
    }
    // Calculate the average (mean) for x and y
    let avgX = sumX / landmarks.length;
    let avgY = sumY / landmarks.length;
    // Convert normalized coordinates (0-1) to canvas coordinates
    handX = width - (avgX * width);
    handY = avgY * height;
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
      await faceMesh.send({ image: video.elt });
    },
    width: width,
    height: height
  });
  camera.start();
}
function keyPressed() {
  if (key === 'c' || key === 'C') {
    currentChord = chordCminor;
  } else if (key === 'a' || key === 'A') {
    currentChord = chordAb;
  } else if (key === 'e' || key === 'E') {
    currentChord = chordEb;
  } else if (key === 'g' || key === 'G') {
    currentChord = chordGminor;
  } else if (key === 'd' || key === 'D') {
    currentChord = chordDminor;
  } else if (key === 'b' || key === 'B') {
    currentChord = chordBb;
  } else if (key === 'f' || key === 'F') {
    currentChord = chordFmajor;
  } else if (key === 'm' || key === 'M') {
    mouthActive = ~mouthActive;
  }
}