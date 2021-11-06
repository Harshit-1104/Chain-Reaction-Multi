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
var readyStatus = false;
var gameStarted = false;
var nop = 0,
  nopA = 0;

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
    console.log(Object.keys(data.d.users).length);
    nop += Object.keys(data.d.users).length;

    h.createLobby(data.d.users, userID);

    for (const [key, value] of Object.entries(data.d.users)) {
      if (value.readyStatus) {
        nopA++;
        $(`#${value.id} #status`)[0].checked = true;
      }
    }

    h.announceText(nop, nopA);
  });

  socket.on("newPlayerInfo", (data) => {
    if (data.isPlayer) {
      nop++;
      h.addPlayer(data);
      h.announceText(nop, nopA);
    }

    socket.on("cnt", (data) => {
      console.log("cnt", data);
    });
  });

  socket.on("removeLoser", (data) => {
    console.log("lost", data);
  });

  $(document).on("click", "#isReady", function () {
    console.log("clicked");
    readyStatus = !readyStatus;
    console.log(readyStatus);

    if (readyStatus) {
      $(this).addClass("active");
      $(this).removeClass("nactive");
      $("#isReady span").html("Ready!");
    } else {
      $(this).removeClass("active");
      $(this).addClass("nactive");
      $("#isReady span").html("Click when ready :)");
    }

    socket.emit("playerStatus", {
      room: room,
      socketID: socketID,
      status: readyStatus,
      userID: userID,
    });
  });

  socket.on("playerStatus", (data) => {
    console.log(data);

    if (data.status) {
      nopA++;
      $(`#${data.id} #status`)[0].checked = true;
    } else {
      nopA--;
      $(`#${data.id} #status`)[0].checked = false;
    }

    h.announceText(nop, nopA);
  });

  socket.on("gameStart", async (data) => {
    console.log("Participants : ", data.users);
    $(".gameGrid").css("filter", "");

    console.log("Timer start");
    await h.gameTimer(3);
    $(".preGame").remove();

    $(".gameArena").append("<div class='gameGrid'></div>");

    document.getElementsByClassName("gameGrid")[0].classList.add("front");
    document.getElementsByClassName("gameGrid")[1].classList.add("back");

    grid = h.createGrid(gridSize);
    gameStarted = true;

    $("#0").addClass("chance");
  });

  $(".syncMat").click(function () {
    socket.emit("sync_mat", { room: room });
  });

  socket.on("sync_mat", (data) => {
    console.log(data);
    h.syncGrid(data.gameMatrix);
  });

  $(document).on("click", ".grid", function () {
    if (!gameStarted) return;

    var [X, Y] = h.getCoords($(this).index());
    console.log(grid[X][Y][1], X, Y);

    if (grid[X][Y][1] !== userID && grid[X][Y][1] !== -1) {
      return;
    }

    console.log(X, Y, myTurn);

    if (myTurn) {
      h.updateGrid(X, Y, userID, nop);
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
    h.updateGrid(playerClick.X, playerClick.Y, playerID, nop);
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
    nop--;

    if ($(`#${data.id} #status`)[0].checked) nopA--;

    h.removePlayer(data.id);
    h.announceText(nop, nopA);
  });

  $(".send").click(function () {
    let msg = $(".toSend").val();
    console.log(msg);

    if (msg.length == 0) return;

    $(".toSend").val("");

    var now = new Date();
    var dispTime = `${now.getHours()}:${now.getMinutes()}`;
    console.log(dispTime);

    socket.emit("messageSent", {
      room: room,
      userID: userID,
      msg: msg,
      time: dispTime,
      username: username,
    });
  });

  socket.on("messageRecieved", (data) => {
    h.addMessage(
      data.username,
      data.msg,
      data.time,
      data.userID,
      data.userID == userID
    );
  });
});

window.addEventListener(
  "resize",
  function (event) {
    console.log("Resized");
    if (!gameStarted) return;

    var cnt = 0,
      lineId = 0;
    for (var rows = 0; rows < gridSize; rows++) {
      for (var columns = 0; columns < gridSize; columns++) {
        var div1 = `.grid.f.${cnt}`,
          div2 = `.grid.b.${cnt}`;
        h.connect($(div1), $(div2), lineId, "white", 1, false, false, true);

        if (columns == gridSize - 1) {
          lineId++;
          h.connect($(div1), $(div2), lineId, "white", 1, true, false, true);
        }

        if (rows == gridSize - 1) {
          lineId++;
          h.connect($(div1), $(div2), lineId, "white", 1, false, true, true);
        }

        if (columns == gridSize - 1 && rows == gridSize - 1) {
          lineId++;
          h.connect($(div1), $(div2), lineId, "white", 1, true, true, true);
        }

        cnt++;
        lineId++;
      }
    }
  },
  true
);
