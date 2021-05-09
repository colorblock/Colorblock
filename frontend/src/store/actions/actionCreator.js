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