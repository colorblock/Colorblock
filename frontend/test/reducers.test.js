import reducer from '../src/store/reducers/reducer';
import * as actions from '../src/store/actions/actionCreator';
import * as creatorSettings from '../src/store/reducers/creator';

const checkInitialFrame = (frames) => {
  expect(frames.width).toEqual(creatorSettings.defaultWidth);
  expect(frames.height).toEqual(creatorSettings.defaultHeight);
  expect(frames.duration).toEqual(creatorSettings.defaultDuration);
  expect(frames.activeId).toEqual(0);
  expect(frames.frameIds).toEqual([0]);
  expect(frames.frameList[0].id).toEqual(0);
  expect(frames.frameList[0].interval).toEqual(100);
  expect(frames.frameList[0].cells.length).toEqual(creatorSettings.defaultWidth * creatorSettings.defaultHeight);
};

describe('root reducer', () => {
  it('should return the initial state', () => {
    const state = reducer(undefined, {});

    // check creator.frames
    const frames = state.creator.frames;
    checkInitialFrame(frames);
  });
});

describe('creator reducer', () => {
  const state = {
    creator: {
      frames: null
    }
  };

  it('should handle action newProject', () => {
    const newState = reducer(state, actions.newProject());
    const frames = newState.creator.frames;
    checkInitialFrame(frames);
  });
});