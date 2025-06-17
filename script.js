const grid = document.getElementById("gameBoard");

// Helper function to get a random rotation (0, 90, 180, or 270)
function getRandomRotation() {
  // Math.floor(Math.random() * 4) gives 0, 1, 2, or 3
  return Math.floor(Math.random() * 4) * 90;
}

// Update layout: 4 columns and 6 rows to match the grid in styles.css
const layout = [
  [
    "empty",
    { type: "pipe-l", rotation: getRandomRotation() },
    "empty",
    "empty"
  ],
  [
    "empty",
    { type: "pipe-t", rotation: getRandomRotation() },
    "empty",
    "wall"
  ],
  [
    "empty",
    "empty",
    { type: "pipe-i", rotation: getRandomRotation() },
    "empty"
  ],
  [
    { type: "well", rotation: 0 },
    "wall",
    { type: "pipe-l", rotation: getRandomRotation() },
    "empty"
  ],
  [
    "wall",
    "village",
    "village",
    { type: "pipe-t", rotation: getRandomRotation() }
  ],
  [
    "empty",
    "empty",
    "empty",
    "empty"
  ]
];

let draggedTileIndex = null;
let ghostTile = null;

function createTile(tileData, rowIdx, colIdx) {
  // If tileData is an object, get type and rotation; else, treat as string
  let type, rotation;
  if (typeof tileData === "object" && tileData !== null) {
    type = tileData.type;
    rotation = tileData.rotation || 0;
  } else {
    type = tileData;
    rotation = 0;
  }

  const tile = document.createElement("div");
  tile.classList.add("tile");

  // Check if the tile is moveable (not well, wall, or village)
  const isMoveable = !(type === "well" || type === "wall" || type === "village");

  // Set draggable to true only for moveable tiles
  tile.draggable = isMoveable;

  // Store the tile's position in the grid as a data attribute
  tile.dataset.row = rowIdx;
  tile.dataset.col = colIdx;
  tile.dataset.type = type;
  tile.dataset.rotation = rotation;
  tile.style.transform = `rotate(${rotation}deg)`;
  // Only add drag and drop events for moveable tiles
  if (isMoveable) {
    // Drag start event: remember which tile is being dragged
    tile.addEventListener("dragstart", (event) => {
      // Save the index of the dragged tile
      draggedTileIndex = { row: rowIdx, col: colIdx };
      // Optional: add a style to show it's being dragged
      tile.style.opacity = "0";

      // Create a ghost tile for visual feedback
      ghostTile = tile.cloneNode(true);
      ghostTile.style.position = "fixed";
      ghostTile.style.pointerEvents = "none";
      ghostTile.style.opacity = "1";
      ghostTile.style.zIndex = "1000";
      ghostTile.style.left = `${event.clientX - 30}px`;
      ghostTile.style.top = `${event.clientY - 30}px`;
      document.body.appendChild(ghostTile);

      // Listen for mousemove to move the ghost tile
      document.addEventListener("dragover", moveGhostTile);
    });

    // Drag end event: reset the style and remove ghost tile
    tile.addEventListener("dragend", () => {
      tile.style.opacity = "";
      if (ghostTile) {
        document.body.removeChild(ghostTile);
        ghostTile = null;
      }
      document.removeEventListener("dragover", moveGhostTile);
    });
  }

  // All tiles can be drop targets, so allow dragover and drop
  tile.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  tile.addEventListener("drop", (event) => {
    event.preventDefault();
    // Get the position of the tile being dropped onto
    const targetRow = rowIdx;
    const targetCol = colIdx;
    // Only swap if the dragged tile is different from the target tile
    // and both tiles are moveable
    if (
      draggedTileIndex &&
      (draggedTileIndex.row !== targetRow || draggedTileIndex.col !== targetCol)
    ) {
      const draggedTile = layout[draggedTileIndex.row][draggedTileIndex.col];
      const targetTile = layout[targetRow][targetCol];

      // Get types for moveable check
      const draggedType = typeof draggedTile === "object" ? draggedTile.type : draggedTile;
      const targetType = typeof targetTile === "object" ? targetTile.type : targetTile;

      // Only allow swapping if both are moveable
      const draggedIsMoveable = !(draggedType === "well" || draggedType === "wall" || draggedType === "village");
      const targetIsMoveable = !(targetType === "well" || targetType === "wall" || targetType === "village");
      if (draggedIsMoveable && targetIsMoveable) {
        // Swap the tiles in the layout array
        const temp = layout[targetRow][targetCol];
        layout[targetRow][targetCol] = layout[draggedTileIndex.row][draggedTileIndex.col];
        layout[draggedTileIndex.row][draggedTileIndex.col] = temp;
        // Re-render the grid to show the swap
        grid.innerHTML = "";
        renderGrid();
      }
    }
    // Reset the dragged tile index
    draggedTileIndex = null;
  });

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
    case "pipe-t":
    case "pipe-i":
      tile.classList.add("pipe");

      // Always use the actual rotation from the layout object
      tile.style.transform = `rotate(${rotation}deg)`;

      // Add click event to rotate the pipe 90 degrees each time
      tile.addEventListener("click", () => {
        // Get the current rotation from the layout object
        let currentTile = layout[rowIdx][colIdx];
        if (typeof currentTile !== "object") return;
        currentTile.rotation += 90;
        // Store on dataset
        tile.dataset.rotation = currentTile.rotation;
        // Apply only the visible rotation (prevents reverse spinning)
        tile.style.transform = `rotate(${currentTile.rotation}deg)`;

        console.log(`Tile at (${rowIdx}, ${colIdx}) rotated to ${currentTile.rotation} degrees`);

        updateWaterFlow();
      });

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 100 100");
      // Make SVG fill the tile, so it resizes with the tile
      svg.style.width = "100%";
      svg.style.height = "100%";

      // Draw an L-shaped pipe for "pipe-l"
      if (type === "pipe-l") {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M100 50 Q50 50 50 100");
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "36");
        path.setAttribute("fill", "none");
        svg.appendChild(path);
      }

      // Draw a T-shaped pipe for "pipe-t"
      if (type === "pipe-t") {
        const path1 = document.createElementNS(svgNS, "path");
        path1.setAttribute("d", "M0 50 H50");
        path1.setAttribute("stroke", "currentColor");
        path1.setAttribute("stroke-width", "36");
        path1.setAttribute("fill", "none");

        const path2 = document.createElementNS(svgNS, "path");
        path2.setAttribute("d", "M50 0 V100");
        path2.setAttribute("stroke", "currentColor");
        path2.setAttribute("stroke-width", "36");
        path2.setAttribute("fill", "none");

        svg.appendChild(path1);
        svg.appendChild(path2);
      }

      // Draw a straight pipe for "pipe-i"
      if (type === "pipe-i") {
        const path2 = document.createElementNS(svgNS, "path");
        path2.setAttribute("d", "M50 0 V100");
        path2.setAttribute("stroke", "currentColor");
        path2.setAttribute("stroke-width", "36");
        path2.setAttribute("fill", "none");
        svg.appendChild(path2);
      }

      tile.appendChild(svg);
      break;
      default:
        // empty
        break;
    }
  }

  return tile;
}

