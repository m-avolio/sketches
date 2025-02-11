class StockAgent {
  constructor(symbol, initialPrice, angle, orbitRadius, color, size) {
    this.symbol = symbol;
    this.price = initialPrice;
    this.prevPrice = initialPrice;
    this.color = color;
    this.size = size;
    // Use the price as mass (so larger-priced stocks accelerate less)
    this.mass = this.price;
    
    // Set the agent's orbit properties
    this.orbitRadius = orbitRadius;
    this.angle = angle; // initial polar angle (in radians)
    // Calculate initial Cartesian position from polar coordinates
    this.position = createVector(
      width / 2 + orbitRadius * cos(angle),
      height / 2 + orbitRadius * sin(angle)
    );
    
    // Set an initial tangential (clockwise) velocity.
    // For a vector from center to position, the clockwise perpendicular is (y, -x).
    let tangent = createVector(sin(angle), -cos(angle));
    this.velocity = tangent.mult(0);
    this.acceleration = createVector(0, 0);
  }
  
  // Apply a force: F = ma → a = F/m.
  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acceleration.add(f);
  }
  update() {
    let center = createVector(width / 2, height / 2);
  
    let radialVec = p5.Vector.sub(this.position, center);
    // Get the clockwise perpendicular (tangent) to the radial vector.
    let tangent = createVector(radialVec.y, -radialVec.x).normalize();

    let change = this.price - this.prevPrice;

    // Do not apply force before init
    if (this.prevPrice === 0) {
        return
    }

    // Fixed print to use the local variable `change`
    // print(`symbol: ${this.symbol}, acceleration: ${this.acceleration}`);
    // Use a copy of tangent so that we don’t modify the original vector.
    let tangentialForce = tangent.copy().mult(change * forceMultiplier);
    this.applyForce(tangentialForce);

    // --- Apply friction force ---
    let frictionCoefficient = 0.05; // Adjust this value as needed.
    let friction = this.velocity.copy().mult(-frictionCoefficient);
    this.applyForce(friction);
  
    // Update velocity and position based on accumulated acceleration.
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    // Reset acceleration for the next frame.
    this.acceleration.mult(0);
  
    // --- Enforce fixed orbit radius ---
    // Get the vector from the center to the current position.
    let offset = p5.Vector.sub(this.position, center);
    // Create a fresh unit vector (without modifying offset) for our direction.
    let unitOffset = offset.copy().normalize();
    // Force the position to be exactly on the orbit circle.
    this.position = p5.Vector.add(center, p5.Vector.mult(unitOffset, this.orbitRadius));
  
    // Remove any radial (inward/outward) component from the velocity.
    // Here we use the same unit vector.
    let radialComponent = p5.Vector.mult(unitOffset, this.velocity.dot(unitOffset));
    this.velocity.sub(radialComponent);
  }

  // Draw the stock as a circle with its ticker symbol.
  display() {
    push();
    blendMode(ADD);
    fill(this.color);
    noStroke();
    circle(this.position.x, this.position.y, this.size);
    
    // Draw the ticker symbol in the center of the circle.
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.symbol, this.position.x, this.position.y);
    pop();
  }
}