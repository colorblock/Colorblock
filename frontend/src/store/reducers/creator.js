import { combineReducers } from 'redux';
import produce from 'immer';
import * as types from '../actions/actionTypes';

export const defaultColor = '#313131';
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

const frames = produce((frames, action) => {
  switch (action.type) {
    case types.NEW_PROJECT:
      return initFrames();
    default:
  }
  return frames;
}, initFrames());

const creator = combineReducers({
  frames
});

export default creator;