// Helper function to move the ghost tile with the cursor
function moveGhostTile(event) {
  if (ghostTile) {
    // Offset so the cursor is in the middle of the tile
    ghostTile.style.left = `${event.clientX - 30}px`;
    ghostTile.style.top = `${event.clientY - 30}px`;
  }
}

// Helper function to check if the screen is large (matches CSS media query)
function isLargeScreen() {
  // 700px matches the CSS media query
  return window.matchMedia("(min-width: 700px)").matches;
}

// Helper to get the current layout, rotating 90deg CCW if large screen
// This function returns the layout rotated 90 degrees counterclockwise if on a large screen.
// Otherwise, it returns the original layout.
function getResponsiveLayout() {
  if (isLargeScreen()) {
    const numRows = layout.length;
    const numCols = layout[0].length;
    const rotated = [];
    for (let col = 0; col < numCols; col++) {
      rotated[col] = [];
      for (let row = 0; row < numRows; row++) {
        // Just copy the reference, do not create a new object
        rotated[col][row] = layout[row][numCols - 1 - col];
      }
    }
    return rotated;
  } else {
    return layout;
  }
}

// This function draws the grid on the page based on the current layout and screen size
function renderGrid() {
  // Clear the grid before rendering
  grid.innerHTML = "";
  const currentLayout = getResponsiveLayout();
  const numCols = layout[0].length;
  // Loop through each row and column in the current layout
  currentLayout.forEach((row, rowIdx) => {
    row.forEach((tileData, colIdx) => {
      // Map the displayed tile back to the original layout indices for events
      let origRow = rowIdx;
      let origCol = colIdx;
      if (isLargeScreen()) {
        // Reverse the mapping for rotated layout
        origRow = colIdx;
        origCol = numCols - 1 - rowIdx;
      }
      // Create the tile and add it to the grid
      const tile = createTile(tileData, origRow, origCol);
      grid.appendChild(tile);
    });
  });
}

// Track the last screen size (true = large, false = small)
let wasLargeScreen = isLargeScreen();

// This function updates pipe rotations when screen size changes
function updatePipeRotationsForScreenChange(isNowLarge) {
  for (let row = 0; row < layout.length; row++) {
    for (let col = 0; col < layout[row].length; col++) {
      const tile = layout[row][col];
      // Only update if it's a pipe object
      if (typeof tile === "object" && tile !== null) {
        if (
          tile.type === "pipe-l" ||
          tile.type === "pipe-t" ||
          tile.type === "pipe-i"
        ) {
          // Subtract 90 if going to large, add 90 if going to small
          tile.rotation = isNowLarge
            ? tile.rotation - 90
            : tile.rotation + 90;
        }
      }
    }
  }
}

// Listen for window resize to re-render the grid responsively
window.addEventListener("resize", () => {
  const isNowLarge = isLargeScreen();
  if (isNowLarge !== wasLargeScreen) {
    // Only update rotations if the screen size changed
    updatePipeRotationsForScreenChange(isNowLarge);
    wasLargeScreen = isNowLarge;
  }
  renderGrid();
});

renderGrid();


function getConnections(tile) {
  const type = tile.type;
  const rotation = tile.rotation % 360;

  switch (type) {
    case "pipe-l":
      switch (rotation) {
        case 0: return ["down", "right"];
        case 90: return ["left", "down"];
        case 180: return ["up", "left"];
        case 270: return ["right", "up"];
      }
      break;

    case "pipe-straight":
      return rotation % 180 === 0 ? ["up", "down"] : ["left", "right"];

    case "pipe-t":
      switch (rotation) {
        case 0: return ["left", "up", "down"];
        case 90: return ["left", "up", "right"];
        case 180: return ["up", "right", "down"];
        case 270: return ["left", "down", "right"];
      }
      break;

    case "well":
      return ["up", "down", "left", "right"]; // Assume well connects on all sides
    case "village":
      return ["up", "down", "left", "right"]; // Assume open on all sides
  }
  return []; // Wall or unknown types
}

