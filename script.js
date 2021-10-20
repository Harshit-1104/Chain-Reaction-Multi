let express = require("express");
let app = express();
let socketio = require("socket.io");

let path = require("path");

const port = process.env.PORT || 3000;

const expressServer = app.listen(port);
const io = socketio(expressServer);

app.use("/", express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let turn = 0;

let cache = {};
let roomDetails = {};

function createSchema() {
  return {
    playerQueue: [],
    gameMatrix: initializeGrid(8, 8),
    users: {},
  };
}

io.of("/").on("connection", (socket) => {
  socket.on("subscribe", (data) => {
    socket.join(data.socketId); // join the sockets
    socket.join(data.room);

    let id = socket.adapter.rooms[data.room].length;

    // Store game-data

    roomDetails[data.socketId] = data.room;

    if (cache[data.room] === undefined) {
      let schema = createSchema();
      cache[data.room] = schema;
    }

    cache[data.room].playerQueue.push(id);
    cache[data.room].users[data.socketId] = {
      id: id,
      counts: 0,
    };

    // send ID Number to the sockets.
    socket.emit("playerInfo", { id: id, d: cache[data.room] });

    if (socket.adapter.rooms[data.room].length === 1) {
      // first turn would be of this player
      turn = 0;
      socket.emit("isTurn", { numberOfTurns: 0, userTurn: turn + 1 });
      turn += 1;
    }
  });

  socket.on("gameInfo", (data) => {
    socket.to(data.roomId).emit("gameInfo", {
      playerClick: data.userClick,
      playerID: data.userID,
    });

    // upgrade the matrix in server - sole truth #Game Server
    updateGrid(data.userClick.X, data.userClick.Y, data.userID, data.roomId);

    socket.broadcast.to(data.roomId).emit("isTurn", {
      numberOfTurns: turn,
      userTurn: (turn % socket.adapter.rooms[data.roomId].length) + 1,
    });

    turn++;
  });

  socket.on("sync_mat", (data) => {
    socket.emit("sync_mat", { gameMatrix: cache[data.roomId]["gameMatrix"] });
  });

  socket.on("disconnect", (data) => {
    console.log("disconnected", socket.id);

    let roomleft = roomDetails[socket.id];
    let deleted_id = cache[roomleft]["users"][socket.id]["id"];

    delete cache[roomleft]["users"][socket.id];

    const index = cache[roomleft]["playerQueue"].indexOf(deleted_id);
    if (index > -1) {
      cache[roomleft]["playerQueue"].splice(index, 1);
    }
  });
});

function initializeGrid(rows, columns) {
  let grid = new Array(rows + 2);
  for (var i = 0; i < grid.length; i++) {
    grid[i] = new Array(columns + 2);
  }

  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[0].length; j++) {
      grid[i][j] = [0, 0];
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
}

function updateGrid(X, Y, userID, roomName) {
  var queue = [];
  queue.push([X, Y]);

  while (queue.length !== 0) {
    var curr = queue.shift();

    if (
      curr[0] < 1 ||
      curr[0] > cache[roomName]["gameMatrix"].length - 2 ||
      curr[1] < 1 ||
      curr[1] > cache[roomName]["gameMatrix"].length - 2
    )
      continue;

    var idx = getIdx(curr[0], curr[1], roomName);
    let lim = detLim(curr[0], curr[1], roomName);

    if (cache[roomName]["gameMatrix"][curr[0]][curr[1]][0] < lim) {
      cache[roomName]["gameMatrix"][curr[0]][curr[1]][0] += 1;

      cache[roomName]["gameMatrix"][curr[0]][curr[1]][1] = userID;
    } else {
      cache[roomName]["gameMatrix"][curr[0]][curr[1]][0] = 0;
      cache[roomName]["gameMatrix"][curr[0]][curr[1]][1] = 0;

      queue.push([curr[0] + 1, curr[1]]);
      queue.push([curr[0] - 1, curr[1]]);
      queue.push([curr[0], curr[1] + 1]);
      queue.push([curr[0], curr[1] - 1]);
    }
  }
}

function getIdx(X, Y, roomName) {
  return (cache[roomName]["gameMatrix"].length - 2) * (X - 1) + Y - 1;
}

function detLim(X, Y, roomName) {
  var len = cache[roomName]["gameMatrix"].length;

  if (X > 1 && X < len - 2 && Y > 1 && Y < len - 2) return 3;
  else if (
    [X, Y].equals([1, 1]) ||
    [X, Y].equals([1, len - 2]) ||
    [X, Y].equals([len - 2, 1]) ||
    [X, Y].equals([len - 2, len - 2])
  )
    return 1;
  else return 2;
}

// Custom method to compare arrays +++++++++++++++++++++++++++++++++++++++++++++++++++

// Warn if overriding existing method
if (Array.prototype.equals)
  console.warn(
    "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
  );
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array) return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length) return false;

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i])) return false;
    } else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });
