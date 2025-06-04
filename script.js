const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const rows = 10;
const cols = 10;
const blockSize = 40;
const colors = ["red", "blue", "green", "orange"];
let grid = [];

function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
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
        ctx.fillStyle = color;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
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

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / blockSize);
  const y = Math.floor((e.clientY - rect.top) / blockSize);
  const color = grid[y][x];
  const group = getConnected(x, y, color);

  if (group.length >= 2) {
    removeBlocks(group);
    drawGrid();
  }
});

generateGrid();
drawGrid();
