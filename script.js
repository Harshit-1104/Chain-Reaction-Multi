// function that builds a grid in the "container"
var chance = true;
var grid;
var gridSize = 8;
var numberOfTurns;
var cnt1, cnt2;

function createGrid(x) {
  x = parseInt(x);
  initializeGrid(x, x);

  for (var rows = 0; rows < x; rows++) {
    for (var columns = 0; columns < x; columns++) {
      $("#container").append(`<div class='grid'>${grid[rows + 1][columns + 1][0]}<sub class='sub'>(${rows + 1}, ${columns + 1})</sub></div>`);
    };
  };

  $(".grid").width(500 / x);
  $(".grid").height(500 / x);
  numberOfTurns = 0, cnt1 = 0, cnt2 = 0;
};

// function that clears the grid
function clearGrid() {
  $(".grid").remove();
};

// initialize the grid variable
function initializeGrid(rows, columns) {
  grid = new Array(rows + 2);
  for (var i = 0; i < grid.length; i++) {
    grid[i] = new Array(columns + 2);
  }

  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[0].length; j++) {
      grid[i][j] = [0, 0]
    }
  }

  for (var i = 0; i < rows + 2; i++) {
    grid[i][0][0] = -10000;
    grid[i][columns + 1][0] = -10000;
  }

  for (var i = 0; i < columns + 2; i++) {
    grid[0][i][0] = -10000;
    grid[rows + 1][i][0] = -10000;
  }
}

// function that prompts the user to select the number of boxes in a new grid
// the function then also creates that new grid
function refreshGrid() {
  gridSize = prompt("How many boxes per side?");
  chance = true;
  clearGrid();
  createGrid(gridSize);
};

function getCoords(idx) {
  var len = grid.length - 2;
  var row = Math.floor(idx / len) + 1;
  var col = idx % len + 1;
  return [row, col];
}

function getIdx(X, Y) {
  return ((grid.length - 2) * (X - 1) + Y - 1);
}

function detLim(X, Y) {
  var len = grid.length;
  console.log(X, Y, len);

  if (X > 1 && X < len - 2 && Y > 1 && Y < len - 2)
    return 3;
  else if (([X, Y].equals([1, 1])) || ([X, Y].equals([1, len - 2])) || ([X, Y].equals([len - 2, 1])) || ([X, Y].equals([len - 2, len - 2])))
    return 1;
  else
    return 2;
}

function updateGrid(X, Y) {
  var queue = [];
  queue.push([X, Y]);

  while (queue.length !== 0) {
    console.log(queue);
    var curr = queue.shift();

    if (curr[0] < 1 || curr[0] > grid.length - 2 || curr[1] < 1 || curr[1] > grid.length - 2)
      continue;

    var idx = getIdx(curr[0], curr[1]), lim = detLim(curr[0], curr[1]);
    var ele = $(".grid").eq(idx);

    console.log(curr, idx, ele.html()[0], lim);

    if (parseInt(ele.html()[0]) < lim) {
      grid[curr[0]][curr[1]][0] += 1;

      if (chance) {
        ele.css("color", "#00ff00");
        if (grid[curr[0]][curr[1]][1] != 1) {
          cnt1++;
          if (grid[curr[0]][curr[1]][1] == 2)
            cnt2--;
        }
        
        grid[curr[0]][curr[1]][1] = 1;
      } else {
        ele.css("color", "red");
        if (grid[curr[0]][curr[1]][1] != 2) {
          cnt2++;
          if (grid[curr[0]][curr[1]][1] == 1)
            cnt1--;
        }

        grid[curr[0]][curr[1]][1] = 2;
      }
    } else {
      grid[curr[0]][curr[1]][0] = 0;

      if (grid[curr[0]][curr[1]][1] == 1)
        cnt1--;
      else if (grid[curr[0]][curr[1]][1] == 2)
        cnt2--;

      grid[curr[0]][curr[1]][1] = 0;
      ele.css("color", "#0000ff");

      queue.push([curr[0] + 1, curr[1]]);
      queue.push([curr[0] - 1, curr[1]]);
      queue.push([curr[0], curr[1] + 1]);
      queue.push([curr[0], curr[1] - 1]);
    }

    ele.html(`${grid[curr[0]][curr[1]][0]}<sub class='sub'>(${curr[0]}, ${curr[1]})</sub>`);
  }

  if (chance) {
    $(".chance").css("color", "red");
  } else {
    $(".chance").css("color", "#00ff00");
  }

  chance = !chance;
}

// create a 16x16 grid when the page loads
// creates a hover effect that changes the color of a square to black when the mouse passes over it, leaving a (pixel) trail through the grid
// allows the click of a button to prompt the user to create a new grid
$(document).ready(function () {
  createGrid(gridSize);

  $(".grid").click(function () {
    var [X, Y] = getCoords($(this).index());

    if (chance && grid[X][Y][1] == 2)
      return;
    else if (!chance && grid[X][Y][1] == 1)
      return;

    numberOfTurns++;
    updateGrid(X, Y);

    if (numberOfTurns > 2 && (cnt1 == 0 || cnt2 == 0)) {
      if (cnt1 > 0)
        alert("Green Won!");
      else
        alert("Red Won!");
    }
  });

  $(".newGrid").click(function () {
    refreshGrid();

    $(".grid").click(function () {
      console.log(chance, $(this).css("color"));
      var [X, Y] = getCoords($(this).index());

      if (chance && grid[X][Y][1] == 2)
        return;
      else if (!chance && grid[X][Y][1] == 1)
        return;

      numberOfTurns++;
      updateGrid(X, Y);

      if (numberOfTurns > 2 && (cnt1 == 0 || cnt2 == 0)) {
        if (cnt1 > 0)
          alert("Green Won!");
        else
          alert("Red Won!");
      }
    });
  });
});
