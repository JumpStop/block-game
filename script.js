const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highscore");
const resetBtn = document.getElementById("resetBtn");

const rows = 10;
const cols = 10;
const blockSize = 40;
const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f"];
let textures = [];

let grid = [];
let score = 0;
let highScore = 0;

function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateTextures() {
  textures = colors.map((color) => {
    const tex = document.createElement("canvas");
    tex.width = blockSize;
    tex.height = blockSize;
    const tctx = tex.getContext("2d");
    tctx.fillStyle = color;
    tctx.fillRect(0, 0, blockSize, blockSize);
    tctx.strokeStyle = "#fff";
    for (let i = 0; i < 4; i++) {
      tctx.beginPath();
      tctx.moveTo(0, i * 10);
      tctx.lineTo(blockSize, i * 10);
      tctx.stroke();
    }
    return tex;
  });
}

function generateGrid() {
  grid = [];
  for (let y = 0; y < rows; y++) {
    let row = [];
    for (let x = 0; x < cols; x++) {
      row.push(randomColor());
    }
    grid.push(row);
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid[y][x];
      if (color) {
        const texIndex = colors.indexOf(color);
        ctx.drawImage(textures[texIndex], x * blockSize, y * blockSize);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    }
  }
}

function getConnected(x, y, color, visited = new Set()) {
  const key = x + "," + y;
  if (
    x < 0 || y < 0 || x >= cols || y >= rows ||
    grid[y][x] !== color || visited.has(key)
  ) return [];

  visited.add(key);
  let group = [[x, y]];

  [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
    group = group.concat(getConnected(x + dx, y + dy, color, visited));
  });

  return group;
}

function removeBlocks(group) {
  group.forEach(([x, y]) => {
    grid[y][x] = null;
  });

  for (let x = 0; x < cols; x++) {
    let col = [];
    for (let y = rows - 1; y >= 0; y--) {
      if (grid[y][x]) col.push(grid[y][x]);
    }
    for (let y = rows - 1; y >= 0; y--) {
      grid[y][x] = col[rows - 1 - y] || null;
    }
  }
}

function updateScore(points) {
  score += points;
  scoreDisplay.textContent = "Score: " + score;
  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = "High Score: " + highScore;
  }
}

function hasMoves() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid[y][x];
      if (color && getConnected(x, y, color).length > 1) return true;
    }
  }
  return false;
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / blockSize);
  const y = Math.floor((e.clientY - rect.top) / blockSize);
  const color = grid[y][x];
  const group = getConnected(x, y, color);

  if (group.length >= 2) {
    removeBlocks(group);
    updateScore(group.length * group.length); // score = size^2
    drawGrid();
    if (!hasMoves()) {
      setTimeout(() => {
        alert("No more moves! Your score: " + score);
      }, 100);
    }
  }
});

resetBtn.addEventListener("click", () => {
  score = 0;
  scoreDisplay.textContent = "Score: 0";
  generateGrid();
  drawGrid();
});

generateTextures();
generateGrid();
drawGrid();
