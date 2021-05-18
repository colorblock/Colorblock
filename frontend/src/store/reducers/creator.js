import { combineReducers } from 'redux';
import produce from 'immer';
import undoable, { excludeAction } from 'redux-undo';
import * as types from '../actions/actionTypes';

export const defaultColor = 'rgba(49, 49, 49, 1)';
export const defaultWidth = 16;
export const defaultHeight = 16;
export const defaultDuration = 1;
export const defaultPaletteColors = [    
  'rgba(0, 0, 0, 1)',
  'rgba(255, 0, 0, 1)',
  'rgba(233, 30, 99, 1)',
  'rgba(156, 39, 176, 1)',
  'rgba(103, 58, 183, 1)',
  'rgba(63, 81, 181, 1)',
  'rgba(33, 150, 243, 1)',
  'rgba(3, 169, 244, 1)',
  'rgba(0, 188, 212, 1)',
  'rgba(0, 150, 136, 1)',
  'rgba(76, 175, 80, 1)',
  'rgba(139, 195, 74, 1)',
  'rgba(205, 220, 57, 1)',
  'rgba(158, 224, 122, 1)',
  'rgba(255, 235, 59, 1)',
  'rgba(255, 193, 7, 1)',
  'rgba(255, 152, 0, 1)',
  'rgba(255, 205, 210, 1)',
  'rgba(255, 87, 34, 1)',
  'rgba(121, 85, 72, 1)',
  'rgba(158, 158, 158, 1)',
  'rgba(96, 125, 139, 1)',
  'rgba(48, 63, 70, 1)',
  'rgba(255, 255, 255, 1)',
  'rgba(56, 53, 53, 1)',
  'rgba(56, 53, 53, 1)',
  'rgba(56, 53, 53, 1)',
  'rgba(56, 53, 53, 1)',
  'rgba(56, 53, 53, 1)',
  'rgba(56, 53, 53, 1)'
];

const initFrames = () => {
  const frames = {
    width: defaultWidth,
    height: defaultHeight,
    duration: defaultDuration,
    activeId: 0,
    frameIds: [0],
    frameList: {
      0: {
        id: 0,
        interval: 100,
        cells: []
      }
    }
  };
  fillCellsForPerFrame(frames);
  return frames; 
};

const initPalette = () => {
  const palette = {
    selectedIndex: 0,
    toolType: 'brush',  // default = brush [ bucket | picker | brush | eraser | move ]
    colors: defaultPaletteColors
  };
  return palette;
};


const fillCellsForPerFrame = (frames) => {
  // loop and fill each frame's cells with its attributes: width, height and default color
  frames.frameIds.forEach((frameId) => {
    const frame = frames.frameList[frameId];
    if (frame.cells.length === 0) {
      let cells = [];
      for (var i=0; i < frames.height; i++) {
        const row = Array(frames.width).fill(defaultColor);
        cells = cells.concat(row);
      }
      frame.cells = cells;
    }
  });
};

const resetIntervals = (frames) => {
  // reset intervals in frames as arithmetic sequence
  const framesCnt = frames.frameIds.length;
  const intervalList = Array(framesCnt).fill(0).map((_, i) => Math.floor(100 * (i + 1) / framesCnt));
  frames.frameIds.forEach((frameId, index) => {
    const frame = frames.frameList[frameId];
    frame.interval = intervalList[index];
  });
};

const setActiveFrameId = (frames, activeId) => {
  frames.activeId = activeId;
  return frames;
};

const addFrame = (frames) => {
  const maxFrameId = Math.max(...frames.frameIds);
  const newFrameId = maxFrameId + 1;
  frames.activeId = newFrameId;
  frames.frameIds = [...frames.frameIds, newFrameId];
  frames.frameList[newFrameId] = {
    id: newFrameId,
    interval: 100,
    cells: []
  };
  fillCellsForPerFrame(frames);
  resetIntervals(frames);
  return frames; 
};

