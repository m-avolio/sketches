const NoteType = {
  ACCIACCATURA: 1/32,
  QUARTER_ACCIACCATURA: 1/4 - 1/32,
  EIGHTH_ACCIACCATURA: 1/8 - 1/32,
  THIRTY_SECOND: 1/32,
  SIXTEENTH: 1/16,
  EIGHTH: 1/8,
  QUARTER: 1/4,
  HALF: 1/2,
  WHOLE: 1,
  DOTTED_WHOLE: 1 + 1/2,
};

const A4 = 440;
const SEMITONE = 2 ** (1/12);

const NoteFrequency = {
  C4: A4/SEMITONE**9,
  D4: A4/SEMITONE**7,
  E4: A4/SEMITONE**5,
  F4: A4/SEMITONE**4,
  G4: A4/SEMITONE**2,
  A4: A4,
  B4: A4 * SEMITONE**2,
  C5: A4 * SEMITONE**3,
  REST: -1,
};
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
      boid.flock(this.boids);   // <-- includes followMouse()
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
    let removedBoid = this.boids.shift();
    if (removedBoid) {
      removedBoid.dispose();
    }
  }
}

const chordCminor = [
  NoteFrequency.G4 / 2,          // G3: lower voice (G4 halved)
  NoteFrequency.C4,              // C4: root
  NoteFrequency.E4 / SEMITONE,     // Eb4: minor third (E4 lowered by a semitone)
  NoteFrequency.G4               // G4: perfect fifth
];

// A♭ major: using voicing [Ab3, C4, Eb4, Ab4]
const chordAb = [
  (A4 / 2) / SEMITONE,           // Ab3: A3 (half of A4) then flat (divided by SEMITONE)
  NoteFrequency.C4,              // C4: major third of Ab major
  NoteFrequency.E4 / SEMITONE,     // Eb4: perfect fifth of Ab major
  A4 / SEMITONE                  // Ab4: octave above Ab3
];

// E♭ major: using voicing [G3, Bb3, Eb4, G4]
// Note: Bb3 is computed as (440 * SEMITONE) / 2 which gives ~233.08 Hz.
const chordEb = [
  NoteFrequency.G4 / 2,          // G3: lower voice
  (440 * SEMITONE) / 2,          // Bb3: second note (~233.08 Hz)
  NoteFrequency.E4 / SEMITONE,     // Eb4: root of Eb major (E4 lowered by a semitone)
  NoteFrequency.G4               // G4: higher voice
];

// G minor: using voicing [D3, G3, Bb3, D4]
const chordGminor = [
  NoteFrequency.D4 / 2,          // D3: lower voice (D4 halved)
  NoteFrequency.G4 / 2,          // G3: root (G4 halved)
  (440 * SEMITONE) / 2,          // Bb3: minor third (computed as in chordEb)
  NoteFrequency.D4               // D4: perfect fifth
];

// D minor: using voicing [A3, D4, F4, A4]
const chordDminor = [
  NoteFrequency.A4 / 2,          // A3: lower voice (A4 halved)
  NoteFrequency.D4,              // D4: root
  NoteFrequency.F4,              // F4: minor third
  NoteFrequency.A4               // A4: perfect fifth
];

// B♭ major: using voicing [F3, Bb3, D4, F4]
const chordBb = [
  NoteFrequency.F4 / 2,          // F3: lower voice (F4 halved)
  (440 * SEMITONE) / 2,          // Bb3: root (computed as in chordEb)
  NoteFrequency.D4,              // D4: major third
  NoteFrequency.F4               // F4: perfect fifth
];

// F major: using voicing [C4, F4, A4, C5]
const chordFmajor = [
  NoteFrequency.C5 / 2,          // C4: lower voice (C5 halved)
  NoteFrequency.F4,              // F4: root
  NoteFrequency.A4,              // A4: major third
  NoteFrequency.C5               // C5: perfect fifth
];

let currentChord = chordCminor;

class Boid {
  constructor(x, y, color, size) {
    this.acceleration = createVector(0, 0);
    this.velocity     = createVector(random(-1, 1), random(-1, 1));
    this.position     = createVector(x, y);
    this.size         = size;
    this.maxSpeed     = 3;
    this.maxForce     = 0.05;
    this.color        = color;


    const i = int(random(2));
    const type = ['sine', 'triangle', 'square'][i];
    this.osc = new p5.Oscillator(type);
    this.osc.start();

    const relVol = [1, 0.6, 0.25][i];
    this.maxVolume = random(0.3, 1.0) * relVol;

    // Slight detune factor for each boid (±2%)
    this.detuneFactor = random(0.98, 1.02);

    // For spawning line segments
    this.spawnDistance = 5;  
    this.lastSpawnPos  = this.position.copy();
  }

  dispose() {
    this.osc.stop();
  }
  
  flock(boids) {
    let separation = this.separate(boids).mult(1.5);
    let alignment  = this.align(boids).mult(1.0);
    let cohesion   = this.cohesion(boids).mult(1.0);

    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);

    this.followHand();
  }

  followHand() {
    let handVector = createVector(handX, handY);
    let steerToMouse = this.seek(handVector).mult(0.5 + (1-handOpenness));
    this.applyForce(steerToMouse);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    let chordIndex = floor(map(this.position.x, 0, width, 0, currentChord.length));
    chordIndex = constrain(chordIndex, 0, currentChord.length - 1);
    let freq = currentChord[chordIndex] * this.detuneFactor;

    let vibrato = sin(frameCount * 0.02 + this.position.x) * 0.002;
    freq *= (1 + vibrato);

    let amp = this.maxVolume - map(this.position.y, 0, height, 0, this.maxVolume);
    amp = amp * mouthOpenness;

    this.osc.freq(freq);
    this.osc.amp(amp);
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
    let desiredSeparation = 15 + 70*handOpenness;
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
    let neighborDist = 20;
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
    let neighborDist = 20;
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
    this.fadeRate = p.fadeRate/100; // Assuming 'p.fadeRate' is defined in your sketch
  }

  update() {
    this.lifespan -= this.fadeRate;
  }

  render() {
    push();
    let light = lightness(this.color) * this.lifespan;
    stroke(hue(this.color), saturation(this.color), light);
    strokeWeight(this.weight / this.lifespan);
    line(this.p0.x, this.p0.y, this.p1.x, this.p1.y);
    pop();
  }

  isDone() {
    return (this.lifespan <= 0.05);
  }
}