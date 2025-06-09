// Script file from last clean version before AI replay
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const rows = 10;
const cols = 8;
const blockSize = 40;
let grid = [];
let score = 0;
let highScore = 0;
let isAnimating = false;

const colors = ["red", "blue", "green", "orange", "purple"];

function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function createGrid() {
  const arr = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ color: randomColor(), active: true });
    }
    arr.push(row);
  }
  return arr;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const activeCols = grid[0].map((_, c) => grid.some(row => row[c].active));
  const colOffsets = [];
  let offset = 0;
  for (let c = 0; c < cols; c++) {
    colOffsets[c] = activeCols[c] ? offset++ : -1;
  }
  const totalActiveCols = offset;
  const startX = (canvas.width - totalActiveCols * blockSize) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const block = grid[r][c];
      if (block.active && colOffsets[c] >= 0) {
        ctx.fillStyle = block.color;
        ctx.fillRect(startX + colOffsets[c] * blockSize, r * blockSize, blockSize - 2, blockSize - 2);
      }
    }
  }
}

function floodFill(r, c, color, visited) {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return [];
  if (visited[r][c] || !grid[r][c].active || grid[r][c].color !== color) return [];

  visited[r][c] = true;
  let blocks = [{ r, c }];
  blocks = blocks.concat(floodFill(r - 1, c, color, visited));
  blocks = blocks.concat(floodFill(r + 1, c, color, visited));
  blocks = blocks.concat(floodFill(r, c - 1, color, visited));
  blocks = blocks.concat(floodFill(r, c + 1, color, visited));
  return blocks;
}

function handleBlockClick(r, c) {
  if (isAnimating || !grid[r][c].active) return;
  const color = grid[r][c].color;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const blocks = floodFill(r, c, color, visited);
  if (blocks.length <= 1) return;

  score += blocks.length * blocks.length;
  document.getElementById("score").textContent = score;

  blocks.forEach(({ r, c }) => grid[r][c].active = false);
  animateGravity(() => {
    mergeColumns();
    draw();
    if (!hasValidMoves()) {
      document.getElementById("message").textContent = getRandomGameOver();
      document.getElementById("resetBtn").style.display = "inline-block";
      if (score > highScore) {
        highScore = score;
        document.getElementById("highScore").textContent = highScore;
      }
    } else {
      document.getElementById("message").textContent = getRandomPraise();
    }
  });
}

function animateGravity(callback) {
  isAnimating = true;
  let changes = false;
  for (let c = 0; c < cols; c++) {
    for (let r = rows - 1; r > 0; r--) {
      if (!grid[r][c].active && grid[r - 1][c].active) {
        grid[r][c] = grid[r - 1][c];
        grid[r - 1][c] = { color: null, active: false };
        changes = true;
      }
    }
  }
  draw();
  if (changes) {
    setTimeout(() => animateGravity(callback), 100);
  } else {
    isAnimating = false;
    callback();
  }
}

function mergeColumns() {
  const newGrid = Array.from({ length: rows }, () => []);
  let colIndex = 0;
  for (let c = 0; c < cols; c++) {
    if (grid.some(row => row[c].active)) {
      for (let r = 0; r < rows; r++) {
        newGrid[r][colIndex] = grid[r][c];
      }
      colIndex++;
    }
  }
  while (colIndex < cols) {
    for (let r = 0; r < rows; r++) {
      newGrid[r][colIndex] = { color: null, active: false };
    }
    colIndex++;
  }
  grid = newGrid;
}

function getRandomPraise() {
  const messages = ["Nice!", "Great move!", "Keep it up!", "Awesome!", "Well done!"];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomGameOver() {
  const messages = ["Game over!", "No more moves!", "Try again!", "You finished!", "End of game!"];
  return messages[Math.floor(Math.random() * messages.length)];
}

function hasValidMoves() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c].active) continue;
      const color = grid[r][c].color;
      if ((r + 1 < rows && grid[r + 1][c].color === color && grid[r + 1][c].active) ||
          (c + 1 < cols && grid[r][c + 1].color === color && grid[r][c + 1].active)) {
        return true;
      }
    }
  }
  return false;
}

canvas.addEventListener("click", function (event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const c = Math.floor((x - (canvas.width - cols * blockSize) / 2) / blockSize);
  const r = Math.floor(y / blockSize);
  if (r >= 0 && r < rows && c >= 0 && c < cols) {
    handleBlockClick(r, c);
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  grid = createGrid();
  score = 0;
  document.getElementById("score").textContent = "0";
  document.getElementById("message").textContent = "";
  document.getElementById("resetBtn").style.display = "none";
  draw();
});

grid = createGrid();
draw();