var grid;
var gridSize = 8;
var numberOfTurns;
var cnt1, cnt2;

var colors = ["green", "red", "orange", "violet", "indigo", "yellow"];

export default {
  addPlayer(player) {
    $("#lobbyContainer").append(
      `<div class="card" id="${player.id}">
        <h5 class="card-header">${player.username}</h5>
      </div>
      <br>`
    );
  },

  createLobby(users, socketID) {
    for (const [key, value] of Object.entries(users)) {
      if (key === socketID) {
        $("#lobbyContainer").append(
          `<div class="card" id="${value.id}">
            <h5 class="card-header">${value.username}</h5>
            <div class="card-body">
              <input type="checkbox" class="btn btn-primary" id="isReady">Ready</input>
            </div>
          </div>
          <br>`
        );
      } else {
        $("#lobbyContainer").append(
          `<div class="card" id="${value.id}">
            <h5 class="card-header">${value.username}</h5>
          </div>
          <br>`
        );
      }
    }
  },

  removePlayer(id) {
    $(`#${id}`).remove();
  },

  createGrid(x) {
    x = parseInt(x);
    grid = this.initializeGrid(x, x);

    for (var rows = 0; rows < x; rows++) {
      for (var columns = 0; columns < x; columns++) {
        $("#container").append(
          `<div class='grid'>${
            grid[rows + 1][columns + 1][0]
          }<sub class='sub'>(${rows + 1}, ${columns + 1})</sub></div>`
        );
      }
    }

    $(".grid").width(500 / x);
    $(".grid").height(500 / x);
    numberOfTurns = 0;

    console.log("Grid Created");

    return grid;
  },

  // function that clears the grid
  clearGrid() {
    $(".grid").remove();
  },

  // initialize the grid variable
  initializeGrid(rows, columns) {
    grid = new Array(rows + 2);
    for (var i = 0; i < grid.length; i++) {
      grid[i] = new Array(columns + 2);
    }

    for (var i = 0; i < grid.length; i++) {
      for (var j = 0; j < grid[0].length; j++) {
        grid[i][j] = [0, -1];
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

    return grid;
  },

  syncGrid(serverMatrix) {
    // update the in-memory grid first
    for (var i = 0; i < grid.length; i++) {
      for (var j = 0; j < grid[0].length; j++) {
        grid[i][j] = serverMatrix[i][j];
      }
    }

    let ele, idx;

    for (var rows = 0; rows < grid.length - 2; rows++) {
      for (var columns = 0; columns < grid.length - 2; columns++) {
        idx = this.getIdx(rows + 1, columns + 1);
        ele = $(".grid").eq(idx);

        ele.html(
          `${grid[rows + 1][columns + 1][0]}<sub class='sub'>(${rows + 1}, ${
            columns + 1
          })</sub>`
        );

        if (colors[grid[rows + 1][columns + 1][1]] == -1)
          ele.css("color", "#0000ff");
        else ele.css("color", colors[grid[rows + 1][columns + 1][1]]);
      }
    }
  },

  // function that prompts the user to select the number of boxes in a new grid
  // the function then also creates that new grid
  refreshGrid() {
    gridSize = prompt("How many boxes per side?");
    chance = true;
    this.clearGrid();
    this.createGrid(gridSize);
  },

  getCoords(idx) {
    var len = grid.length - 2;
    var row = Math.floor(idx / len) + 1;
    var col = (idx % len) + 1;
    return [row, col];
  },

  getIdx(X, Y) {
    return (grid.length - 2) * (X - 1) + Y - 1;
  },

  detLim(X, Y) {
    var len = grid.length;
    console.log(X, Y, len);

    if (X > 1 && X < len - 2 && Y > 1 && Y < len - 2) return 3;
    else if (
      [X, Y].equals([1, 1]) ||
      [X, Y].equals([1, len - 2]) ||
      [X, Y].equals([len - 2, 1]) ||
      [X, Y].equals([len - 2, len - 2])
    )
      return 1;
    else return 2;
  },

  updateGrid(X, Y, userID) {
    var queue = [];
    queue.push([X, Y]);

    while (queue.length !== 0) {
      console.log(queue);
      var curr = queue.shift();

      if (
        curr[0] < 1 ||
        curr[0] > grid.length - 2 ||
        curr[1] < 1 ||
        curr[1] > grid.length - 2
      )
        continue;

      var idx = this.getIdx(curr[0], curr[1]),
        lim = this.detLim(curr[0], curr[1]);
      var ele = $(".grid").eq(idx);

      console.log(curr, idx, ele.html()[0], lim);

      if (grid[curr[0]][curr[1]][0] < lim) {
        grid[curr[0]][curr[1]][0] += 1;
        ele.css("color", colors[userID]);
        grid[curr[0]][curr[1]][1] = userID;
      } else {
        grid[curr[0]][curr[1]][0] = 0;
        grid[curr[0]][curr[1]][1] = -1; // default

        ele.css("color", "#0000ff");

        queue.push([curr[0] + 1, curr[1]]);
        queue.push([curr[0] - 1, curr[1]]);
        queue.push([curr[0], curr[1] + 1]);
        queue.push([curr[0], curr[1] - 1]);
      }

      ele.html(
        `${grid[curr[0]][curr[1]][0]}<sub class='sub'>(${curr[0]}, ${
          curr[1]
        })</sub>`
      );
    }

    $(".chance").css("color", colors[userID]);
  },
};
