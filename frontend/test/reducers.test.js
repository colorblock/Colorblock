import _ from 'lodash';
import reducer from '../src/store/reducers/reducer';
import { defaultColor, defaultPaletteColors } from '../src/store/reducers/creator';
import * as actions from '../src/store/actions/actionCreator';
import * as creatorSettings from '../src/store/reducers/creator';

const checkInitialFrames = (frames) => {
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
    const frames = state.creator.present.frames;
    checkInitialFrames(frames);
  });
});

describe('creator - frames reducer', () => {
  let savedState = {
    creator: undefined
  };
  let savedFrames;

  it('should handle action newProject', () => {
    const state = reducer(savedState, actions.newProject());
    const frames = state.creator.present.frames;
    checkInitialFrames(frames);
    savedState = state;
    
    savedFrames = {
      width: 1,
      height: 1,
      activeId: 0,
      frameIds: [0, 1],
      frameList: {
        0: {
          id: 0,
          cells: [defaultColor]
        },
        1: {
          id: 1,
          cells: [defaultColor]
        }
      }
    };
  });

  it('should handle action loadProject', () => {
    const state = reducer(savedState, actions.loadProject(savedFrames));
    const frames = state.creator.present.frames;
    expect(frames).toEqual(savedFrames);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action setActiveFrameId', () => {
    const newFrameId = 1;
    savedFrames = {...savedFrames, activeId: newFrameId};

    const state = reducer(savedState, actions.setActiveFrameId(newFrameId));
    const frames = state.creator.present.frames;
    expect(frames).toEqual(savedFrames);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });
  
  it('should handle action addFrame', () => {
    savedFrames.activeId = 2;
    savedFrames.frameIds = [0, 1, 2];
    savedFrames.frameList[2] = {
      id: 2,
      interval: 100,
      cells: [defaultColor]
    }
    savedFrames.frameList[0].interval = 33;
    savedFrames.frameList[1].interval = 66;

    const state = reducer(savedState, actions.addFrame());
    const frames = state.creator.present.frames;
    expect(frames).toEqual(savedFrames);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });
  
  it('should handle action deleteFrame', () => {
    const frameId = 2;
    savedFrames.activeId = 0;
    savedFrames.frameIds = [0, 1];
    delete savedFrames.frameList[2];
    savedFrames.frameList[0].interval = 50;
    savedFrames.frameList[1].interval = 100;

    const state = reducer(savedState, actions.deleteFrame(frameId));
    const frames = state.creator.present.frames;
    expect(frames).toEqual(savedFrames);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });
  
  it('should handle action duplicateFrame', () => {
    const frameId = 1;
    savedFrames.activeId = 2;
    savedFrames.frameIds = [0, 1, 2];
    savedFrames.frameList[2] = {
      id: 2,
      interval: 100,
      cells: [defaultColor]
    }
    savedFrames.frameList[0].interval = 33;
    savedFrames.frameList[1].interval = 66;

    const state = reducer(savedState, actions.duplicateFrame(frameId));
    const frames = state.creator.present.frames;
    expect(frames).toEqual(savedFrames);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action setFrameInterval', () => {
    const frameId = 0;
    const interval = 10;
    savedFrames.frameList[0].interval = 10;

    const state = reducer(savedState, actions.setFrameInterval(frameId, interval));
    const frames = state.creator.present.frames;
    expect(frames).toEqual(savedFrames);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action setDuration', () => {
    const duration = 2;
    savedFrames.duration = duration;

    const state = reducer(savedState, actions.setDuration(duration));
    const frames = state.creator.present.frames;
    expect(frames).toEqual(savedFrames);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action resetFrame', () => {
    const frameId = 0;

    const state = reducer(savedState, actions.resetFrame(frameId));
    const frames = state.creator.present.frames;
    const cells = frames.frameList[frameId].cells;
    expect(cells[0]).toEqual(defaultColor);
    expect(cells[cells.length - 1]).toEqual(defaultColor);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action appendRow', () => {
    const state = reducer(savedState, actions.appendRow());
    const frames = state.creator.present.frames;
    expect(frames.height).toEqual(savedFrames.height + 1);
    expect(frames.frameList[0].cells.length).toEqual(savedFrames.width * (savedFrames.height + 1));
    frames.frameIds.forEach(frameId => {
      const frame = frames.frameList[frameId];
      frame.cells.slice(-frames.width).forEach(color => {
        expect(color).toEqual(defaultColor);
      });
    });
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });
  
  it('should handle action deleteRow', () => {
    const state = reducer(savedState, actions.deleteRow());
    const frames = state.creator.present.frames;
    expect(frames.height).toEqual(savedFrames.height - 1);
    expect(frames.frameList[0].cells.length).toEqual(savedFrames.width * (savedFrames.height - 1));
    frames.frameIds.forEach(frameId => {
      const frame = frames.frameList[frameId];
      expect(frame.cells).toEqual(savedFrames.frameList[frameId].cells.slice(0, -frames.width));
    });
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action appendCol', () => {
    const state = reducer(savedState, actions.appendCol());
    const frames = state.creator.present.frames;
    expect(frames.width).toEqual(savedFrames.width + 1);
    expect(frames.frameList[0].cells.length).toEqual((savedFrames.width + 1) * savedFrames.height);
    frames.frameIds.forEach(frameId => {
      const frame = frames.frameList[frameId];
      frame.cells.forEach((color, index) => {
        if (index % frames.width === frames.width - 1) {
          expect(color).toEqual(defaultColor);
        }
      });
    });
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });
  
  it('should handle action deleteCol', () => {
    const state = reducer(savedState, actions.deleteCol());
    const frames = state.creator.present.frames;
    expect(frames.width).toEqual(savedFrames.width - 1);
    expect(frames.frameList[0].cells.length).toEqual((savedFrames.width -1) * savedFrames.height);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action setHoveredIndex', () => {
    const index = 10;
    const state = reducer(savedState, actions.setHoveredIndex(index));
    const frames = state.creator.present.frames;
    expect(frames.hoveredIndex).toEqual(index);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });

  it('should handle action drawWithBrush', () => {
    const cellIndex = 5;
    const color = 'rgba(155, 155, 155, 1)';
    const state = reducer(savedState, actions.drawWithBrush(cellIndex, color));
    const frames = state.creator.present.frames;
    expect(frames.frameList[frames.activeId].cells[cellIndex]).toEqual(color);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });
  
  it('should handle action drawWithEraser', () => {
    const cellIndex = 4;
    const state = reducer(savedState, actions.drawWithEraser(cellIndex));
    const frames = state.creator.present.frames;
    expect(frames.frameList[frames.activeId].cells[cellIndex]).toEqual(defaultColor);
    savedState = state;
    savedFrames = _.cloneDeep(frames);
  });
});

