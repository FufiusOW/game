const nx = 32
const ny = 32
var themap
var paths
const MAP_GRASS = 1
const MAP_RIVER = 2
const MAP_MOUNTAINS = 3
const MAP_PATHS = 4
const pathlength = 40
function setup() {
  createCanvas(400, 400)
  themap = generatemap()
}
function draw() {
  background("green")
  drawmap()
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
    if ((cy == ny-1) && (path.length >= pathlength)) {
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
  let scale = width / nx
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      if (themap[i][j] == MAP_PATHS) {
        fill("brown")
      }
      if (themap[i][j] == MAP_GRASS) {
        fill("green")
      }
      rect(i * scale, j * scale, scale, scale)
    }
  }
}