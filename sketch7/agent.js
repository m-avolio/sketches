class Agent {
  constructor(x, y, color, size) {
    // Starting pos
    this.gridX = x;
    this.gridY = y;

    // Current pos
    this.x = x;
    this.y = y;

    this.color = color;

    this.size = size
  }

  update() {
    let centerX = width / 2;
    let centerY = height / 2;
    this.x = lerp(centerX, this.gridX, handOpenness);
    this.y = lerp(centerY, this.gridY, handOpenness);
  }

  draw() {
    push();
      blendMode(MULTIPLY);
      noStroke();
      fill(this.color);
      ellipse(this.x, this.y, this.size);
    pop();
  }
}
