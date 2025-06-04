
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const rows = 10;
const cols = 10;
const blockSize = 40;
let grid = [];
let score = 0;
let highscore = 0;
const colors = ["red", "blue", "green", "yellow", "purple"];
const praiseMessages = ["Nice!", "Great move!", "Awesome!", "Keep going!", "You're on fire!"];
const endMessages = ["Game Over!", "No more moves!", "Try again!", "You're done!", "All clear!"];

document.getElementById("resetBtn").onclick = resetGame;

function init() {
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = { color: colors[Math.floor(Math.random() * colors.length)], active: true };
    }
  }
  score = 0;
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell && cell.active && cell.color) {
        ctx.fillStyle = cell.color;
        ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
        ctx.strokeRect(c * blockSize, r * blockSize, blockSize, blockSize);
      }
    }
  }
}

function floodFill(r, c, color, visited) {
  if (r < 0 || r >= rows || c < 0 || c >= cols || visited[r][c]) return [];
  const cell = grid[r][c];
  if (!cell || !cell.active || cell.color !== color) return [];

  visited[r][c] = true;
  let blocks = [{ r, c }];
  blocks = blocks.concat(floodFill(r - 1, c, color, visited));
  blocks = blocks.concat(floodFill(r + 1, c, color, visited));
  blocks = blocks.concat(floodFill(r, c - 1, color, visited));
  blocks = blocks.concat(floodFill(r, c + 1, color, visited));
  return blocks;
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const c = Math.floor(x / blockSize);
  const r = Math.floor(y / blockSize);

  if (!grid[r] || !grid[r][c] || !grid[r][c].active) return;
  const color = grid[r][c].color;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const blocks = floodFill(r, c, color, visited);

  if (blocks.length <= 1) return;

  let gained = blocks.length * blocks.length;
  score += gained;
  document.getElementById("score").textContent = "Score: " + score;
  const delta = document.getElementById("deltaScore");
  delta.textContent = `+${gained}`;
  delta.style.opacity = 1;
  setTimeout(() => delta.style.opacity = 0, 1000);

  if (score > highscore) {
    highscore = score;
    document.getElementById("highscore").textContent = "High Score: " + highscore;
  }

  animateRemoval(blocks);
});

function animateRemoval(blocks) {
  let frames = 10;
  const interval = setInterval(() => {
    blocks.forEach(({ r, c }) => {
      const cell = grid[r][c];
      if (cell) {
        cell.alpha = (cell.alpha || 1) - 1 / frames;
      }
    });
    drawWithAlpha();
    if (--frames <= 0) {
      clearInterval(interval);
      blocks.forEach(({ r, c }) => grid[r][c].active = false);
      animateDrop();
    }
  }, 30);
}

function drawWithAlpha() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell && cell.active && cell.color) {
        ctx.globalAlpha = cell.alpha || 1;
        ctx.fillStyle = cell.color;
        ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
        ctx.strokeRect(c * blockSize, r * blockSize, blockSize, blockSize);
        ctx.globalAlpha = 1;
      }
    }
  }
}

function animateDrop() {
  let changed = false;
  for (let c = 0; c < cols; c++) {
    for (let r = rows - 1; r > 0; r--) {
      if (!grid[r][c].active && grid[r - 1][c].active) {
        grid[r][c] = grid[r - 1][c];
        grid[r - 1][c] = { color: null, active: false };
        changed = true;
      }
    }
  }
  draw();
  if (changed) {
    setTimeout(animateDrop, 30);
  } else {
    collapseColumns();
    draw();
    updateMessage(praiseMessages);
    if (!hasMoves()) {
      document.getElementById("resetBtn").style.display = "inline-block";
      updateMessage(endMessages);
    }
  }
}

function collapseColumns() {
  let newGrid = Array.from({ length: rows }, () => []);
  let colIndex = 0;

  for (let c = 0; c < cols; c++) {
    let isEmpty = grid.every(row => !row[c].active);
    if (!isEmpty) {
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

function hasMoves() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].active) {
        const color = grid[r][c].color;
        if ((r < rows - 1 && grid[r + 1][c].color === color && grid[r + 1][c].active) ||
            (c < cols - 1 && grid[r][c + 1].color === color && grid[r][c + 1].active)) {
          return true;
        }
      }
    }
  }
  return false;
}

function updateMessage(messages) {
  const msg = messages[Math.floor(Math.random() * messages.length)];
  document.getElementById("message").textContent = msg;
}

function resetGame() {
  document.getElementById("resetBtn").style.display = "none";
  document.getElementById("message").textContent = "";
  document.getElementById("deltaScore").textContent = "";
  init();
}

init();
