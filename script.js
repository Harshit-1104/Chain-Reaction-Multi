let express = require("express");
let app = express();
let socketio = require("socket.io");

let path = require("path");

let cache = {};
let roomDetails = {};

const port = process.env.PORT || 3000;

const expressServer = app.listen(port);
const io = socketio(expressServer);
const url = require("url");

app.use(express.static(path.join(__dirname, "client")));
app.use(express.urlencoded());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/home.html");
});

app.post("/createRoom", (req, res) => {
  cache[req.body.roomName] = createSchema(req.body.numPlayers);

  return res.redirect(
    "/lobby?room=" +
      req.body.roomName +
      "&user=" +
      req.body.userName +
      "&size=" +
      req.body.numPlayers
  );
});

app.post("/joinRoom", (req, res) => {
  return res.redirect(
    "/lobby?room=" + req.body.roomName + "&user=" + req.body.userName
  );
});

app.get("/lobby", (req, res) => {
  res.sendFile(__dirname + "/client/lobby.html");
});

function createSchema(roomSize) {
  let arr = [];
  for (let i = 0; i < roomSize; i++) {
    arr.push(i);
  }

  return {
    playerQueue: [],
    users: {},
    roomSize: roomSize,
    globalIDs: arr,
    cntReady: 0,
    turns: 0,
    gameMatrix: initializeGrid(8, 8),
    next_chance: 0,
  };
}

io.of("/").on("connection", (socket) => {
  socket.on("subscribe", (data) => {
    socket.join(data.socketID); // join the sockets
    socket.join(data.room);

    let isPlayer, id;

    // if globalIDs is empty -> room is full, else grab a ID
    if (cache[data.room] === undefined) {
      console.log("Wrong Room");
      // send a custom event to redirect to "NOT FOUND PAGE"
      // use window.location.href = "/notFound"
    } else {
      // room is present

      if (cache[data.room]["globalIDs"].length !== 0) {
        // get a new ID for player
        isPlayer = true;
        id = cache[data.room]["globalIDs"].shift();

        // shifted room details in lobby
        // room details -> socketID = roomid
        roomDetails[data.socketID] = { room: data.room, playerID: id };

        cache[data.room].playerQueue.push(id);
        cache[data.room].users[id] = {
          socketID: data.socketID,
          counts: 0,
          username: data.username,
          readyStatus: false,
        };

        // send ID Number to the sockets.
        socket.emit("playerInfo", { id: id, d: cache[data.room] });
      } else {
        console.log("room is full");
        isPlayer = false;
      }

      // broadcasting new player info
      socket.broadcast.to(data.room).emit("newPlayerInfo", {
        id: id,
        isPlayer: isPlayer,
        username: data.username,
      });
    }
  });

  socket.on("playerStatus", (data) => {
    cache[data.room].users[data.userID].readyStatus = data.status;
    io.sockets.in(data.room).emit("playerStatus", {
      status: data.status,
      id: data.userID,
    });

    if (data.status) cache[data.room].cntReady++;
    else cache[data.room].cntReady--;

    if (
      Object.keys(cache[data.room].users).length == cache[data.room].roomSize
    ) {
      console.log("All have arrived");

      if (cache[data.room].cntReady == cache[data.room].roomSize) {
        console.log("All are ready");

        io.sockets.in(data.room).emit("gameStart", {
          users: cache[data.room].users,
        });

        send_chance(data.room, io);
        cache[data.room].turns++;
      } else console.log("Not All are ready");
    }
  });

  socket.on("gameInfo", (data) => {
    socket.to(data.room).emit("gameInfo", {
      playerClick: data.userClick,
      playerID: data.userID,
    });

    // upgrade the matrix in server - sole truth #Game Server
    updateGrid(data.userClick.X, data.userClick.Y, data.userID, data.room, io);

    send_chance(data.room, io);

    const turns = cache[data.room].turns;

    cache[data.room].turns++;
  });

  socket.on("messageSent", (data) => {
    io.sockets.in(data.room).emit("messageRecieved", {
      room: data.room,
      userID: data.userID,
      msg: data.msg,
      time: data.time,
      username: data.username,
    });
  });

  socket.on("sync_mat", (data) => {
    socket.emit("sync_mat", { gameMatrix: cache[data.room]["gameMatrix"] });
  });

  socket.on("disconnect", (data) => {
    console.log("disconnected", socket.id);

    let details = roomDetails[socket.id];

    if (details !== undefined) {
      let roomleft = details.room;
      // user comes in non existing-room, hence isnt added to that room
      let deleted_id = details.playerID;

      // add the id to globalIDs for new player to join;
      cache[roomleft]["globalIDs"].push(deleted_id);

      delete cache[roomleft]["users"][deleted_id];
      delete roomDetails[socket.id];

      const index = cache[roomleft]["playerQueue"].indexOf(deleted_id);

      if (index > -1) {
        cache[roomleft]["playerQueue"].splice(index, 1);
      }

      socket.broadcast.to(roomleft).emit("playerLeft", {
        id: deleted_id,
      });

      // if the chance was of disconnected player, pass the chance
      if (socket.id === cache[roomleft]["next_chance"])
        send_chance(roomleft, io);
    }
  });

  socket.on("reconnect", (data) => {
    console.log("reconnected", data);
  });
});

