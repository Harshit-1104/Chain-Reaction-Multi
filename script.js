// function that builds a grid in the "container"
var chance = true;
var grid;
var gridSize = 8;

function createGrid(x) {
  x = parseInt(x);
  initializeGrid(x, x);

  for (var rows = 0; rows < x; rows++) {
      for (var columns = 0; columns < x; columns++) {
          $("#container").append(`<div class='grid'>${grid[rows+1][columns+1]}</div>`);
      };
  };

  $(".grid").width(500/x);
  $(".grid").height(500/x);
};

// function that clears the grid
function clearGrid(){
  console.log(grid);
  $(".grid").remove();
};

// initialize the grid variable
function initializeGrid(rows, columns) {
  grid = new Array(rows+2);
  console.log(grid, rows, columns);
  for (var i = 0; i < grid.length; i++) {
    grid[i] = new Array(columns+2);
  }

  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[0].length; j++) {
      grid[i][j] = 0;
    }
  }

  for (var i = 0; i < rows+2; i++) {
    grid[i][0] = -10000;
    grid[i][columns+1] = -10000;
  }

  for (var i = 0; i < columns+2; i++) {
    grid[0][i] = -10000;
    grid[rows+1][i] = -10000;
  }
}

// function that prompts the user to select the number of boxes in a new grid
// the function then also creates that new grid
function refreshGrid(){
  gridSize = prompt("How many boxes per side?");
  chance = true;
  clearGrid();
  createGrid(gridSize);
};

function getCoords(idx) {
  var len = grid.length-2;
  var row = Math.floor(idx/len) + 1;
  var col = idx % len + 1;
  return [row, col];
}

function getIdx(X, Y) {
  return ((grid.length-2) * (X-1) + Y -1);
}

function updateGrid(X, Y) {
  var queue = [];
  queue.push([X, Y]);

  while (queue.length !== 0) {
    console.log(queue);
    var curr = queue.shift();
    var idx = getIdx(curr[0], curr[1]);
    var ele = $(".grid").eq(idx);

    console.log(curr, idx, ele.html());

    if (parseInt(ele.html()) < 3) {
      grid[curr[0]][curr[1]] += 1;
    } else {
      grid[curr[0]][curr[1]] = 0;

      queue.push([X+1, Y]);
      queue.push([X-1, Y]);
      queue.push([X, Y+1]);
      queue.push([X, Y-1]);
    }

    ele.html(`${grid[curr[0]][curr[1]]}`);
    
    if (chance) {
      ele.css("color", "#00ff00");
    } else {
      ele.css("color", "red");
    }
  }
  chance = !chance;
}

// create a 16x16 grid when the page loads
// creates a hover effect that changes the color of a square to black when the mouse passes over it, leaving a (pixel) trail through the grid
// allows the click of a button to prompt the user to create a new grid
$(document).ready(function() {
  createGrid(gridSize);

  $(".grid").click(function() {
    var [X, Y] = getCoords($(this).index());
    
    console.log(this, X, Y);
    updateGrid(X, Y);
  }); 

  $(".newGrid").click(function() {
      refreshGrid();

      $(".grid").click(function() {
          var [X, Y] = getCoords($(this).index());
          updateGrid(X, Y);
        }); 
  });
});
