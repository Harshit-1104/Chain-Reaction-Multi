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

io.of("/").on("connection", (socket) => {
  socket.on("subscribe", (data) => {
    socket.join(data.socketId); // join the sockets
    socket.join(data.room);

    // send ID Number to the sockets.
    socket.emit("playerInfo", { id: socket.adapter.rooms[data.room].length });

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
});
