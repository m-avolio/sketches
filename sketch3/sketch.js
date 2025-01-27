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
let numBoids = 100;
let maxBoids = 200;

function setup() {
  // Canvas size defined in index.html
  let container = document.getElementById('canvas-container');
  let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('canvas-container');

  // Add params to Settings GUI
  createSettingsGui(p, { callback: paramChanged, load: false });

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
    numBoids = 100;

    // Add an initial set of boids into the system
    for (let i = 0; i < numBoids; i++) {
      let boidColor = color(random(p.colorLow, p.colorHigh), 70, 35);
      let randomSize = random(p.sizeLow, p.sizeHigh);
      let b = new Boid(width / 2, height / 2, boidColor, randomSize);
      flock.addBoid(b);
    }
}