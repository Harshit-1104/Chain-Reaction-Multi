var grid;
var gridSize = 8;
var numberOfTurns;

var colors = ["#04AA6D", "#F1705F", "#FF9B6A", "#CF92E1", "#014d6c", "#ffff00"];

export default {
  getOffset( el ) {
    var rect = el[0].getBoundingClientRect();
    var arenaRect = $(".gameArena")[0].getBoundingClientRect();

    return {
      left: rect.left + window.pageXOffset,
      top: rect.top + window.pageYOffset,
      width: rect.width || el.offsetWidth,
      height: rect.height || el.offsetHeight
    };
  },

  connect(div1, div2, id, color, thickness, RT=false, LB=false, update=false) { // for right bottom true both of them
    var off1 = this.getOffset(div1);
    var off2 = this.getOffset(div2);
    // bottom right
    var x1 = off1.left;
    var y1 = off1.top;
    // top right
    var x2 = off2.left;
    var y2 = off2.top;

    if (RT) {
      x1 += off1.width;
      x2 += off2.width;
    }

    if (LB) {
      y1 += off1.height;
      y2 += off2.height;
    }

    var length = Math.sqrt(((x2-x1) * (x2-x1)) + ((y2-y1) * (y2-y1)));
    var cx = ((x1 + x2) / 2) - (length / 2);
    var cy = ((y1 + y2) / 2) - (thickness / 2);
    var angle = Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);

    if (update) {
      var selector = `.lineContainer .${id}`;
      $(selector).css({
        "left": `${cx}px`,
        "top": `${cy}px`,
        "width": `${length}px`,
        "-moz-transform" : "rotate(" + angle + "deg)",
        "-webkit-transform" : "rotate(" + angle + "deg)", 
        "-o-transform" : "rotate(" + angle + "deg)",
        "-ms-transform" : "rotate(" + angle + "deg)",
        "transform" : "rotate(" + angle + "deg)"
      })
    } else {
      var htmlLine = "<div class='" + id + "' style='padding:0px; margin:0px; height:" + thickness + "px; background-color:" + color + "; line-height:1px; position:absolute; left:" + cx + "px; top:" + cy + "px; width:" + length + "px; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg);' />";
      $(".lineContainer").append(htmlLine);
    }
  },

  convertHex(hex, opacity) {
    hex = hex.replace('#','');
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);
    var result = 'rgba('+r+','+g+','+b+','+opacity+')';
    return result;
  },
  
  addPlayer(player) {
    console.log(player);

    $(`.playersList`).append(
      `<div id=${player.id} class="player">
          <div class="playerDP">
            <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="256" x2="256" y1="512" y2="0"><stop offset="0" stop-color="#5558ff"/><stop offset="1" stop-color="#00c0ff"/></linearGradient><linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="256" x2="256" y1="452" y2="91"><stop offset="0" stop-color="#addcff"/><stop offset=".5028" stop-color="#eaf6ff"/><stop offset="1" stop-color="#eaf6ff"/></linearGradient><g><g><g><circle cx="256" cy="256" fill="url(#SVGID_1_)" r="256"/></g></g><g><g><path d="m331 166c0-41.355-33.645-75-75-75s-75 33.645-75 75 33.645 75 75 75 75-33.645 75-75zm-75 75c-74.439 0-135 60.561-135 135v14.058c0 4.264 1.814 8.326 4.99 11.171 36.538 32.74 82.71 50.771 130.01 50.771 47.301 0 93.473-18.031 130.01-50.771 3.176-2.845 4.99-6.908 4.99-11.171v-14.058c0-74.439-60.561-135-135-135z" fill="url(#SVGID_2_)"/></g></g></g></svg>
          </div>
          <div class="playerInfo">
            <h5>${player.username}</h5>
          </div>
          <input type="checkbox" id="status" class="checkbox" disabled/>
        </div>` 
    );
    
    $(`#${player.id}`).css('background', this.convertHex(colors[player.id], 0.5));
  },

  createLobby(users, socketID) {
    console.log("Create Lobby", users);

    for (const [key, value] of Object.entries(users)) {
      $(`.playersList`).append(
        `<div id=${key} class="player">
          <div class="playerDP">
            <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="256" x2="256" y1="512" y2="0"><stop offset="0" stop-color="#5558ff"/><stop offset="1" stop-color="#00c0ff"/></linearGradient><linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="256" x2="256" y1="452" y2="91"><stop offset="0" stop-color="#addcff"/><stop offset=".5028" stop-color="#eaf6ff"/><stop offset="1" stop-color="#eaf6ff"/></linearGradient><g><g><g><circle cx="256" cy="256" fill="url(#SVGID_1_)" r="256"/></g></g><g><g><path d="m331 166c0-41.355-33.645-75-75-75s-75 33.645-75 75 33.645 75 75 75 75-33.645 75-75zm-75 75c-74.439 0-135 60.561-135 135v14.058c0 4.264 1.814 8.326 4.99 11.171 36.538 32.74 82.71 50.771 130.01 50.771 47.301 0 93.473-18.031 130.01-50.771 3.176-2.845 4.99-6.908 4.99-11.171v-14.058c0-74.439-60.561-135-135-135z" fill="url(#SVGID_2_)"/></g></g></g></svg>
          </div>
          <div class="playerInfo">
            <h5>${value.username}</h5>
          </div>
          <input type="checkbox" id="status" class="checkbox" disabled/>
        </div>`
      );

      $(`#${key}`).css('background', this.convertHex(colors[key], 0.5));
    }
  },

  removePlayer(id) {
    $(`#${id}`).remove();
  },

  announceText(nop, nopA) {
    $(".announceText").html(
      `${nop} player have joined!<br>${nopA} players are ready!`
    )
  },

  gameTimer(duration) {
    return new Promise((resolve) => {
      const timer = setInterval(function () {
        console.log(duration);
  
        if (duration == 0) {
          clearInterval(timer);
          resolve();
        }
  
        $(".announceText").html(`The game will begin in ... ${duration}`);
        duration--;
      }, 1000);
    });
  },

  addMessage(username, msg, time, id, flag) {
    let message;
    message = `
      <div class="message">
        <div class="sender">${username}</div>
        <div class="messageBody">${msg}</div>
        <div class="eta">${time}</div> 
      </div>
    `;

    let bgColor = this.convertHex(colors[id], 0.6);

    $(".messageContainer").append(message);
    $(".messageContainer").children().last().css({
      "background-color": `${bgColor}`
    })

    if (flag) {
      $(".messageContainer").children().last().addClass("flag");
    }
  },

  createGrid(x) {
    x = parseInt(x);
    grid = this.initializeGrid(x, x);
    var cnt = 0;

    for (var rows = 0; rows < x; rows++) {
      for (var columns = 0; columns < x; columns++) {
        $(".gameGrid.front").append(
          `<div class='grid f ${cnt}'></div>`
        );

        $(".gameGrid.back").append(
          `<div class='grid b ${cnt}'></div>`
        );

        cnt++;
      }
    }

    $(".grid").width(500 / x - 0.5);
    $(".grid").height(500 / x - 0.5);
    (numberOfTurns = 0);
    
    cnt = 0;
    let lineId = 0;
    for (var rows = 0; rows < x; rows++) {
      for (var columns = 0; columns < x; columns++) {
        var div1 = `.grid.f.${cnt}`, div2 = `.grid.b.${cnt}`;
        this.connect($(div1), $(div2), lineId, "white", 1);
        
        if (columns == x-1) {
          lineId++;
          this.connect($(div1), $(div2), lineId, "white", 1, true, false);
        }
        
        if (rows == x-1) {
          lineId++;
          this.connect($(div1), $(div2), lineId, "white", 1, false, true);
        }

        if (columns == x-1 && rows == x-1) {
          lineId++;
          this.connect($(div1), $(div2), lineId, "white", 1, true, true);
        }

        cnt++;
        lineId++;
      }
    }

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
        idx = this.getIdx(rows+1, columns+1);
        ele = $(".grid.f").eq(idx);

        // ele.html(
        //   `${grid[rows + 1][columns + 1][0]}<sub class='sub'>(${rows + 1}, ${
        //     columns + 1
        //   })</sub>`
        // );

        if (grid[rows + 1][columns + 1][0] === 1) {
          ele.html(this.renderOne(colors[grid[rows + 1][columns + 1][1]]));
        } else if (grid[rows + 1][columns + 1][0] === 2) {
          ele.html(this.renderTwo(colors[grid[rows + 1][columns + 1][1]]));
        } else if (grid[rows + 1][columns + 1][0] === 3) {
          ele.html(this.renderThree(colors[grid[rows + 1][columns + 1][1]]));
        } else {
          ele.html("");
        }

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

  async updateGrid(X, Y, userID, nop) {
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
      var ele = $(".grid.f").eq(idx);

      console.log(curr, idx, ele.html()[0], lim);

      if (grid[curr[0]][curr[1]][0] < lim) {
        grid[curr[0]][curr[1]][0] += 1;
        ele.css("color", colors[userID]);
        grid[curr[0]][curr[1]][1] = userID;

        if (grid[curr[0]][curr[1]][0] === 1) {
          ele.append(this.renderOne(colors[grid[curr[0]][curr[1]][1]]));
        } else if (grid[curr[0]][curr[1]][0] === 2) {
          ele
            .children(".ball")[0]
            .replaceWith(
              $.parseHTML(this.renderTwo(colors[grid[curr[0]][curr[1]][1]]))[0]
            );
        } else if (grid[curr[0]][curr[1]][0] === 3) {
          ele
            .children(".ball")[0]
            .replaceWith(
              $.parseHTML(
                this.renderThree(colors[grid[curr[0]][curr[1]][1]])
              )[0]
            );
        } else {
          ele.children(".ball")[0].replaceWith("");
        }
      } else {
        // perform animation here
        ele.append(this.animate(colors[grid[curr[0]][curr[1]][1]]));
        ele.children(".ball")[0].replaceWith("");

        // remove the elements after animation finishes
        $(".rm").bind(
          "animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd",
          function (e) {
            $(this).remove();
          }
        );

        // await this.sleep(150);

        grid[curr[0]][curr[1]][0] = 0;
        grid[curr[0]][curr[1]][1] = -1; // default

        ele.css("color", "#0000ff");

        queue.push([curr[0] + 1, curr[1]]);
        queue.push([curr[0] - 1, curr[1]]);
        queue.push([curr[0], curr[1] + 1]);
        queue.push([curr[0], curr[1] - 1]);
      }
    }

    $(`#${userID % nop}`).removeClass("chance");
    $(`#${(userID+1) % nop}`).addClass("chance");
  },

  renderOne(color) {
    return `<div class="ldng rotateSphere ball" style="background-color: ${color}"></div>`;
  },

  renderTwo(color) {
    return `<div class="div2b ball">
      <div class="ldng rotateSphere" style="background-color: ${color}"></div>
      <div class="ldng rotateSphere overlapHorizontal" style="background-color: ${color}"></div>
    </div>`;
  },

  renderThree(color) {
    return `<div class="div3b rotating-box ball">
      <div class="div2b">
        <div class="ldng rotateSphere" style="background-color: ${color}"></div>
        <div class="ldng rotateSphere overlapHorizontal" style="background-color: ${color}"></div>
      </div>
      <div class="ldng red rotateSphere overlapVertical" style="background-color: ${color}"></div>
    </div>`;
  },

  animate(color) {
    return `<div class="ldng rotateSphere rt-up rm" style="position: absolute;background-color: ${color}"></div>
    <div class="ldng rotateSphere rt-down rm" style="position: absolute;background-color: ${color}"></div>
    <div class="ldng rotateSphere rt-left rm" style="position: absolute;background-color: ${color}"></div>
    <div class="ldng rotateSphere rt-right rm" style="position: absolute;background-color: ${color}"></div>`;
  },

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
