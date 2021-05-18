import * as types from './actionTypes';

export const newProject = () => {
  return {
    type: types.NEW_PROJECT
  };
};

export const loadProject = (frames) => {
  return {
    type: types.LOAD_PROJECT,
    frames
  };
};

export const setActiveFrameId = (activeId) => {
  return {
    type: types.SET_ACTIVE_FRAME_ID,
    activeId
  };
};

export const addFrame = () => {
  return {
    type: types.ADD_FRAME
  };
};

export const deleteFrame = (frameId) => {
  return {
    type: types.DELETE_FRAME,
    frameId
  };
};

export const duplicateFrame = (frameId) => {
  return {
    type: types.DUPLICATE_FRAME,
    frameId
  };
};

export const setFrameInterval = (frameId, interval) => {
  return {
    type: types.SET_FRAME_INTERVAL,
    frameId,
    interval
  };
};

export const setDuration = (duration) => {
  return {
    type: types.SET_DURATION,
    duration
  };
};

export const resetFrame = (frameId) => {
  return {
    type: types.RESET_FRAME,
    frameId
  };
};

export const appendRow = () => {
  return {
    type: types.APPEND_ROW
  };
};

export const deleteRow = () => {
  return {
    type: types.DELETE_ROW
  };
};
export const appendCol = () => {
  return {
    type: types.APPEND_COL
  };
};

export const deleteCol = () => {
  return {
    type: types.DELETE_COL
  };
};

export const setHoveredIndex = (index) => {
  return {
    type: types.SET_HOVERED_INDEX,
    index
  };
};

export const selectPaletteColor = (colorIndex) => {
  return {
    type: types.SELECT_PALETTE_COLOR,
    colorIndex
  };
};

export const changePaletteColor = (color) => {
  return {
    type: types.CHANGE_PALETTE_COLOR,
    color
  };
};

export const drawWithBrush = (cellIndex, color) => {
  return {
    type: types.DRAW_WITH_BRUSH,
    cellIndex,
    color
  };
};

export const drawWithBucket = (cellIndex, color) => {
  return {
    type: types.DRAW_WITH_BUCKET,
    cellIndex,
    color
  };
};

export const drawWithEraser = (cellIndex) => {
  return {
    type: types.DRAW_WITH_ERASER,
    cellIndex
  };
};

export const changeToolType = (toolType) => {
  return {
    type: types.CHANGE_TOOL_TYPE,
    toolType
  };
};