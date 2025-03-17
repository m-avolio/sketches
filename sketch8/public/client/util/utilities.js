/**
 * Various Utilities
 */

/**
 * Simple parameter adjustment GUI
 * uses p5.gui
 * > https://github.com/bitcraftlab/p5.gui
 * which wraps the quicksettings library which you can access
 * through .prototype for extra functionality
 * > https://github.com/bit101/quicksettings
 */
let _paramGui;
let _defaultParams;

function createSettingsGui(params, { load, callback }) {
  _defaultParams = { ...params };

  // load last params
  _savedParams = getItem("params");

  if (load && _savedParams) {
    print(_savedParams);

    for (const key in _savedParams) {
      params[key] = _savedParams[key];
    }
  }

  // settings gui
  _paramGui = createGui("Settings");

  _paramGui.prototype.addButton("Save", function () {
    storeItem("params", params);
  });

  // _paramGui.prototype.addButton("Reset", function () {
  //   for (const key in _defaultParams) {
  //     params[key] = _defaultParams[key];
  //   }
  // });

  _paramGui.addObject(params);

  if (callback) _paramGui.prototype.setGlobalChangeHandler(callback);

  // settingsGui.prototype.addRange('size', 1, 64, 32, 1, function(v) { print("size changed", v) } )

  _paramGui.setPosition(width + 10, 10);
  // the 'H' key hides or shows the GUI
  _paramGui.prototype.setKey("H");
  console.log(` 'H' to hide/show settings GUI`);

  return _paramGui;
}

/*
 * Simple debugging to HTML textarea
 */
function createDebugWindow() {
  return new debugWindow();
}

class debugWindow {
  constructor() {
    this.textArea = createElement("textarea");
    this.textArea.style(
      "min-width: 700px; height: 400px; padding: 20px; margin: 20px;"
    );
    this.textArea.html("🪲 debug window created\n");
  }

  log(s) {
    this.textArea.html(s + "\n", true);
  }

  clear() {
    this.textArea.html("");
  }
}

/*
 * Simple FPS display
 */

utilsFps = -1;

/*
 * Draw the current FPS in top left of canvas
 * @param {boolean} options.light - light or dark text
 * @param {number} options.size - size of the text
 */
function drawFps({ light = false, size = 20 } = {}) {
  // filter fps with a simple low-pass filter
  if (utilsFps === -1) {
    utilsFps = frameRate();
  }
  let a = 0.01;
  utilsFps = a * frameRate() + (1 - a) * utilsFps;
  // draw the fps
  stroke(light ? "black" : "white");
  strokeWeight(1);
  fill(light ? "white" : "black");
  textAlign(LEFT, TOP);
  textSize(size);
  text(utilsFps.toFixed(1), 10, 10);
}
