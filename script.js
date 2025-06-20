window.levelComplete = false;

const grid = document.getElementById("gameBoard");

// Helper function to get a random rotation (0, 90, 180, or 270)
function getRandomRotation() {
  // Math.floor(Math.random() * 4) gives 0, 1, 2, or 3
  return Math.floor(Math.random() * 4) * 90;
}

let completedLevels = [];
let currentLevel = 0;

const levels = [
  // Level 1
  [
  ["empty", "empty", {type: "well"}, "empty"],
  [{ type: "pipe-l", rotation: getRandomRotation()}, "empty", "wall", "empty"],
  [{ type: "pipe-i", rotation: getRandomRotation() }, { type: "pipe-i", rotation: getRandomRotation() }, { type: "pipe-l", rotation: getRandomRotation() }, "wall"],
  ["empty", "wall", "empty", "empty"],
  [{ type: "pipe-l", rotation: getRandomRotation() }, { type: "pipe-l", rotation: getRandomRotation() }, { type: "pipe-i", rotation: getRandomRotation() }, "empty"],
  ["empty", { type: "village"}, "empty", "empty"],
  ],
  // Level 2
  [
  ["empty", { type: "pipe-l", rotation: getRandomRotation() }, "empty", "empty"],
  ["wall", "empty", { type: "village" }, "wall"],
  [{ type: "pipe-l", rotation: getRandomRotation() }, { type: "pipe-i", rotation: getRandomRotation() }, { type: "pipe-l", rotation: getRandomRotation() }, "empty"],
  [{ type: "well"}, "wall", { type: "pipe-i", rotation: getRandomRotation() }, "empty"],
  ["wall", "empty", "empty", { type: "pipe-t", rotation: getRandomRotation() }],
  ["empty", { type: "village" }, "empty", "empty"]
  ],
  // L
];

let layout = JSON.parse(JSON.stringify(levels[currentLevel]));
layout = adjustLayoutForScreenSize(layout);

