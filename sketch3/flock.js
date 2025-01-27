// Globals
let lineSegments = [];

function drawLineSegments() {
  for (let i = 0; i < lineSegments.length; i++) {
    lineSegments[i].update();
    lineSegments[i].render();
    
    if (lineSegments[i].isDone()) {
      lineSegments.splice(i, 1);
    }
  }
}

// Boids code from: https://p5js.org/examples/classes-and-objects-flocking/
function mouseDragged() {
  flock.addBoid(new Boid(mouseX, mouseY));
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
      boid.checkSpawnLineSegment(); 
    }

    // Draw boids
    for (let boid of this.boids) {
      boid.drawBoid();
    }
  }

  addBoid(b) {
    this.boids.push(b);
  }
  removeBoid() {
    this.boids.shift();
  }
}

class Boid {
  constructor(x, y, color, size) {
    this.acceleration = createVector(0, 0);
    this.velocity     = createVector(random(-1, 1), random(-1, 1));
    this.position     = createVector(x, y);
    this.size         = size;
    this.maxSpeed     = 3;
    this.maxForce     = 0.05;
    this.color = color;

    // For spawning line segments
    this.spawnDistance = 5;  
    this.lastSpawnPos  = this.position.copy();
  }

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

    if (this.position.x < -this.size) {
      this.position.x = width + this.size;
      wrapped = true;
    } else if (this.position.x > width + this.size) {
      this.position.x = -this.size;
      wrapped = true;
    }

    if (this.position.y < -this.size) {
      this.position.y = height + this.size;
      wrapped = true;
    } else if (this.position.y > height + this.size) {
      this.position.y = -this.size;
      wrapped = true;
    }

    if (wrapped) {
      this.lastSpawnPos.set(this.position);
    }
  }

  checkSpawnLineSegment() {
    let distSinceLast = p5.Vector.dist(this.position, this.lastSpawnPos);
    if (distSinceLast >= this.spawnDistance) {
      let lineColor = color(this.color, 70, 30);
      lineSegments.push(
        new LineSegment(this.lastSpawnPos.copy(), this.position.copy(), lineColor, this.size)
      );
      this.lastSpawnPos.set(this.position);
    }
  }

  drawBoid() {
    push();
    fill(37, 34, 76);
    noStroke();
    circle(this.position.x, this.position.y, this.size * 2);
    pop();
  }

  // --- Boid steering behaviors ---
  separate(boids) {
    let desiredSeparation = 25;
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
    let neighborDist = 50;
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
    let neighborDist = 50;
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

class LineSegment {
  constructor(p0, p1, color, weight) {
    this.p0 = p0;
    this.p1 = p1;
    this.color = color;
    this.weight = weight

    this.lifespan = 1;
    this.fadeRate = p.fadeRate/100;
  }

  update() {
    this.lifespan -= this.fadeRate;
  }

  render() {
    push();
    let light = lightness(this.color)*this.lifespan;
    stroke(hue(this.color), saturation(this.color), light);
    strokeWeight(this.weight/this.lifespan);
    line(this.p0.x, this.p0.y, this.p1.x, this.p1.y);
    pop();
  }

  isDone() {
    return (this.lifespan <= 0.05);
  }
}