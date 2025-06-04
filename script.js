
// Assume grid, rows, cols already defined elsewhere

let isAnimating = false;

// Updated event listener
canvas.addEventListener("click", function (event) {
  if (isAnimating) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const c = Math.floor(x / blockSize);
  const r = Math.floor(y / blockSize);
  handleBlockClick(r, c);
});

// Reset game
function resetGame() {
  grid = createGrid(rows, cols);
  score = 0;
  document.getElementById("score").textContent = score;
  document.getElementById("message").textContent = "";
  document.getElementById("replayBtn").style.display = "none";
  draw();
}

// True global optimal solver with scoped vars
function simulateTrueOptimalMoves(initialGrid, rows, cols) {
  const memo = new Map();

  function serializeGrid(grid) {
    return grid.map(row => row.map(cell => cell.active ? cell.color : ".").join("")).join("|");
  }

  function cloneGrid(grid) {
    return JSON.parse(JSON.stringify(grid));
  }

  function floodFill(grid, r, c, color, visited) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || visited[r][c]) return [];
    const cell = grid[r][c];
    if (!cell || !cell.active || cell.color !== color) return [];

    visited[r][c] = true;
    let blocks = [{ r, c }];
    blocks = blocks.concat(floodFill(grid, r - 1, c, color, visited));
    blocks = blocks.concat(floodFill(grid, r + 1, c, color, visited));
    blocks = blocks.concat(floodFill(grid, r, c - 1, color, visited));
    blocks = blocks.concat(floodFill(grid, r, c + 1, color, visited));
    return blocks;
  }

  function applyMove(grid, blocks) {
    blocks.forEach(({ r, c }) => grid[r][c].active = false);

    for (let c = 0; c < cols; c++) {
      let stack = [];
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c].active) stack.push(grid[r][c]);
      }
      for (let r = rows - 1; r >= 0; r--) {
        grid[r][c] = stack[rows - 1 - r] || { color: null, active: false };
      }
    }

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

    return newGrid;
  }

  function recurse(grid) {
    const key = serializeGrid(grid);
    if (memo.has(key)) return memo.get(key);

    let bestScore = 0;
    let bestMoves = [];
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let found = false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!visited[r][c] && grid[r][c].active) {
          let blocks = floodFill(grid, r, c, grid[r][c].color, visited.map(row => row.slice()));
          if (blocks.length > 1) {
            found = true;
            let score = blocks.length * blocks.length;
            let gridCopy = cloneGrid(grid);
            gridCopy = applyMove(gridCopy, blocks);
            const { score: subScore, moves: subMoves } = recurse(gridCopy);
            let total = score + subScore;
            if (total > bestScore) {
              bestScore = total;
              bestMoves = [{ r, c, score }].concat(subMoves);
            }
          }
        }
      }
    }

    if (!found) {
      memo.set(key, { score: 0, moves: [] });
      return { score: 0, moves: [] };
    }

    memo.set(key, { score: bestScore, moves: bestMoves });
    return { score: bestScore, moves: bestMoves };
  }

  return recurse(cloneGrid(initialGrid));
}

// Replay setup
document.getElementById("replayBtn").addEventListener("click", () => {
  const result = simulateTrueOptimalMoves(grid, rows, cols);
  let i = 0;
  let tempGrid = JSON.parse(JSON.stringify(grid));

  isAnimating = true;
  function playNextMove() {
    if (i >= result.moves.length) {
      document.getElementById("message").textContent = `Max Theoretical Score: ${result.score}`;
      isAnimating = false;
      return;
    }
    let move = result.moves[i++];
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let blocks = floodFill(tempGrid, move.r, move.c, tempGrid[move.r][move.c].color, visited);
    blocks.forEach(({ r, c }) => tempGrid[r][c].active = false);
    tempGrid = applyMove(tempGrid, blocks);
    grid = JSON.parse(JSON.stringify(tempGrid));
    draw();
    setTimeout(playNextMove, 300);
  }

  playNextMove();
});
