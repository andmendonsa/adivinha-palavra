// ---- Lista de palavras (5 letras, sem acento p/ simplificar o teclado) ----
const WORDS = [
  "TERRA","CARRO","LIVRO","MUNDO","PEDRA","PORTA","PRAIA","NOITE","FESTA","FORTE",
  "LARGO","CURTO","BONDE","CARTA","FALAR","ANDAR","FALTA","HOMEM","FILHO","CASAL",
  "VERDE","PRETO","CINZA","FRUTA","GRAMA","FOLHA","GALHO","CAMPO","RURAL","MUROS",
  "PORTO","NAVIO","BARCO","TRENS","AVIAO","GATOS","LOBOS","URSOS","PATOS","GALOS",
  "PEIXE","COBRA","AGUIA","LEOES","TIGRE","ZEBRA","DANCA","FILME","JOGOS","BOLAS",
  "TIMES","PONTE","MALAS","HOTEL","MONTE","LAGOS","MARES","CHUVA","VENTO","CALOR",
  "FRIOS","NUVEM","RAIOS","LUZES","CLARO","LAPIS","MESAS","CHAVE","ABRIR","OUVIR",
  "SONHO","IDEIA","ARROZ","BOLOS","DOCES","LEITE","CARNE","FRITO","MOLHO","SUCOS",
  "AGUAS","VINHO","CAFES","MASSA","PIZZA","LIMAO","MANGA","MELAO","COCOS","NOZES",
  "ROXOS","CORPO","PERNA","BRACO","DEDOS","DENTE","BOCAS","NARIZ","OMBRO","PEITO",
  "COSTA","UNHAS","PELOS","ATRIZ","JUIZA","TENIS","NADAR","PULAR","CHUTE","CHIPS",
  "DADOS","SENHA","TECLA","TELAS","REDES","LINKS","SINAL","MEDOS","RAIVA","CALMA",
  "SORTE","PORCO","VACAS","POLVO","MOSCA","GRILO","POMBO","CORVO","CISNE","TATUS",
  "SAPOS","RATOS","CAMAS","SOFAS","FOGAO","BANHO","SALAS","TETOS","PISOS","GRADE",
  "VASOS","HORAS","MESES","MANHA","TARDE","AGORA","COMER","BEBER","LAVAR","JOGAR",
  "CRIAR","PODER","SABER","VIVER","PRACA"
];
const VALID_GUESSES = new Set(WORDS);

const WORD_LENGTH = 5;
const MAX_TRIES = 6;

let answer = "";
let currentGuess = "";
let currentRow = 0;
let gameOver = false;
const rows = []; // { tiles: [el,...] }
const keyStatus = {}; // letter -> 'correct'|'present'|'absent'

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const toastEl = document.getElementById("toast");
const modalEl = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalBtn = document.getElementById("modal-btn");
const newGameBtn = document.getElementById("new-game-btn");

function buildBoard() {
  boardEl.innerHTML = "";
  rows.length = 0;
  for (let r = 0; r < MAX_TRIES; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    const tiles = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      rowEl.appendChild(tile);
      tiles.push(tile);
    }
    boardEl.appendChild(rowEl);
    rows.push({ tiles });
  }
}

const KB_LAYOUT = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  ["ENTER", ..."ZXCVBNM".split(""), "BACK"]
];

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  KB_LAYOUT.forEach(rowKeys => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    rowKeys.forEach(k => {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.dataset.key = k;
      if (k === "ENTER" || k === "BACK") btn.classList.add("wide");
      btn.textContent = k === "BACK" ? "⌫" : (k === "ENTER" ? "ENTER" : k);
      btn.addEventListener("click", () => handleKey(k === "BACK" ? "Backspace" : (k === "ENTER" ? "Enter" : k)));
      rowEl.appendChild(btn);
    });
    keyboardEl.appendChild(rowEl);
  });
}

function showToast(msg, duration = 1400) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), duration);
}

function startNewGame() {
  answer = WORDS[Math.floor(Math.random() * WORDS.length)];
  currentGuess = "";
  currentRow = 0;
  gameOver = false;
  Object.keys(keyStatus).forEach(k => delete keyStatus[k]);
  buildBoard();
  buildKeyboard();
  modalEl.classList.add("hidden");
}

function updateRowDisplay() {
  const tiles = rows[currentRow].tiles;
  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = currentGuess[i] || "";
    tiles[i].textContent = letter;
    tiles[i].classList.toggle("filled", !!letter);
  }
}

function shakeRow() {
  const rowEl = boardEl.children[currentRow];
  rowEl.classList.add("shake");
  setTimeout(() => rowEl.classList.remove("shake"), 400);
}

function evaluateGuess(guess) {
  const result = Array(WORD_LENGTH).fill("absent");
  const answerLetters = answer.split("");
  const used = Array(WORD_LENGTH).fill(false);

  // First pass: correct
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  // Second pass: present
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const idx = answerLetters.findIndex((l, j) => l === guess[i] && !used[j]);
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }
  return result;
}

function applyKeyStatus(letter, status) {
  const rank = { absent: 0, present: 1, correct: 2 };
  if (!keyStatus[letter] || rank[status] > rank[keyStatus[letter]]) {
    keyStatus[letter] = status;
  }
}

function refreshKeyboardColors() {
  document.querySelectorAll(".key").forEach(btn => {
    const k = btn.dataset.key;
    const status = keyStatus[k];
    btn.classList.remove("correct", "present", "absent");
    if (status) btn.classList.add(status);
  });
}

function submitGuess() {
  if (currentGuess.length !== WORD_LENGTH) {
    showToast("Faltam letras");
    shakeRow();
    return;
  }
  if (!VALID_GUESSES.has(currentGuess)) {
    showToast("Palavra não está na lista");
    shakeRow();
    return;
  }

  const result = evaluateGuess(currentGuess);
  const tiles = rows[currentRow].tiles;

  result.forEach((status, i) => {
    setTimeout(() => {
      tiles[i].classList.add("flip");
      setTimeout(() => {
        tiles[i].classList.add(status);
        applyKeyStatus(currentGuess[i], status);
        refreshKeyboardColors();
      }, 250);
    }, i * 300);
  });

  const totalDelay = WORD_LENGTH * 300 + 300;

  setTimeout(() => {
    if (currentGuess === answer) {
      gameOver = true;
      const messages = ["Incrível!", "Excelente!", "Muito bem!", "Mandou bem!", "Ufa!", "Por pouco!"];
      openModal("🎉 Você venceu!", messages[currentRow] || "Parabéns!");
    } else if (currentRow === MAX_TRIES - 1) {
      gameOver = true;
      openModal("😔 Fim de jogo", `A palavra era: ${answer}`);
    } else {
      currentRow++;
      currentGuess = "";
    }
  }, totalDelay);
}

function openModal(title, text) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  modalEl.classList.remove("hidden");
}

function handleKey(key) {
  if (gameOver) return;

  if (key === "Enter") {
    submitGuess();
    return;
  }
  if (key === "Backspace") {
    currentGuess = currentGuess.slice(0, -1);
    updateRowDisplay();
    return;
  }
  if (/^[A-Za-z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
    currentGuess += key.toUpperCase();
    updateRowDisplay();
  }
}

document.addEventListener("keydown", (e) => {
  handleKey(e.key);
});

newGameBtn.addEventListener("click", startNewGame);
modalBtn.addEventListener("click", startNewGame);

startNewGame();