describe('creator - palette reducer', () => {
  let savedState = {
    creator: undefined
  };
  let savedpalette;

  it('should handle palette init', () => {
    const state = reducer(savedState, {});
    const palette = state.creator.present.palette;
    expect(palette.colors).toEqual(defaultPaletteColors);
    expect(palette.selectedIndex).toEqual(0);
    savedState = state;
    savedpalette = _.cloneDeep(palette);
  });

  it('should handle action select palette color', () => {
    const colorIndex = 2;
    const state = reducer(savedState, actions.selectPaletteColor(colorIndex));
    const palette = state.creator.present.palette;
    expect(palette.selectedIndex).toEqual(colorIndex);
    savedState = state;
    savedpalette = _.cloneDeep(palette);
  });
  
  it('should handle action change palette color', () => {
    const color = 'rgba(155, 155, 155, 1)';
    const state = reducer(savedState, actions.changePaletteColor(color));
    const palette = state.creator.present.palette;
    expect(palette.colors[palette.selectedIndex]).toEqual(color);
    savedState = state;
    savedpalette = _.cloneDeep(palette);
  });
  
  it('should handle action change tool type', () => {
    const toolType = 'brush';
    const state = reducer(savedState, actions.changeToolType(toolType));
    const palette = state.creator.present.palette;
    expect(palette.toolType).toEqual(toolType);
    savedState = state;
    savedpalette = _.cloneDeep(palette);
  });
});