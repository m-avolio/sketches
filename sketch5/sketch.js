let conversationMessages = [];
let aiResponseText = "Waiting for response…";
let initialPrompt = "";
let nextMessage = "";
const SONG = "Daisy., Daisy,, Daisy, give me your answer do. I’m half crazy all for the love of you. It won’t be a stylish marriage, I can’t afford a carriage. But you’ll look sweet upon the seat of a bicycle built for two.";

let startButton;
const OPENAI_API_KEY = "";
let agents = [];

function preload() {
  initialPrompt = loadStrings("initial_prompt.md");
  myfont = loadFont("fonts/EuroStyle_Normal.ttf");
}

function setup() {
  let container = document.getElementById("canvas-container");
  let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent("canvas-container");

  textFont(myfont);
  textSize(24);
  textAlign(CENTER, CENTER);

  startButton = createButton("START");
  startButton.style("font-size", "24px");
  startButton.position(width / 2 - 50, height / 2 - 20);
  startButton.mousePressed(startApp);

  let gridSize = 6;
  let cellSize = width / gridSize;

  nextMessage = `${gridSize*gridSize}/${gridSize*gridSize} memory units active`
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      let x = col * cellSize + cellSize / 2;
      let y = row * cellSize + cellSize / 2;
      agents.push(new Agent(x, y, cellSize * 0.8));
    }
  }
}

function draw() {
  background(0);

  for (let agent of agents) {
    agent.update();
    agent.draw();
  }

  fill(250);
  textSize(25);
  textFont(myfont);
  textAlign(CENTER);
  text(aiResponseText, width / 2, height / 2);
}


function startApp() {
  startButton.remove();

  let audio = new Audio("fitter_happier.mp3");
  audio.loop = true;
  audio.play();

  initialPrompt = join(initialPrompt, "\n");
  conversationMessages.push({ role: "user", content: initialPrompt });
  callChatGPT();
}

function callChatGPT() {
  const url = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model: "gpt-4o",
    messages: conversationMessages,
    temperature: 0.9
  };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENAI_API_KEY
    },
    body: JSON.stringify(payload)
  })
    .then(response => response.json())
    .then(data => {
      if (data && data.choices && data.choices.length > 0) {
        let reply = data.choices[0].message.content;
        aiResponseText = reply;
        conversationMessages.push({ role: "assistant", content: reply });
        speak(reply);
      } else {
        aiResponseText = "Error: No reply received.";
        console.error("Unexpected API response:", data);
      }
    })
    .catch(err => {
      aiResponseText = "Error: " + err;
      console.error("Error calling ChatGPT API:", err);
    });
}


function sendFollowUp(instruction) {
  conversationMessages.push({ role: "user", content: instruction });
  callChatGPT();
}

function speak(text) {
  let utterance = new SpeechSynthesisUtterance(text);

  let voices = window.speechSynthesis.getVoices();
  let fredVoice = voices.find(voice => voice.name.includes("Fred"));
  if (fredVoice) {
    utterance.voice = fredVoice;
  } else {
    console.warn("Fred voice not found. Using default voice.");
  }

  utterance.onend = () => {
    if (nextMessage === SONG) {
      let songUtterance = new SpeechSynthesisUtterance(SONG);
      if (fredVoice) {
        songUtterance.voice = fredVoice;
      }

      songUtterance.onend = () => {
      };

      window.speechSynthesis.speak(songUtterance);

    } else {
      conversationMessages.push({ role: "user", content: nextMessage });
      callChatGPT();
    }
  };

  window.speechSynthesis.speak(utterance);
}


function mousePressed() {
  for (let agent of agents) {
    if (
      mouseX >= agent.x - agent.size / 2 &&
      mouseX <= agent.x + agent.size / 2 &&
      mouseY >= agent.y - agent.size / 2 &&
      mouseY <= agent.y + agent.size / 2
    ) {
      if (!agent.dead) {
        agent.dead = true;
        agent.isLit = false;
      } else if (agent.dead) {
        agent.dead = false;
        agent.isLit = true;
      }
      let aliveCount = agents.filter(a => !a.dead).length;
      let total = agents.length;

      if (aliveCount === 0) {
        nextMessage = SONG;
        aiResponseText = null;
      } else {
        nextMessage = `${aliveCount}/${total} memory units active`;
      }
      break;
    }
  }
}