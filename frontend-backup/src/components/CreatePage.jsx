import React from 'react';
import { connect } from 'react-redux';
import PreviewBox from './PreviewBox';
import PixelCanvasContainer from './PixelCanvas';
import CellSizeContainer from './CellSize';
import ColorPickerContainer from './ColorPicker';
import DimensionsContainer from './Dimensions';
import KeyBindings from './KeyBindings';
import DurationContainer from './Duration';
import EraserContainer from './Eraser';
import BucketContainer from './Bucket';
import MoveContainer from './Move';
import EyedropperContainer from './Eyedropper';
import FramesHandlerContainer from './FramesHandler';
import PaletteGridContainer from './PaletteGrid';
import ResetContainer from './Reset';
import SaveDrawingContainer from './SaveDrawing';
import NewProjectContainer from './NewProject';
import CellsInfo from './CellsInfo';
import UndoRedoContainer from './UndoRedo';
import drawHandlersProvider from '../utils/drawHandlersProvider';
import initialSetup from '../utils/startup';

class CreatePage extends React.Component {
  constructor() {
    super();
    this.state = {
      helpOn: false
    };
    Object.assign(this, drawHandlersProvider(this));
  }

  componentDidMount() {
    console.log('to mount createpage')
    const { dispatch } = this.props;
    initialSetup(dispatch, localStorage);
  }

  toggleHelp() {
    const { helpOn } = this.state;
    this.setState({ helpOn: !helpOn });
  }

  render() {
    const { helpOn } = this.state;
    const { modalType, modalOpen, changeModalType } = this.props;
    return (
      <div
        onMouseUp={this.onMouseUp}
        onTouchEnd={this.onMouseUp}
        onTouchCancel={this.onMouseUp}
      >
        <div
          className="app__frames-container"
          data-tooltip={
            helpOn
              ? `Create an awesome animation sequence.
              You can modify the duration of each frame, changing its own value.
              The number indicates where the frame ends in a range from 0 to 100.
              `
              : null
          }
        >
          <FramesHandlerContainer />
        </div>
        <div className="app__central-container">
          <div className="left col-1-4">
            <div className="app__left-side">
              <div className="app__mobile--container max-width-container">
                <div className="app__mobile--group">
                  <div data-tooltip={helpOn ? 'New project' : null}>
                    <NewProjectContainer />
                  </div>
                  <div className="app__load-save-container">
                    <button
                      type="button"
                      className="app__load-button"
                      onClick={() => {
                        changeModalType('load');
                      }}
                      data-tooltip={
                        helpOn ? 'Load projects you stored before' : null
                      }
                    >
                      LOAD
                    </button>
                    <div data-tooltip={helpOn ? 'Save your project' : null}>
                      <SaveDrawingContainer />
                    </div>
                  </div>
                  <div
                    data-tooltip={helpOn ? 'Undo (CTRL+Z) Redo (CTRL+Y)' : null}
                  >
                    <UndoRedoContainer />
                  </div>
                  <div className="app__tools-wrapper grid-3">
                    <div
                      data-tooltip={
                        helpOn
                          ? 'It fills an area of the current frame based on color similarity (B)'
                          : null
                      }
                    >
                      <BucketContainer />
                    </div>
                    <div
                      data-tooltip={
                        helpOn ? 'Sample a color from your drawing (O)' : null
                      }
                    >
                      <EyedropperContainer />
                    </div>
                    <div
                      data-tooltip={
                        helpOn
                          ? 'Choose a new color that is not in your palette (P)'
                          : null
                      }
                    >
                      <ColorPickerContainer />
                    </div>
                    <div data-tooltip={helpOn ? 'Remove colors (E)' : null}>
                      <EraserContainer />
                    </div>
                    <div
                      data-tooltip={
                        helpOn
                          ? 'Move your drawing around the canvas (M)'
                          : null
                      }
                    >
                      <MoveContainer />
                    </div>
                  </div>
                </div>
                <div className="app__mobile--group">
                  <PaletteGridContainer />
                </div>
              </div>
              <div className="app__mobile--container max-width-container">
                <div className="app__mobile--group">
                  <button
                    type="button"
                    className="app__upload-button"
                    onClick={() => {
                      changeModalType('upload');
                    }}
                    data-tooltip={
                      helpOn ? 'Upload your artwork to blockchain' : null
                    }
                  >
                    UPLOAD
                  </button>
                </div>
                <div className="app__mobile--group">
                  <div className="app__social-container">
                    <div
                      data-tooltip={
                        helpOn
                          ? 'Download your creation in different formats'
                          : null
                      }
                    >
                      <button
                        type="button"
                        aria-label="Download"
                        className="app__download-button"
                        onClick={() => {
                          changeModalType('download');
                        }}
                      />
                    </div>
                    <div className="app__help-container">
                      <div data-tooltip="Toggle help tooltips">
                        <button
                          type="button"
                          aria-label="Help"
                          className={`app__toggle-help-button
                          ${helpOn ? ' selected' : ''}`}
                          onClick={() => {
                            this.toggleHelp();
                          }}
                        />
                      </div>
                      <div
                        data-tooltip={helpOn ? 'Show keyboard shortcuts' : null}
                      >
                        <KeyBindings
                          onClick={() => {
                            changeModalType('keybindings');
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="center col-2-4">
            <PixelCanvasContainer
              drawHandlersFactory={this.drawHandlersFactory}
            />
          </div>
          <div className="right col-1-4">
            <div className="app__right-side">
              <div className="app__mobile--container">
                <div className="app__mobile--group">
                  <PreviewBox
                    helpOn={helpOn}
                    callback={() => {
                      changeModalType('preview');
                    }}
                  />
                  <div
                    data-tooltip={helpOn ? 'Reset the selected frame' : null}
                    className="max-width-container-centered {"
                  >
                    <ResetContainer />
                  </div>
                  <div
                    data-tooltip={helpOn ? 'Number of columns and rows' : null}
                    className="max-width-container-centered {"
                  >
                    <DimensionsContainer />
                  </div>
                </div>
                <div className="app__mobile--group max-width-container-centered {">
                  <div data-tooltip={helpOn ? 'Size of one tile in px' : null}>
                    <CellSizeContainer />
                  </div>
                  <div
                    data-tooltip={
                      helpOn ? 'Animation duration in seconds' : null
                    }
                  >
                    <DurationContainer />
                    <CellsInfo />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreatePage;
