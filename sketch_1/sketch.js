// Globals
let images = [];
let scaleFactor = 1.0;

function setup() {
  // Canvas size defined in index.html
  let container = document.getElementById('canvas-container');
  let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('canvas-container');
}

function windowResized() {
  // Resize the canvas when the window size changes
  let container = document.getElementById('canvas-container');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}

function preload() {
  loadStrings("data/locations.csv", (data) => {
    for (let i = 0; i < data.length; i++) {
      let [imageName, x, y] = data[i].split(",");
      x = parseFloat(x);
      y = parseFloat(y);
      let img = loadImage(`data/${imageName}.jpg`);
      images.push({
        img: img,
        location: [x, y]
      });
    }
  });
}

function draw() {
  if (images.length === 0) return;
  
  print(width, height)
  let mx = (mouseX/width - 0.5);
  let my = -(mouseY/height - 0.5);
  print(mx, my)
  let closestIndex = -1;
  let minDist = Infinity;

  for (let i = 0; i < images.length; i++) {
    let [ix, iy] = images[i].location;
    let dx = mx - ix;
    let dy = my - iy;
    let distSq = dx * dx + dy * dy;
    if (distSq < minDist) {
      minDist = distSq;
      closestIndex = i;
    }
  }

  let chosen;
  if (closestIndex < 0) {
    chosen = images[0].img;
  } else {
    chosen = images[closestIndex].img; 
  }

  let scaleW = width / chosen.width;
  let scaleH = height / chosen.height;
  scaleFactor = Math.min(scaleW, scaleH);
  push();
  let wImg = chosen.width * scaleFactor;
  let hImg = chosen.height * scaleFactor;
  print(wImg, hImg)
  image(chosen, 0, 0, wImg, hImg);
  pop();
}