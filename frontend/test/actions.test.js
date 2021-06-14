import * as actions from '../src/store/actions/actionCreator';
import * as types from '../src/store/actions/actionTypes';

describe('creator actions', () => {
  it('should create an action to create new project', () => {
    const expectedAction = {
      type: types.NEW_PROJECT
    };
    expect(actions.newProject()).toEqual(expectedAction);
  });

  it('should create an action to load project', () => {
    const frames = {
      'test': true
    };
    const expectedAction = {
      type: types.LOAD_PROJECT,
      frames
    };
    expect(actions.loadProject(frames)).toEqual(expectedAction);
  });

  it('should create an action to set active frame id', () => {
    const activeFrameId = 0;
    const expectedAction = {
      type: types.SET_ACTIVE_FRAME_ID,
      activeId: activeFrameId
    };
    expect(actions.setActiveFrameId(activeFrameId)).toEqual(expectedAction);
  });

  it('should create an action to add frame', () => {
    const expectedAction = {
      type: types.ADD_FRAME
    };
    expect(actions.addFrame()).toEqual(expectedAction);
  });
  
  it('should create an action to delete frame', () => {
    const frameId = 1;
    const expectedAction = {
      type: types.DELETE_FRAME,
      frameId
    };
    expect(actions.deleteFrame(frameId)).toEqual(expectedAction);
  });
  
  it('should create an action to duplicate frame', () => {
    const frameId = 0;
    const expectedAction = {
      type: types.DUPLICATE_FRAME,
      frameId
    };
    expect(actions.duplicateFrame(frameId)).toEqual(expectedAction);
  });

  it('should create an action to set frame interval', () => {
    const frameId = 1;
    const interval = 50;
    const expectedAction = {
      type: types.SET_FRAME_INTERVAL,
      frameId,
      interval
    };
    expect(actions.setFrameInterval(frameId, interval)).toEqual(expectedAction);
  });
  
  it('should create an action to set duration', () => {
    const duration = 2;
    const expectedAction = {
      type: types.SET_DURATION,
      duration
    };
    expect(actions.setDuration(duration)).toEqual(expectedAction);
  });

  it('should create an action to reset frame', () => {
    const frameId = 1;
    const expectedAction = {
      type: types.RESET_FRAME,
      frameId
    };
    expect(actions.resetFrame(frameId)).toEqual(expectedAction);
  });

  it('should create an action to append row', () => {
    const expectedAction = {
      type: types.APPEND_ROW
    };
    expect(actions.appendRow()).toEqual(expectedAction);
  });

  it('should create an action to delete row', () => {
    const expectedAction = {
      type: types.DELETE_ROW
    };
    expect(actions.deleteRow()).toEqual(expectedAction);
  });

  it('should create an action to append col', () => {
    const expectedAction = {
      type: types.APPEND_COL
    };
    expect(actions.appendCol()).toEqual(expectedAction);
  });
  
  it('should create an action to delete col', () => {
    const expectedAction = {
      type: types.DELETE_COL
    };
    expect(actions.deleteCol()).toEqual(expectedAction);
  });
    
  it('should create an action to set hovered index', () => {
    const expectedAction = {
      type: types.SET_HOVERED_INDEX
    };
    expect(actions.setHoveredIndex()).toEqual(expectedAction);
  });

  it('should create an action to select palette color', () => {
    const colorIndex = 2;
    const expectedAction = {
      type: types.SELECT_PALETTE_COLOR,
      colorIndex
    };
    expect(actions.selectPaletteColor(colorIndex)).toEqual(expectedAction);
  });
  
  it('should create an action to change palette color', () => {
    const color = 'rgba(155, 155, 155, 1)';
    const expectedAction = {
      type: types.CHANGE_PALETTE_COLOR,
      color
    };
    expect(actions.changePaletteColor(color)).toEqual(expectedAction);
  });

  it('should create an action to draw with brush', () => {
    const cellIndex = 5;
    const color = 'rgba(155, 155, 155, 1)';
    const expectedAction = {
      type: types.DRAW_WITH_BRUSH,
      cellIndex,
      color
    };
    expect(actions.drawWithBrush(cellIndex, color)).toEqual(expectedAction);
  });
  
  it('should create an action to draw with eraser', () => {
    const cellIndex = 4;
    const expectedAction = {
      type: types.DRAW_WITH_ERASER,
      cellIndex
    };
    expect(actions.drawWithEraser(cellIndex)).toEqual(expectedAction);
  });
  
  it('should create an action to change tool type', () => {
    const toolType = 'brush';
    const expectedAction = {
      type: types.CHANGE_TOOL_TYPE,
      toolType
    };
    expect(actions.changeToolType(toolType)).toEqual(expectedAction);
  });
});

describe('wallet actions', () => {
  it('should create an action to switch wallet modal', () => {
    const expectedAction = {
      type: types.SWITCH_WALLET_MODAL
    };
    expect(actions.switchWalletModal()).toEqual(expectedAction);
  });

  it('should create an action to set public key list', () => {
    const keyList = ['a', 'b'];
    const expectedAction = {
      type: types.SET_ADDRESS_LIST,
      keyList
    };
    expect(actions.setAddressList(keyList)).toEqual(expectedAction);
  });
  
  it('should create an action to set account address', () => {
    const address = 'a';
    const expectedAction = {
      type: types.SET_ACCOUNT_ADDRESS,
      address
    };
    expect(actions.setAccountAddress(address)).toEqual(expectedAction);
  });
});