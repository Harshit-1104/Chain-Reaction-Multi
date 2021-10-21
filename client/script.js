// function that builds a grid in the "container"
var myTurn = false;
var grid;
var gridSize = 8;
var numberOfTurns;
var cnt1, cnt2;

var socketId = "";
let room = "ABCD";
let username = "pqrt";
let userID;
let playerClick;
let playerID;

import h from "./helpers.js";
// create a 16x16 grid when the page loads
// creates a hover effect that changes the color of a square to black when the mouse passes over it, leaving a (pixel) trail through the grid
// allows the click of a button to prompt the user to create a new grid

$(document).ready(function () {
  let socket = io("/");
  socket.on("connect", () => {
    //set socketId
    socketId = socket.io.engine.id;
    console.log(socketId);

    socket.emit("subscribe", {
      room: room,
      socketId: socketId,
      username: username,
    });

    socket.on("playerInfo", (data) => {
      userID = data.id;
      console.log(data);
    });
  });

  grid = h.createGrid(gridSize);

  $(".syncMat").click(function () {
    socket.emit("sync_mat", { roomId: room });
  });

  socket.on("sync_mat", (data) => {
    console.log(data);
    h.syncGrid(data.gameMatrix);
  });

  $(".grid").click(function () {
    var [X, Y] = h.getCoords($(this).index());

    if (grid[X][Y][1] !== userID && grid[X][Y][1] !== 0) {
      return;
    }

    console.log(X, Y, myTurn);
    if (myTurn) {
      h.updateGrid(X, Y, userID);
      socket.emit("gameInfo", {
        userID: userID,
        userClick: { X: X, Y: Y },
        roomId: room,
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
});
