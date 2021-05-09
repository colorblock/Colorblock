import { combineReducers } from 'redux';
import produce from 'immer';
import * as types from '../actions/actionTypes';

export const defaultColor = 'rgba(49, 49, 49, 1)';
export const defaultWidth = 16;
export const defaultHeight = 16;
export const defaultDuration = 1;

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
    colors: [    
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
    ]
  };
  return palette;
};


const fillCellsForPerFrame = (frames) => {
  // loop and fill each frame's cells with its attributes: width, height and default color
  frames.frameIds.forEach((index) => {
    let cells = [];
    for (var i=0; i < frames.height; i++) {
      const row = Array(frames.width).fill(defaultColor);
      cells = cells.concat(row);
    }
    frames.frameList[index].cells = cells;
  });
};

const setActiveFrameId = (frames, activeId) => {
  frames.activeId = activeId;
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
    default:
  }
  return frames;
}, initFrames());

const palette = produce((palette, actions) => {
   return palette;
}, initPalette());

const creator = combineReducers({
  frames,
  palette
});

export default creator;