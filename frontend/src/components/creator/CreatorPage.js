import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Header from '../layout/Header';
import Preview from './Preview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';
import { 
  faFillDrip, faEyeDropper, faPaintBrush, faEraser, faArrowsAlt, faDownload, 
  faQuestion, faKeyboard, faPlay, faPause, faCompress, faPhotoVideo, faTrashAlt, 
  faCopy, faArrowsAltH, faArrowsAltV, faUndo, faRedo
} from '@fortawesome/free-solid-svg-icons';
import * as actions from '../../store/actions/actionCreator';
import { ActionCreators } from 'redux-undo';

export const CreatePage = (props) => {
  const { palette, frames } = props;
  const { setActiveFrameId, addFrame, setFrameInterval, 
          setDuration, resetFrame, appendRow, deleteRow, 
          appendCol, deleteCol, setHoveredIndex, selectPaletteColor, 
          drawWithBrush, drawWithBucket, drawWithEraser, changePaletteColor, 
          changeToolType, deleteFrame, duplicateFrame,
          undo, redo } = props;

  const [isPreviewStatic, setIsPreviewStatic] = useState(true);  // whether preview box is showing static frame or not. true: static, false: animation
  const [isPreviewLarge, setIsPreviewLarge] = useState(true);    // control the size of preview box
  const [pickr, setPickr] = useState(null);

  const ratio = frames.height / frames.width;
  const totalWidthNum = ratio <= 1 ? 1.0 : 1 / ratio;
  const totalWidth = `${100.0 * totalWidthNum}%`;
  const widthPct = `${100.0 / frames.width}%`;
  const previewFixHeight = 1.5;

  const onSetFrameInterval = (e, frameId) => {
    const interval = parseInt(e.target.value);
    if (interval >= 0 && interval <= 100) {
      setFrameInterval(frameId, interval);
    } else {
      alert('illegal interval!');
    }
  };

  const openPickr = () => {
    changeToolType('brush');
    let colorIndex;
    if (palette.selectedIndex >= 0) {
      colorIndex = palette.selectedIndex;
    } else {
      colorIndex = palette.colors.length - 1;
      selectPaletteColor(colorIndex);
    }
    const color = palette.colors[colorIndex];
    pickr.setColor(color);
    pickr.show();
  };

  const clickPaletteColor = (colorIndex) => {
    selectPaletteColor(colorIndex);
    if (palette.toolType !== 'bucket' && palette.toolType !== 'brush') {
      changeToolType('brush');
    }
  };

  const clickPaletteTool = (toolType) => {
    changeToolType(toolType);
    if (toolType === 'brush') {
      openPickr();
    } else if (toolType !== 'bucket') {
      selectPaletteColor(-1);
    }
  };

  const clickGridCell = (cellIndex, cellColor) => {
    switch (palette.toolType) {
      case 'brush':
        drawWithBrush(cellIndex, palette.colors[palette.selectedIndex]);
        return;
      case 'bucket':
        drawWithBucket(cellIndex, palette.colors[palette.selectedIndex]);
        return;
      case 'picker':
        const colorIndex = palette.colors.indexOf(cellColor);
        selectPaletteColor(colorIndex);
        return;
      case 'eraser':
        drawWithEraser(cellIndex);
        return;
      default:
    }
  };

  // load pickr after DOM loaded
  useEffect(() => {
    const newPickr = Pickr.create({
      el: '.color-picker',
      theme: 'nano',
      defaultRepresentation: 'RGBA',
      inline: true,
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          input: true,
          clear: true,
          save: true
        }
      }
    });
    newPickr.isShown = false;
    newPickr.zIndex = -1;

    newPickr.on('save', (colorData) => {
      if (colorData) {
        const color = colorData.toRGBA().toString(0);
        changePaletteColor(color);
      }
    });
    newPickr.on('show', currenctPickr => {
      currenctPickr.isShown = true;
      currenctPickr.zIndex = 100;
      setPickr(currenctPickr);
    });
    newPickr.on('hide', currenctPickr => {
      currenctPickr.isShown = false;
      currenctPickr.zIndex = -1;
      setPickr(currenctPickr);
    });

    setPickr(newPickr);
  }, []);

  return (
    <div>
      <Header />
      <div data-role='creator body' className='w-11/12 mx-auto'>
        <div data-role='frame list container' className='flex h-20 mb-6'>
          <div data-role='button to append frame'>
            <button className='h-full bg-gray-800 text-white w-7 border-b-4 border-gray-400 rounded' onClick={ () => addFrame() }>
              +
            </button>
          </div>
          <div className='ml-3 w-full bg-gray-200 flex'>
            {
              frames.frameIds.map((frameId) => (
                <div data-role='preview box with buttons' className='w-16 mr-4 mt-1.5' key={frameId}>
                  <div data-role='top part of preview box' className={'flex justify-between bg-gray-100 border '.concat(frameId === frames.activeId ? 'border-red-500' : 'border-black')} onClick={ () => setActiveFrameId(frameId) }>
                    <div style={{ height: `${previewFixHeight}rem`, width: `${ratio * previewFixHeight}rem` }}>
                      <Preview
                        task={{
                          type: 'single',
                          frames,
                          frameId
                        }} 
                      />
                    </div>
                    <div>
                      <button className='block w-5 h-5 text-white m-0 bg-gray-400' onClick={ (e) => { e.stopPropagation(); deleteFrame(frameId); } } disabled={frames.frameIds.length === 1}>
                        <div className='flex grid justify-items-center'>
                          <FontAwesomeIcon icon={faTrashAlt} size='xs' />
                        </div>
                      </button>
                      <button className='block w-5 h-5 text-white mt-2 bg-gray-400' onClick={ (e) => { e.stopPropagation(); duplicateFrame(frameId) } }>
                        <div className='flex grid justify-items-center'>
                          <FontAwesomeIcon icon={faCopy} size='xs' />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div data-role='bottom part of preview box'>
                    <input 
                      type='number' 
                      step='1' 
                      value={ frames.frameList[frameId].interval } 
                      onChange={ (e) => onSetFrameInterval(e, frameId) } 
                      className={'w-full h-5 bg-gray-400 text-center align-top py-0.5 text-white border border-t-0 '.concat(frameId === frames.activeId ? 'border-red-500' : 'border-black')}
                      disabled={frameId === frames.frameIds.length - 1}
                    />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <div data-role='creator tools and grids' className='flex'>
          <div data-role='creator primary tools on the left side' className='w-48'>
            <div>
              <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>NEW</button>
            </div>
            <div className='flex justify-between mt-1'>
              <div className='w-1/2 pr-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>LOAD</button>
              </div>
              <div className='w-1/2 pl-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>SAVE</button>
              </div>
            </div>
            <div className='flex justify-between mt-4'>
              <div className='w-1/2 pr-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded' onClick={ () => undo() }>
                  <FontAwesomeIcon icon={faUndo} />
                </button>
              </div>
              <div className='w-1/2 pl-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded' onClick={ () => redo() }>
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              </div>
            </div>
            <div data-role='color pickr' className='relative'>
              <div 
                className='block absolute left-5 top-5' 
                style={{ 
                  paddingLeft: '100%', 
                  zIndex: pickr ? pickr.zIndex : 0, 
                  display: pickr && pickr.isShown ? 'block' : 'none'
                }}
              >
                <div className='color-picker hidden'></div>
              </div>
            </div>
            <div data-role='painting tools' className='flex flex-wrap mt-5 text-xl'>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'bucket' ? 'selected' : '')} onClick={ () => clickPaletteTool('bucket') }><FontAwesomeIcon icon={faFillDrip} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'picker' ? 'selected' : '')} onClick={ () => clickPaletteTool('picker') }><FontAwesomeIcon icon={faEyeDropper} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(pickr && pickr.isShown ? 'selected' : '')} onClick={ () => clickPaletteTool('brush') }><FontAwesomeIcon icon={faPaintBrush} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'eraser' ? 'selected' : '')} onClick={ () => clickPaletteTool('eraser') }><FontAwesomeIcon icon={faEraser} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'move' ? 'selected' : '')} onClick={ () => clickPaletteTool('move') }><FontAwesomeIcon icon={faArrowsAlt} /></div>
            </div>
            <div data-role='palette' className='flex flex-wrap h-40 mt-5 leading-none'>
              {
                palette.colors.map((color, index) => (
                  <div 
                    className={'w-1/6 px-0.5 pt-0.5 '.concat(index === palette.selectedIndex ? 'border-4 border-gray-500' : '')}
                    onClick={ () => clickPaletteColor(index) }
                  >
                    <div className='w-full square' style={{ backgroundColor: color }}></div>
                  </div>
                ))
              }
            </div>
            <div className='mt-2'>
              <button className='w-full bg-gray-400 border-b-4 border-gray-100 py-2 rounded'>UPLOAD</button>
            </div>
            <div className='mt-2'>
              <button className='w-full bg-red-800 text-white border-b-4 border-red-400 py-1 rounded'><FontAwesomeIcon icon={faDownload} /></button>
            </div>
            <div className='flex justify-between mt-2'>
              <div className='w-1/2 pr-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'><FontAwesomeIcon icon={faQuestion} /></button>
              </div>
              <div className='w-1/2 pl-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'><FontAwesomeIcon icon={faKeyboard} /></button>
              </div>
            </div>
          </div>
          <div data-role='grids showing the selected frame at center' className='w-1/2 mx-auto'>
            <div className='w-3/4 mx-auto'>
              <div className='flex flex-wrap mx-auto' style={{ width: totalWidth, cursor: 'cell' }}>
                {
                  frames.frameList[frames.activeId].cells.map((color, index) => (
                    <div 
                      className='pl-0.5 pt-0.5' 
                      style={{ 
                        width: widthPct
                      }}  
                      onMouseOver={ () => setHoveredIndex(index) }
                      onClick={ () => clickGridCell(index, color) }
                    >
                      <div className='w-full square' style={{ backgroundColor: color }}></div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div data-role='preview-box and config tools at right side' className='w-48'>
            <div className='flex w-3/5 px-2 mx-auto'>
              <div className='w-1/3 mx-0.5'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 rounded' onClick={ () => setIsPreviewStatic(!isPreviewStatic) }>
                  <div className='relative -top-0.5'>
                    <FontAwesomeIcon icon={ isPreviewStatic ? faPlay : faPause } size='xs' />
                  </div>
                </button>
              </div>
              <div className='w-1/3 mx-0.5'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 rounded' onClick={ () => setIsPreviewLarge(!isPreviewLarge) }>
                  <div className='relative -top-0.5'>
                    <FontAwesomeIcon icon={faCompress} size='xs' />
                  </div>
                </button>
              </div>
              <div className='w-1/3 mx-0.5'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 rounded'>
                  <div className='relative -top-0.5'>
                    <FontAwesomeIcon icon={faPhotoVideo} size='xs' />
                  </div>
                </button>
              </div>
            </div>
            <div className='bg-gray-100'>
              <div className={`w-1/${isPreviewLarge ? 2 : 4} h-${isPreviewLarge ? 24 : 12} mx-auto my-5`}>
                <div className='h-full mx-auto' style={{ width: totalWidth }}>
                  {
                    isPreviewStatic ? 
                    <Preview
                      task={{
                        type: 'single',
                        frames,
                        frameId: frames.activeId
                      }} 
                    /> :
                    <Preview 
                      task={{
                        type: 'animation',
                        frames: frames
                      }} 
                    />
                  }
                </div>
              </div>
            </div>
            <div>
              <button onClick={ () => resetFrame(frames.activeId) } className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>RESET</button>
            </div>
            <div className='flex mt-5'>
              <div className='w-1/3 text-4xl text-center pr-1 py-1'>
                <FontAwesomeIcon icon={faArrowsAltH} />
              </div>
              <div className='w-2/3 flex border-2 border-gray-400'>
                <input value={frames.width} className='w-1/2 text-center' />
                <div className='w-1/2'>
                  <button className='block w-full text-center bg-gray-800 text-white border-b border-gray-400' onClick={ () => appendCol() }>
                    +
                  </button>
                  <button className='block w-full text-center bg-gray-800 text-white' onClick={ () => deleteCol() }>
                    -
                  </button>
                </div>
              </div>
            </div>
            <div className='flex mt-5'>
              <div className='w-1/3 text-4xl text-center pr-1 py-1'>
                <FontAwesomeIcon icon={faArrowsAltV} />
              </div>
              <div className='w-2/3 flex border-2 border-gray-400'>
                <input value={frames.height} className='w-1/2 text-center' />
                <div className='w-1/2'>
                  <button className='block w-full text-center bg-gray-800 text-white border-b border-gray-400' onClick={ () => appendRow() }>
                    +
                  </button>
                  <button className='block w-full text-center bg-gray-800 text-white' onClick={ () => deleteRow() }>
                    -
                  </button>
                </div>
              </div>
            </div>
            <div className='mt-5 border-2 border-gray-400'>
              <label className='block text-center w-full bg-gray-800 text-white'>Pixel Size</label>
              <input value='10' className='block text-center w-full bg-gray-600 text-white' />
            </div>
            <div className='mt-5 border-2 border-gray-400'>
              <label className='block text-center w-full bg-gray-800 text-white'>Duration</label>
              <input type='number' step='0.01' value={frames.duration} onChange={ (e) => setDuration(e.target.value) } className='block text-center w-full bg-gray-600 text-white' />
            </div>
            <div className='mt-5 text-center'>
              {Math.floor(frames.hoveredIndex / frames.width) + 1},{frames.hoveredIndex % frames.width + 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CreatePage.propTypes = {
  palette: PropTypes.object.isRequired,
  frames: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  frames: state.creator.present.frames,
  palette: state.creator.present.palette
});

const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(actions, dispatch),
  undo: () => dispatch(ActionCreators.undo()),
  redo: () => dispatch(ActionCreators.redo())
});

export default connect(mapStateToProps, mapDispatchToProps)(CreatePage);