function initializeGrid(rows, columns) {
  let grid = new Array(rows + 2);
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
}

function updateGrid(X, Y, userID, roomName, io) {
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

    let lim = detLim(curr[0], curr[1], roomName);

    if (cache[roomName]["gameMatrix"][curr[0]][curr[1]][0] < lim) {
      let prevUserID = cache[roomName]["gameMatrix"][curr[0]][curr[1]][1];
      cache[roomName]["gameMatrix"][curr[0]][curr[1]][1] = userID;

      cache[roomName]["gameMatrix"][curr[0]][curr[1]][0] += 1;

      if (prevUserID === userID) {
        cache[roomName]["users"][userID].counts += 1;
      } else {
        cache[roomName]["users"][userID].counts +=
          cache[roomName]["gameMatrix"][curr[0]][curr[1]][0]; // increment the count of current user

        if (prevUserID !== -1) {
          cache[roomName]["users"][prevUserID].counts -=
            cache[roomName]["gameMatrix"][curr[0]][curr[1]][0] - 1; // decrement the counts of prev

          removeLoser(io, roomName, prevUserID); //check if someone lost
        }
      }
    } else {
      let prevUser = cache[roomName]["gameMatrix"][curr[0]][curr[1]][1];

      cache[roomName]["users"][prevUser].counts -=
        cache[roomName]["gameMatrix"][curr[0]][curr[1]][0]; //decrement count of current user

      if (userID !== prevUser) {
        // since userID can't be zero since it exploded into 4, so check only if it replaces any other
        removeLoser(io, roomName, prevUser); //check if someone lost
      }

      cache[roomName]["gameMatrix"][curr[0]][curr[1]][0] = 0;
      cache[roomName]["gameMatrix"][curr[0]][curr[1]][1] = -1; // default

      queue.push([curr[0] + 1, curr[1]]);
      queue.push([curr[0] - 1, curr[1]]);
      queue.push([curr[0], curr[1] + 1]);
      queue.push([curr[0], curr[1] - 1]);
    }
  }

  io.sockets.in(roomName).emit("cnt", cache[roomName]);
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

function send_chance(roomName, io) {
  // Condition -
  // user has their chance, but due to some uncertainity, they disconnected.
  // How to then switch chance to next user ?
  // Implement a  `send_chance` function
  // everytime user disconnects, check if the player with chance got disconnected? Send chance to next user

  let next_chance = cache[roomName]["playerQueue"].shift();
  cache[roomName]["next_chance"] = next_chance;

  // if user hasn't disconnected push back into the queue

  if (cache[roomName].users[next_chance] !== undefined) {
    cache[roomName]["playerQueue"].push(next_chance);
  }

  io.sockets.in(roomName).emit("isTurn", {
    userTurn: next_chance,
  });
}

function removeLoser(io, roomName, playerID) {
  if (cache[roomName]["users"][playerID].counts === 0) {
    // remove the player from playerQueue, send other users

    const index = cache[roomName]["playerQueue"].indexOf(playerID);
    if (index > -1) {
      cache[roomName]["playerQueue"].splice(index, 1);
    }

    io.sockets.in(roomName).emit("removeLoser", {
      userID: playerID,
      userName: cache[roomName]["users"][playerID]["username"],
    });
  }
}
