
function simulateTrueOptimalMoves(initialGrid) {
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
    // Remove
    blocks.forEach(({ r, c }) => grid[r][c].active = false);

    // Drop down
    for (let c = 0; c < cols; c++) {
      let stack = [];
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c].active) stack.push(grid[r][c]);
      }
      for (let r = rows - 1; r >= 0; r--) {
        grid[r][c] = stack[rows - 1 - r] || { color: null, active: false };
      }
    }

    // Collapse columns
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
