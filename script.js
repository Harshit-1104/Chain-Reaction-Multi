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

    socket.broadcast.to(data.roomId).emit("isTurn", {
      numberOfTurns: turn,
      userTurn: (turn % socket.adapter.rooms[data.roomId].length) + 1,
    });

    turn++;
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
  grid = new Array(rows + 2);
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
