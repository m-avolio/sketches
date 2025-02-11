
class Agent {
    constructor(x, y, size) {
      this.x = x;
      this.y = y;
      this.size = size;
      
      this.isLit = false;
      this.dead = false;
    }
  
    // Randomly toggle blinking on/off if not dead.
    update() {
      if (!this.dead && random(1) < 0.05) {
        this.isLit = !this.isLit;
      }
    }
  
    draw() {
      push();
      rectMode(CENTER);
      noStroke();
      
      // Draw the outer rectangle.
      if (this.isLit) {
        fill(255, 80, 80); // Brighter red when lit.
      } else {
        fill(60, 0, 0);    // Dark red when off.
      }
      rect(this.x, this.y, this.size, this.size);
  
      // Draw the inner rectangle.
      if (this.isLit) {
        fill(200, 0, 0);
      } else {
        fill(100, 0, 0);
      }
      rect(this.x, this.y, this.size * 0.6, this.size * 0.6);
  
      pop();
    }
  }