function createLevelButtons() {
  const container = document.getElementById("level-buttons");
  container.innerHTML = ""; // clear old buttons if any

  for (let i = 0; i < levels.length; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i + 1}`;
    btn.classList.add("level-btn");
    if (completedLevels.includes(i)) {
      btn.classList.add("completed");
    }

    btn.addEventListener("click", () => {
      loadLevel(i);
      hideOverlays(); // optional, if using a popup
      window.levelComplete = false; // reset level complete state
    });

    container.appendChild(btn);
  }
}


// --- DRAG AND DROP VARIABLES ---

let draggedTileIndex = null;
let ghostTile = null;

// --- TILE CREATION AND EVENT HANDLING ---

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
        // Save dragged-from position before grid rerender
        const fromRow = draggedTileIndex.row;
        const fromCol = draggedTileIndex.col;

        // Swap the tiles in the layout array
        const temp = layout[targetRow][targetCol];
        layout[targetRow][targetCol] = layout[fromRow][fromCol];
        layout[fromRow][fromCol] = temp;
        // Re-render the grid to show the swap
        grid.innerHTML = "";
        const tileElements = renderGrid(); // Get new tile elements after rendering
        // Let the browser paint first
        setTimeout(() => {
          updateWaterflow(layout, tileElements);
        }, 30);
        


        // Log the swap for debugging, including clean water status
        setTimeout(() => {
          const swappedTile = layout[targetRow][targetCol];
          const hasCleanWater = typeof swappedTile === "object" && swappedTile.hasCleanWater ? "yes" : "no";
          console.log(`Tile at (${fromRow}, ${fromCol}) swapped to (${targetRow}, ${targetCol}). Has clean water: ${hasCleanWater}`);
        }, 0);
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
  if (type === "well" || type === "wall" || type === "village") {
    const showLabel = (e) => showTileLabel(e, type);

    tile.addEventListener("click", showLabel);
    tile.addEventListener("mousedown", showLabel);
    tile.addEventListener("touchstart", showLabel, { passive: true }); // for mobile
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
    img.classList.add("village-img");
    tile.appendChild(img);

    // Create the happy icon and put it in the bottom left
    const happyImg = document.createElement("img");
    happyImg.src = "img/happy.svg";
    happyImg.alt = "Happy";
    happyImg.classList.add("happy-icon"); 

    // Make sure the tile container is positioned relative so the icon can be placed inside it
    tile.style.position = "relative";
    tile.appendChild(happyImg);

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
        // Apply only the visible rotation (prevents reverse spinning) and ensure transition is respected
        tile.style.transition = "none";
        tile.style.transform = `rotate(${currentTile.rotation - 90}deg)`; // previous state
        tile.offsetHeight; // force reflow
        tile.style.transition = "transform 0.3s ease";
        tile.style.transform = `rotate(${currentTile.rotation}deg)`; // new state

        // After rotation, update water flow and highlight clean tiles
        // We need to get the latest tileElements
        const tileElements = [];
        for (let r = 0; r < layout.length; r++) {
          tileElements[r] = [];
          for (let c = 0; c < layout[r].length; c++) {
            // Find the tile element in the DOM
            tileElements[r][c] = document.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
          }
        }
        updateWaterflow(layout, tileElements);

        // Log the tile position, new rotation, connections, and clean water status for debugging
        // (Moved after updateWaterflow)
        const connections = getConnections(currentTile);
        setTimeout(() => {
          const hasCleanWater = currentTile.hasCleanWater ? "yes" : "no";
          console.log(`Tile at (${rowIdx}, ${colIdx}) rotated to ${currentTile.rotation} degrees`);
          console.log(`Connections: ${JSON.stringify(connections)}`);
          console.log(`Has clean water: ${hasCleanWater}`);
        }, 0);
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

// --- RESPONSIVE LAYOUT HELPERS ---

// Helper function to check if the screen is large (matches CSS media query)
function isLargeScreen() {
  // 700px matches the CSS media query
  return window.matchMedia("(min-width: 700px)").matches;
}

// Helper to rotate the layout array 90 degrees counterclockwise
function rotateLayoutCCW(layout) {
  const numRows = layout.length;
  const numCols = layout[0].length;
  const rotated = [];
  for (let col = 0; col < numCols; col++) {
    rotated[col] = [];
    for (let row = 0; row < numRows; row++) {
      rotated[col][row] = layout[row][numCols - 1 - col];
    }
  }
  return rotated;
}

// Helper to rotate the layout array 90 degrees clockwise
function rotateLayoutCW(layout) {
  const numRows = layout.length;
  const numCols = layout[0].length;
  const rotated = [];
  for (let col = 0; col < numCols; col++) {
    rotated[col] = [];
    for (let row = 0; row < numRows; row++) {
      rotated[col][row] = layout[numRows - 1 - row][col];
    }
  }
  return rotated;
}

// Replace the contents of layout with newLayout (in-place)
function replaceLayout(newLayout) {
  layout.length = 0;
  for (let i = 0; i < newLayout.length; i++) {
    layout.push(newLayout[i]);
  }
}

function adjustLayoutForScreenSize(layout) {
  if (isLargeScreen()) {
    // Rotate layout 90° CCW and adjust pipe rotations
    const rotated = rotateLayoutCCW(layout);
    for (let row = 0; row < rotated.length; row++) {
      for (let col = 0; col < rotated[row].length; col++) {
        const tile = rotated[row][col];
        if (typeof tile === "object" && tile !== null) {
          if (
            tile.type === "pipe-l" ||
            tile.type === "pipe-t" ||
            tile.type === "pipe-i"
          ) {
            tile.rotation = (tile.rotation - 90 + 360) % 360;
          }
        }
      }
    }
    return rotated;
  }
  return layout; // No change for small screens
}


let tooltipTimeoutId = null;

function showTileLabel(event, label) {
  const tooltip = document.getElementById("tile-label");
  tooltip.textContent = label[0].toUpperCase() + label.slice(1); // Capitalize

  // Position at bottom center of tile
  const rect = event.target.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  tooltip.style.top = `${rect.bottom + window.scrollY + 4}px`;
  tooltip.style.transform = "translateX(-50%)";

  tooltip.classList.remove("hidden");
  tooltip.classList.add("show");

  // Clear previous timer if running
  if (tooltipTimeoutId) clearTimeout(tooltipTimeoutId);

  // Set a new consistent timer
  tooltipTimeoutId = setTimeout(() => {
    tooltip.classList.remove("show");
    tooltip.classList.add("hidden");
    tooltipTimeoutId = null;
  }, 1500); // Show for 1.5 seconds
}


// --- GRID RENDERING ---

// This function draws the grid on the page based on the current layout and screen size
function renderGrid() {
  // Clear the grid before rendering
  grid.innerHTML = "";
  // Always use the current layout (already rotated if needed)
  const numCols = layout[0].length;
  // Create a 2D array to store tile DOM elements
  const tileElements = [];
  // Loop through each row and column in the layout
  layout.forEach((row, rowIdx) => {
    tileElements[rowIdx] = [];
    row.forEach((tileData, colIdx) => {
      // Use the current indices directly
      const tile = createTile(tileData, rowIdx, colIdx);
      grid.appendChild(tile);
      tileElements[rowIdx][colIdx] = tile;
    });
  });
  // Always update water flow after rendering the grid
  setTimeout(() => {
    updateWaterflow(layout, tileElements);
  }, 20);
  return tileElements; // Return tileElements so we can use it elsewhere
}

// Track the last screen size (true = large, false = small)
let wasLargeScreen = isLargeScreen();

// This function updates pipe rotations and layout when screen size changes
function updateLayoutForScreenChange(isNowLarge) {
  // Rotate the layout array and adjust pipe rotations
  if (isNowLarge) {
    // Rotate layout 90deg CCW and subtract 90deg from each pipe
    const rotated = rotateLayoutCCW(layout);
    for (let row = 0; row < rotated.length; row++) {
      for (let col = 0; col < rotated[row].length; col++) {
        const tile = rotated[row][col];
        if (typeof tile === "object" && tile !== null) {
          if (
            tile.type === "pipe-l" ||
            tile.type === "pipe-t" ||
            tile.type === "pipe-i"
          ) {
            tile.rotation -= 90;
            // Keep rotation between 0-359 for consistency
            if (tile.rotation < 0) tile.rotation += 360;
          }
        }
      }
    }
    replaceLayout(rotated);
  } else {
    // Rotate layout 90deg CW and add 90deg to each pipe
    const rotated = rotateLayoutCW(layout);
    for (let row = 0; row < rotated.length; row++) {
      for (let col = 0; col < rotated[row].length; col++) {
        const tile = rotated[row][col];
        if (typeof tile === "object" && tile !== null) {
          if (
            tile.type === "pipe-l" ||
            tile.type === "pipe-t" ||
            tile.type === "pipe-i"
          ) {
            tile.rotation += 90;
            // Keep rotation between 0-359 for consistency
            if (tile.rotation >= 360) tile.rotation -= 360;
          }
        }
      }
    }
    replaceLayout(rotated);
  }
}

// Listen for window resize to re-render the grid responsively
window.addEventListener("resize", () => {
  const isNowLarge = isLargeScreen();
  if (isNowLarge !== wasLargeScreen) {
    // Only update layout and rotations if the screen size changed
    updateLayoutForScreenChange(isNowLarge);
    wasLargeScreen = isNowLarge;
  }
  const tileElements = renderGrid();
  updateWaterflow(layout, tileElements);
});

// Initial render and waterflow update
updateLevelLabel();
const tileElements = renderGrid();
updateWaterflow(layout, tileElements);


// --- WATER FLOW LOGIC ---

// Main water flow update function
function updateWaterflow(layout, tileElements) {
  const numRows = layout.length;
  const numCols = layout[0].length;

  // Step 1: Clear previous water state
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const tile = layout[row][col];
      if (typeof tile === "object") {
        tile.hasCleanWater = false;
        tileElements[row][col].classList.remove("clean");

        // Hide happy icons
        if (tile.type === "village") {
          const icon = tileElements[row][col].querySelector(".happy-icon");
          if (icon) icon.classList.remove("show");
        }

      }
    }
  }

  // Step 2: Flow from wells
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const tile = layout[row][col];
      if (typeof tile === "object" && tile.type === "well") {
        flowFromTile(row, col, layout, tileElements, 0, false);
      }
    }
  }

  // Step 3: Show happy faces for villages with clean water
  let totalVillages = 0;
  let cleanVillages = 0;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const tile = layout[row][col];
      if (typeof tile === "object" && tile.type === "village") {
        totalVillages++;
        if (tile.hasCleanWater) {
          cleanVillages++;
          const happyIcon = tileElements[row][col].querySelector(".happy-icon");
          if (happyIcon) happyIcon.classList.add("show");
        }
      }
    }
  }

  // Step 4: Update tracker display
  const tracker = document.getElementById("village-tracker");
  if (tracker) {
    tracker.textContent = `${cleanVillages} / ${totalVillages} villages have clean water`;
  }
  // Step 5: Check for win condition
  if (!window.levelComplete && cleanVillages === totalVillages && totalVillages > 0) {
    showWinPopup();
  }

}


// Recursive helper for water flow
function flowFromTile(row, col, layout, tileElements, delay=0, useDelay=false) {
  const tile = layout[row][col];
  if (!tile || tile.hasCleanWater) return;

  // Mark as having clean water
  tile.hasCleanWater = true;

  const applyClean = () => {
    tileElements[row][col].classList.add("clean");
  };

  if (useDelay) {
    setTimeout(applyClean, delay);
  } else {
    applyClean();
  }

  const connections = getConnections(tile);
  const directions = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  };
  const opposite = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  const nextDelay = delay + (useDelay ? 100 : 0); // delay increases as we go deeper

  for (let dir of connections) {
    const [dRow, dCol] = directions[dir];
    const newRow = row + dRow;
    const newCol = col + dCol;

    // Stay in bounds
    if (
      newRow >= 0 && newRow < layout.length &&
      newCol >= 0 && newCol < layout[0].length
    ) {
      const neighbor = layout[newRow][newCol];
      if (
        typeof neighbor === "object" &&
        getConnections(neighbor).includes(opposite[dir])) 
        {
          flowFromTile(newRow, newCol, layout, tileElements, nextDelay, useDelay); // Recursive
        }
      }
  }
}

// --- PIPE CONNECTIONS LOGIC ---

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

    case "pipe-i":
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

function showWinPopup() {
  window.levelComplete = true;
  if (!completedLevels.includes(currentLevel)) {
  completedLevels.push(currentLevel);
  }
  createLevelButtons(); // Refresh buttons to reflect updated completion

  // Wait a tiny bit, then show overlay and popup
  setTimeout(() => {
      // Fire confetti (once)
    confetti({
      particleCount: 200,
      spread: 150,
      origin: { y: 0.6 }
    });

    const overlay = document.getElementById("win-overlay");
    const popup = document.getElementById("win-popup");

    overlay.classList.remove("hidden"); // show overlay
    void popup.offsetWidth; // <- this line forces reflow
    popup.classList.add("visible");     // animate popup

    const confettiCanvas = document.querySelector("canvas");
    if (confettiCanvas) {
      confettiCanvas.style.zIndex = "2000";
      confettiCanvas.style.pointerEvents = "none";
      confettiCanvas.style.position = "fixed";
      confettiCanvas.style.top = "0";
      confettiCanvas.style.left = "0";
    }
  }, 200);
}

document.getElementById("next-level-btn").addEventListener("click", () => {
  currentLevel++;
  if (currentLevel < levels.length) {
    layout = JSON.parse(JSON.stringify(levels[currentLevel]));
    layout = adjustLayoutForScreenSize(layout);
    grid.innerHTML = "";
    window.levelComplete = false;
    updateLevelLabel(); // Update the level label
    const tileElements = renderGrid();
    updateWaterflow(layout, tileElements);
    const overlay = document.getElementById("win-overlay");
    const popup = document.getElementById("win-popup");
    popup.classList.remove("visible"); // fade out
    overlay.classList.add("hidden");   // hide overlay
  } else {
    // No more levels — show final message
    alert("You've brought clean water to every village!");
  }
});

// Helper function to update the level label
function updateLevelLabel() {
  const levelLabel = document.querySelector('.level-label');
  if (levelLabel) {
    levelLabel.textContent = `Level ${currentLevel + 1}`;
  }
}

// Hide start screen and show game when Start is clicked
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const openMenu = document.getElementById('open-menu');
if (startScreen && startBtn) {
  // Hide the open-menu icon at first
  if (openMenu) openMenu.style.display = 'none';
  startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    updateLevelLabel(); // Update the level label when game starts
    // Show the open-menu icon when the game starts
    if (openMenu) openMenu.style.display = 'block';
    createLevelButtons(); // Show level buttons as soon as the game starts
  });
}

// Also create level buttons on initial load (in case menu is opened before playing)
createLevelButtons();

// Show/hide menu overlay when menu icons are clicked
const closeMenu = document.getElementById('close-menu');
const menuOverlay = document.getElementById('menu-overlay');
// Add openMenu again in case it's not in scope
const openMenuBtn = document.getElementById('open-menu');

if (openMenuBtn && closeMenu && menuOverlay) {
  openMenuBtn.addEventListener('click', () => {
    menuOverlay.classList.remove('hidden');
    openMenuBtn.style.display = 'none';
    closeMenu.style.display = 'block';
  });
  closeMenu.addEventListener('click', () => {
    menuOverlay.classList.add('hidden');
    openMenuBtn.style.display = 'block';
    closeMenu.style.display = 'none';
  });
}

function loadLevel(index) {
  currentLevel = index;
  layout = JSON.parse(JSON.stringify(levels[index]));
  layout = adjustLayoutForScreenSize(layout);
  grid.innerHTML = "";
  const tileElements = renderGrid();
  updateWaterflow(layout, tileElements);
  updateLevelLabel(); // Update the level label
}

document.getElementById("restart-btn").addEventListener("click", () => {
  loadLevel(currentLevel);
  window.levelComplete = false;
  hideOverlays(); // Hide overlays when restarting
});

function hideOverlays() {
  const overlay = document.getElementById("win-overlay");
  const popup = document.getElementById("win-popup");
  if (overlay) overlay.classList.add("hidden");
  if (popup) popup.classList.remove("visible");
  const menuOverlay = document.getElementById('menu-overlay');
  if (menuOverlay) menuOverlay.classList.add('hidden')
  const openMenuBtn = document.getElementById('open-menu');
  if (openMenuBtn) openMenuBtn.style.display = 'block';
  const closeMenu = document.getElementById('close-menu');
  if (closeMenu) closeMenu.style.display = 'none';
}

