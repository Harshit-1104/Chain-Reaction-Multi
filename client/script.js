// function that builds a grid in the "container"
var myTurn = false;
var grid;
var gridSize = 8;
var numberOfTurns = 0;

var socketID = "";
let room = "ABCD";
let username = "pqrt";
let roomSize;
let userID;
let playerClick;
let playerID;

import h from "./helpers.js";
// create a 16x16 grid when the page loads
// creates a hover effect that changes the color of a square to black when the mouse passes over it, leaving a (pixel) trail through the grid
// allows the click of a button to prompt the user to create a new grid

$(document).ready(function () {
  const url = new URL(window.location.href);
  room = url.searchParams.get("room");
  username = url.searchParams.get("user");
  roomSize = url.searchParams.get("size");

  console.log(room);

  let socket = io("/");
  socket.on("connect", () => {
    //set socketId
    socketID = socket.io.engine.id;

    socket.emit("subscribe", {
      room: room,
      socketID: socketID,
      username: username,
      roomSize: roomSize,
    });
  });

  socket.on("playerInfo", (data) => {
    userID = data.id;
    console.log(data);

    h.createLobby(data.d.users, userID);
  });

  socket.on("newPlayerInfo", (data) => {
    console.log(data.newPlayer);
    if (data.isPlayer) {
      h.addPlayer(data);
    }
  });

  socket.on("cnt", (data) => {
    console.log("cnt", data);
  });

  socket.on("removeLoser", (data) => {
    console.log("lost", data);
  });

  $(document).on("click", "#isReady", function () {
    console.log("clicked");

    socket.emit("playerStatus", {
      room: room,
      socketID: socketID,
      status: this.checked,
      userID: userID,
    });
  });

  socket.on("gameStart", (data) => {
    console.log("Participants : ", data.users);
    grid = h.createGrid(gridSize);
  });

  $(".syncMat").click(function () {
    socket.emit("sync_mat", { room: room });
  });

  socket.on("sync_mat", (data) => {
    console.log(data);
    h.syncGrid(data.gameMatrix);
  });

  $(document).on("click", ".grid", function () {
    var [X, Y] = h.getCoords($(this).index());
    console.log(grid[X][Y][1], X, Y);

    if (grid[X][Y][1] !== userID && grid[X][Y][1] !== -1) {
      return;
    }

    console.log(X, Y, myTurn);

    if (myTurn) {
      h.updateGrid(X, Y, userID);
      socket.emit("gameInfo", {
        userID: userID,
        userClick: { X: X, Y: Y },
        room: room,
      });
      myTurn = false;
    }

    // numberOfTurns++;

    // if (numberOfTurns > 2 && (cnt1 == 0 || cnt2 == 0)) {
    //   if (cnt1 > 0) alert("Green Won!");
    //   else alert("Red Won!");
    // }
  });

  socket.on("isTurn", (data) => {
    console.log("number of turns is", data.numberOfTurns);

    if (data.userTurn === userID) {
      console.log("your turn, click something");
      myTurn = true;
    } else {
      console.log("Turn is of ", data.userTurn);
      myTurn = false;
    }
  });

  socket.on("gameInfo", (data) => {
    playerClick = data.playerClick;
    playerID = data.playerID;
    h.updateGrid(playerClick.X, playerClick.Y, playerID);
  });

  // $(".newGrid").click(function () {
  //   h.refreshGrid();

  //   $(".grid").click(function () {
  //     console.log(chance, $(this).css("color"));
  //     var [X, Y] = h.getCoords($(this).index());

  //     if (chance && grid[X][Y][1] == 2) return;
  //     else if (!chance && grid[X][Y][1] == 1) return;

  //     numberOfTurns++;
  //     h.updateGrid(X, Y);

  //     if (numberOfTurns > 2 && (cnt1 == 0 || cnt2 == 0)) {
  //       if (cnt1 > 0) alert("Green Won!");
  //       else alert("Red Won!");
  //     }
  //   });
  // });

  socket.on("playerLeft", (data) => {
    console.log(data);
    h.removePlayer(data.id);
  });
});