const deleteFrame = (frames, frameId) => {
  delete frames.frameList[frameId];
  frames.frameIds.splice(frames.frameIds.indexOf(frameId), 1);
  if (frames.activeId === frameId) {
    frames.activeId = frames.frameIds[0];
  }
  resetIntervals(frames);
  return frames; 
};

const duplicateFrame = (frames, frameId) => {
  const maxFrameId = Math.max(...frames.frameIds);
  const newFrameId = maxFrameId + 1;
  frames.activeId = newFrameId;
  frames.frameIds = [...frames.frameIds, newFrameId];
  const frame = frames.frameList[frameId];
  frames.frameList[newFrameId] = {
    id: newFrameId,
    interval: 100,
    cells: frame.cells.slice()
  };
  resetIntervals(frames);
  return frames; 
};

const setFrameInterval = (frames, frameId, interval) => {
  frames.frameList[frameId].interval = interval;
  return frames;
};

const setDuration = (frames, duration) => {
  frames.duration = duration;
  return frames;
};

const resetFrame = (frames, frameId) => {
  const cellsCnt = frames.width * frames.height;
  frames.frameList[frameId].cells = Array(cellsCnt).fill(defaultColor);
  return frames;
};

const appendRow = (frames) => {
  frames.height++;
  frames.frameIds.forEach(frameId => {
    const frame = frames.frameList[frameId];
    const cells = frame.cells;
    const row = Array(frames.width).fill(defaultColor);
    frame.cells = cells.concat(row);
  });
  return frames;
};

const deleteRow = (frames) => {
  frames.height--;
  frames.frameIds.forEach(frameId => {
    const frame = frames.frameList[frameId];
    frame.cells = frame.cells.slice(0, -frames.width);
  });
  return frames;
};

const appendCol = (frames) => {
  frames.frameIds.forEach(frameId => {
    const frame = frames.frameList[frameId];
    const cells = frame.cells;
    const newCells = [];
    cells.forEach((color, index) => {
      newCells.push(color);
      if (index % frames.width === frames.width - 1) {
        newCells.push(defaultColor);
      }
    });
    frame.cells = newCells;
  });
  frames.width++;
  return frames;
};

const deleteCol = (frames) => {
  frames.frameIds.forEach(frameId => {
    const frame = frames.frameList[frameId];
    const cells = frame.cells;
    const newCells = [];
    cells.forEach((color, index) => {
      if (index % frames.width !== frames.width - 1) {
        newCells.push(color);
      }
    });
    frame.cells = newCells;
  });
  frames.width--;
  return frames;
};

const setHoveredIndex = (frames, index) => {
  frames.hoveredIndex = index;
  return frames;
};

const selectPaletteColor = (palette, colorIndex) => {
  palette.selectedIndex = colorIndex;
  return palette;
};

const changePaletteColor = (palette, color) => {
  palette.colors[palette.selectedIndex] = color;
  return palette;
};

const changeToolType = (palette, toolType) => {
  palette.toolType = toolType;
  return palette;
};

const drawWithBrush = (frames, cellIndex, color) => {
  const cells = frames.frameList[frames.activeId].cells;
  cells[cellIndex] = color;
  return frames;
};

