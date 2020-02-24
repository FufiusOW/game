/*
"game" - based off bloons tower defense.
Balloons move along a path and you have to build towers to shoot them down before they reach the end of the path.

## Data structures

__var themap__
Keeps track of which terrain type is at each map location.
It is a 2D array, indexed like themap[x][y]
and each element is a terrain type, like MAP_GRASS or MAP_PATHS.

__var paths__
Stores the path locations in a sequence from start to end.
It is an array of map coordinates, like [x,y].

__var towers__
Keeps track of tower placements and types.
It is an array. Each element is an object with keys
 - at: [x,y] referring to the top-left corner of the tower.
 - size: [w,h] in grid squares.
 - type: a tower type, like TOWER_BASIC

__var tower_info__
Stores details about the different tower types.
It is an array indexed by tower type, e.g. tower_info[TOWER_BASIC].
Each element is an object with these required keys:
- range: firing range (radius) in grid squares.
And these optional keys:
- width: number of horizonal grid squares the tower takes up.
- height: number of vertical grid squares the tower takes up.
*/

const nx = 32
const ny = 32
var themap
var paths
const MAP_GRASS = 1
const MAP_RIVER = 2
const MAP_MOUNTAINS = 3
const MAP_PATHS = 4
const pathlength = 40
var towers
const TOWER_BASIC = 1
const TOWER_LONGRANGE = 2
const tower_info = [
  {},
  { range: 6 },
  { range: 10 }]
var money = 0
var turn = 1
var TB_Button
var ui_mode = null // can be = TOWER_BASIC, or null for default

// user interface: see ui-mockup.png
// building controls are along the bottom.
// go button is in the bottom right corner.
// status displays are along the right side.
const pad = { l: 20, r: 120, t: 20, b: 120 }
var board_width, board_height, scale

// converts a map x-coordinate (between 0 and nx-1) to a pixel location on the canvas 
function mapXToCanvas(x_coord) {
  return pad.l + x_coord * scale
}

// converts a map y-coordinate (between 0 and ny-1) to a pixel location on the canvas
function mapYToCanvas(y_coord) {
  return pad.t + y_coord * scale
}

// converts a pixel location on the canvas to a map x coordinate (0 to nx-1)
function canvasXToMap(x_pixels) {
  let i = floor((x_pixels - pad.l) / scale)
  if ((i >= 0) && (i < nx)) {
    return i
  } else {
    return null
  }
}

function canvasYToMap(y_pixels) {
  let j = floor((y_pixels - pad.t) / scale)
  if ((j >= 0) && (j < ny)) {
    return j
  } else {
    return null
  }
}

function setup() {
  createCanvas(600, 600)
  ellipseMode(RADIUS)
  board_width = width - pad.l - pad.r
  board_height = height - pad.t - pad.b
  scale = board_width / nx
  TB_Button = {
    x: pad.l,
    y: height - pad.b + 20,
    width: 100,
    height: pad.b - 40,
    label: "Basic Tower",
    ui_mode: TOWER_BASIC
  }
  themap = generatemap()
  towers = []
}

function draw() {
  background("black")
  drawmap()
  // draw existing towers
  for (let tower of towers) {
    let xi = tower.at[0]
    let yi = tower.at[1]
    let x_px = mapXToCanvas(xi)
    let y_px = mapYToCanvas(yi)
    fill("grey")
    rect(x_px, y_px, scale, scale)
  }
  // preview tower placement
  // work out the map coordinates of where the mouse is
  let xi = canvasXToMap(mouseX)
  let yi = canvasYToMap(mouseY)
  if (ui_mode == TOWER_BASIC) {
    if (valid_build(xi, yi, TOWER_BASIC) == true) {
      let x_px = mapXToCanvas(xi)
      let y_px = mapYToCanvas(yi)
      fill("black")
      rect(x_px, y_px, scale, scale)
      // draw tower range as translucent
      let col = color("black")
      col.setAlpha(50)
      fill(col)
      x_px = mapXToCanvas(xi + 0.5)
      y_px = mapYToCanvas(yi + 0.5)
      let r = tower_info[TOWER_BASIC].range
      ellipse(x_px, y_px, r * scale, r * scale)
    }
  }
  // user interface
  let b = TB_Button // eventually we will be looping over several buttons b
  if (ui_mode == b.ui_mode) { fill("yellow") } else { fill("white") }
  stroke("black")
  rect(b.x, b.y, b.width, b.height)
  textAlign(CENTER, CENTER)
  fill("black")
  text(b.label, b.x + b.width / 2, b.y + b.height / 2)
}

function mouseClicked() {
  let b = TB_Button
  if ((b.x < mouseX) && (mouseX < b.x + b.width) &&
    (b.y < mouseY) && (mouseY < b.y + b.height)) {
    // toggle button
    if (ui_mode == b.ui_mode) {
      ui_mode = null
    } else {
      ui_mode = b.ui_mode
    }
  }
  // place a tower
  if (ui_mode != null) {
    let xi = canvasXToMap(mouseX)
    let yi = canvasYToMap(mouseY)
    if (valid_build(xi, yi, ui_mode) == true) {
      let tower = {
        at: [xi, yi],
        type: ui_mode
      }
      towers.push(tower) // we need to colour it, yes? in draw().
      
    }
  }
}

function valid_build(xi, yi, tower_type) {
  if ((xi == null) || (yi == null)) return false
  // check terrain
  if (themap[xi][yi] == MAP_PATHS) return false
  // for other towers we need to make sure they can build on the different terrains but we don't have those generating yet
  // right. will need more arguments to this function.
  return true
}

function adj_spaces(cx, cy, downonly) {
  opts = []
  if (cx > 0) { opts.push([cx - 1, cy]) }
  if (!downonly && (cy > 0)) { opts.push([cx, cy - 1]) }
  if (cx < nx - 1) { opts.push([cx + 1, cy]) }
  if (cy < ny - 1) { opts.push([cx, cy + 1]) }
  return opts
}

function generatemap() {
  let m = []
  for (let i = 0; i < nx; i++) {
    m[i] = []
    for (let j = 0; j < ny; j++) {
      m[i][j] = MAP_GRASS
    }
  }
  let cx = floor(random(nx))
  let cy = 0
  let path = []
  while (true) {
    console.log([cx, cy])
    path.push([cx, cy])
    m[cx][cy] = MAP_PATHS
    // check if path should end
    if ((cy == ny - 1) && (path.length >= pathlength)) {
      break
    }
    // pick the next tile
    let poss_opts = adj_spaces(cx, cy, true)
    let opts = []
    for (let opt of poss_opts) {
      let ox = opt[0];
      let oy = opt[1];
      let adjs = adj_spaces(ox, oy, false)
      let n_paths = 0
      for (let a of adjs) {
        if (m[a[0]][a[1]] == MAP_PATHS) { n_paths++ }
      }
      if (n_paths == 1) {
        opts.push(opt);
      }
    }
    let n = random(opts)
    cx = n[0]
    cy = n[1]
  }
  return m
}

function drawmap() {
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      if (themap[i][j] == MAP_PATHS) {
        fill("#F4A460")
      }
      if (themap[i][j] == MAP_GRASS) {
        fill("green")
      }
      let x = mapXToCanvas(i)
      let y = mapYToCanvas(j)
      rect(x, y, scale, scale)
    }
  }
}
