let flock;
let clientId;
const MAX_BOIDS = 300;

const socket = io();
socket.on("connect", () => {
  clientId = socket.id;
  console.log("Connected with id:", clientId);
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  flock = new Flock();
  colorMode(HSL, 360, 100, 100);
}

function draw() {
  background(0);

  push();
  blendMode(ADD);
  translate(-window.screenX, -window.screenY);
  flock.run();
  pop();

  for (let boid of flock.boids) {
    if (boid.owner === clientId) {
      socket.emit("boid", {
        id: boid.id,
        owner: boid.owner,
        x: boid.position.x,
        y: boid.position.y,
        vx: boid.velocity.x,
        vy: boid.velocity.y,
        lastSpawnX: boid.lastSpawnPos.x,
        lastSpawnY: boid.lastSpawnPos.y,
        boidColor: [hue(boid.color), saturation(boid.color), lightness(boid.color)],
        size: boid.size
      });
    }
  }
}

function mouseDragged() {
  let newBoid = new Boid(mouseX + window.screenX, mouseY + window.screenY);
  newBoid.id = generateID();
  newBoid.owner = clientId;
  flock.addBoid(newBoid);
  socket.emit("boid", {
    id: newBoid.id,
    owner: newBoid.owner,
    x: newBoid.position.x,
    y: newBoid.position.y,
    vx: newBoid.velocity.x,
    vy: newBoid.velocity.y,
    lastSpawnX: newBoid.lastSpawnPos.x,
    lastSpawnY: newBoid.lastSpawnPos.y,
    boidColor: [hue(newBoid.color), saturation(newBoid.color), lightness(newBoid.color)],
    size: newBoid.size
  });
}

socket.on("boid", (data) => {
  if (data.owner === clientId) return;
  
  let existing = flock.boids.find(b => b.id === data.id);
  if (existing) {
    existing.position.set(data.x, data.y);
    existing.velocity.set(data.vx, data.vy);
    existing.lastSpawnPos.set(data.lastSpawnX, data.lastSpawnY);
  } else {
    let boid = new Boid(data.x, data.y);
    boid.id = data.id;
    boid.owner = data.owner;
    boid.velocity = createVector(data.vx, data.vy);
    boid.lastSpawnPos = createVector(data.lastSpawnX, data.lastSpawnY);
    if (data.boidColor) {
      boid.color = color(data.boidColor[0], data.boidColor[1], data.boidColor[2]);
    }
    if (data.size) {
      boid.size = data.size;
    }
    flock.addBoid(boid);
  }
});

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function generateID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

class Flock {
  constructor() {
    this.boids = [];
  }
  
  run() {
    for (let boid of this.boids) {
      boid.flock(this.boids);
      boid.update();
      boid.borders();
      boid.drawBoid();
    }
  }
  
  addBoid(b) {
    if (this.boids.length >= MAX_BOIDS) {
      this.removeBoid();
    }
    this.boids.push(b);
  }
  
  removeBoid() {
    this.boids.shift();
  }
}

class Boid {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.acceleration = createVector(0, 0);
    this.size = random(5, 15);
    this.maxSpeed = 3;
    this.maxForce = 0.05;
    this.color = color(random(360), 80, 80);
    this.owner = null;
    this.spawnDistance = 5;
    this.lastSpawnPos = this.position.copy();
  }
  
  // Flocking behavior
  flock(boids) {
    let separation = this.separate(boids).mult(1.5);
    let alignment  = this.align(boids).mult(1.0);
    let cohesion   = this.cohesion(boids).mult(1.0);
    
    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
  }
  
  applyForce(force) {
    this.acceleration.add(force);
  }
  
  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }
  
  borders() {
    let wrapped = false;
    if (this.position.x < 0) {
      this.position.x = screen.width;
      wrapped = true;
    } else if (this.position.x > screen.width) {
      this.position.x = 0;
      wrapped = true;
    }
    if (this.position.y < 0) {
      this.position.y = screen.height;
      wrapped = true;
    } else if (this.position.y > screen.height) {
      this.position.y = 0;
      wrapped = true;
    }
  }
  
  drawBoid() {
    let localX = this.position.x - window.screenX;
    let localY = this.position.y - window.screenY;
    let margin = 50;
    if (localX >= 0-margin && localX <= windowWidth+margin &&
        localY >= 0-margin && localY <= windowHeight+margin) {
      push();
      fill(this.color);
      noStroke();
      circle(this.position.x, this.position.y, this.size * 2);
      pop();
    }
  }
  
  // --- Steering Behaviors ---
  separate(boids) {
    let desiredSeparation = 20;
    let steer = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) steer.div(count);
    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }
    return steer;
  }
  
  align(boids) {
    let neighborDist = 40;
    let sum = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDist) {
        sum.add(other.velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }
  
  cohesion(boids) {
    let neighborDist = 40;
    let sum = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDist) {
        sum.add(other.position);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    return createVector(0, 0);
  }
  
  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    desired.normalize();
    desired.mult(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }
}