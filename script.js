const grid = document.getElementById("gameBoard");

const layout = [
  ["empty", "pipe-l", "empty", "empty", "empty"],
  ["empty", "pipe-h", "empty", "wall", "wall"],
  ["empty", "empty", "empty", "empty", "empty"],
  ["well", "wall", "pipe-l", "empty", "pipe-h"],
  ["wall", "village", "village", "village", "pipe-h"]
];

function createTile(type) {
  const tile = document.createElement("div");
  tile.classList.add("tile");

  // Set white background for well, wall, and village tiles
  if (
    type === "well" ||
    type === "wall" ||
    type === "village"
  ) {
    tile.style.backgroundColor = "#fff";
  }

  // Add SVG images for well, wall, and village tiles
  if (type === "well") {
    // Show well SVG
    const img = document.createElement("img");
    img.src = "img/well.svg";
    img.alt = "Well";
    img.style.width = "45px";
    img.style.height = "45px";
    tile.appendChild(img);
  } else if (type === "wall") {
    // Show wall SVG
    const img = document.createElement("img");
    img.src = "img/wall.svg";
    img.alt = "Wall";
    img.style.width = "45px";
    img.style.height = "45px";
    tile.appendChild(img);
  } else if (type === "village") {
    // Show village SVG
    const img = document.createElement("img");
    img.src = "img/village.svg";
    img.alt = "Village";
    img.style.width = "45px";
    img.style.height = "45px";
    tile.appendChild(img);
    tile.classList.add("village");
  } else {
    switch (type) {
      case "pipe-l":
      case "pipe-h":
        tile.classList.add("pipe");
        tile.textContent = "";
        break;
      default:
        // empty
        break;
    }
  }

  return tile;
}

function renderGrid(layout) {
  layout.forEach(row => {
    row.forEach(type => {
      const tile = createTile(type);
      grid.appendChild(tile);
    });
  });
}

renderGrid(layout);
