// parameters
let p = {
  // Color max range
  colorHigh: 290,
  colorHighMin: 0,
  colorHighMax: 360,

  // Color min range
  colorLow: 190,
  colorLowMin: 0,
  colorLowMax: 360,

  // Stock Size
  size: 60,
  sizeMin: 30,
  sizeMax: 150,

  // Stock Symbols
  symbols: "AAPL, GOOG, MRK, TSLA, META, PFE",
};

const forceMultiplier = -10.00;
const finnhubToken = "";

let stockSymbols = [];
let stockAgents = [];

function parseSymbols(txt) {
  stockSymbols = txt
    .split(",")
    .map(symbol => symbol.trim())
    .filter(s => s.length > 0);
}

function setup() {
  // Canvas size defined in index.html
  let container = document.getElementById('canvas-container');
  let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('canvas-container');

  // Add params to Settings GUI
  createSettingsGui(p, { callback: paramChanged, load: false });

  colorMode(HSL, 360, 100, 100);

  initStocks();

  // Set interval for stock data (ms)
  updateStockData();
  setInterval(updateStockData, 10000);
}

function initStocks() {
  stockAgents = [];
  parseSymbols(p.symbols);
  let orbitRadius = p.size;
  let step = (min(width, height)/2 - 1.5*p.size)/stockSymbols.length;
  for (let i = 0; i < stockSymbols.length; i++) {
    orbitRadius += step;
    let randomColor = color(random(p.colorLow, p.colorHigh), 70, 50);
    let agent = new StockAgent(stockSymbols[i], 0, 0, orbitRadius, randomColor, size=p.size);
    stockAgents.push(agent);
  }
}

function draw() {
  background("#f0f0f0");
  fill(0)
  circle(width/2, height/2, min(width, height));

  // Update and display each stock agent.
  for (let agent of stockAgents) {
    agent.update();
    agent.display();
  }
}

function updateStockData() {
  stockSymbols.forEach((symbol) => {
    let url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubToken}`;
    fetch(url)
      .then(response => response.json())
      .then(stockData => {
        // Failsafe: if the response is invalid or missing a proper "c" field, do nothing.
        if (
          !stockData ||
          typeof stockData.c !== "number" ||
          isNaN(stockData.c)
        ) {
          print('this')
          console.error(`Invalid quote data for ${symbol}:`, stockData);
          return; // Skip updating this agent.
        }

        let agent = stockAgents.find(a => a.symbol === symbol);
        if (agent) {
          agent.prevPrice = agent.price;
          agent.price = stockData.c;
          agent.mass = stockData.c;
          print(`symbol: ${agent.symbol}, change: ${agent.price - agent.prevPrice}`)
        }
      })
      .catch(err => console.error(`Error fetching data for ${symbol}:`, err));
  });
}

// Global callback from the settings GUI
function paramChanged(name) {
  if (name == "colorLow" || name == "colorHigh" || name == "symbols" || name == "size") {
    initStocks();
  }
}