const getAdjacentCells = (cells, cellIndex, width, height) => {
  // cells are filled with 0 and 1, find all 1 cells near cellIndex
  const isAdjacentList = Array(cells.length).fill(-1);  // default as -1, false as 0, true as 1
  isAdjacentList[cellIndex] = 1;  // itself is also included

  const checkAdjacentCell = (isAdjacentList, cells, cellIndex, width, height) => {
    const adjacentIndexes = [];
    if (cellIndex % width !== 0) {
      // not on the far left, add left cell
      adjacentIndexes.push(cellIndex - 1);
    }
    if (cellIndex % width !== width - 1) {
      // not on the far right, add right cell
      adjacentIndexes.push(cellIndex + 1);
    }
    if (cellIndex >= width) {
      // not on the far top, add top cell
      adjacentIndexes.push(cellIndex - width);
    }
    if (cellIndex < width * (height - 1)) {
      // not on the far bottom, add bottom cell
      adjacentIndexes.push(cellIndex + width);
    }
    console.log(isAdjacentList, adjacentIndexes, cells, cellIndex);
    adjacentIndexes.forEach(index => {
      const currentState = isAdjacentList[index];
      if (currentState < 0) {
        // if cell has been verified, ignore that
        const cell = cells[index];
        isAdjacentList[index] = cell;  // modify its state
        if (cell === 1) {
          // value is true, this means same color, then check its neighborhoods
          checkAdjacentCell(isAdjacentList, cells, index, width, height);
        }
      }
    });
  };
  
  // start loop
  checkAdjacentCell(isAdjacentList, cells, cellIndex, width, height);

  const adjacentCells = isAdjacentList.map((v, index) => v === 1 ? index : -1).filter(v => v >= 0);
  return adjacentCells;
};

const drawWithBucket = (frames, cellIndex, color) => {
  const cells = frames.frameList[frames.activeId].cells;
  const cellColor = cells[cellIndex];
  const bitCells = cells.map(_color => _color === cellColor ? 1 : 0);
  const adjacentCells = getAdjacentCells(bitCells, cellIndex, frames.width, frames.height);
  adjacentCells.forEach(index => {
    cells[index] = color;
  });
  return frames;
};

const drawWithEraser = (frames, cellIndex) => {
  const cells = frames.frameList[frames.activeId].cells;
  cells[cellIndex] = defaultColor;
  return frames;
};

const frames = produce((frames, action) => {
  switch (action.type) {
    case types.NEW_PROJECT:
      return initFrames();
    case types.LOAD_PROJECT:
      return action.frames;
    case types.SET_ACTIVE_FRAME_ID:
      return setActiveFrameId(frames, action.activeId);
    case types.ADD_FRAME:
      return addFrame(frames);
    case types.DELETE_FRAME:
      return deleteFrame(frames, action.frameId);
    case types.DUPLICATE_FRAME:
      return duplicateFrame(frames, action.frameId);
    case types.SET_FRAME_INTERVAL:
      return setFrameInterval(frames, action.frameId, action.interval);
    case types.SET_DURATION:
      return setDuration(frames, action.duration);
    case types.RESET_FRAME:
      return resetFrame(frames, action.frameId);
    case types.APPEND_ROW:
      return appendRow(frames);
    case types.DELETE_ROW:
      return deleteRow(frames);
    case types.APPEND_COL:
      return appendCol(frames);
    case types.DELETE_COL:
      return deleteCol(frames);
    case types.SET_HOVERED_INDEX:
      return setHoveredIndex(frames, action.index);
    case types.DRAW_WITH_BRUSH:
      return drawWithBrush(frames, action.cellIndex, action.color);
    case types.DRAW_WITH_BUCKET:
      return drawWithBucket(frames, action.cellIndex, action.color);
    case types.DRAW_WITH_ERASER:
      return drawWithEraser(frames, action.cellIndex);
    default:
  }
  return frames;
}, initFrames());

const palette = produce((palette, action) => {
  switch (action.type) {
    case types.SELECT_PALETTE_COLOR:
      return selectPaletteColor(palette, action.colorIndex);
    case types.CHANGE_PALETTE_COLOR:
      return changePaletteColor(palette, action.color);
    case types.CHANGE_TOOL_TYPE:
      return changeToolType(palette, action.toolType);
    default:
  }
  return palette;
}, initPalette());

const config = {
  filter: excludeAction(types.SET_HOVERED_INDEX, types.CHANGE_TOOL_TYPE)
};
const creator = undoable(combineReducers({
  frames,
  palette
}), config);

export default creator;