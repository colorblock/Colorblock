import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from 'redux-undo';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import Preview from '../common/Preview';
import * as actions from '../../store/actions/actionCreator';
import { convertFramesToString, convertFramesToIntervals } from '../../utils/render';
import { contractModules, getSignedCmd, mkReq } from '../../utils/sign';
import { serverUrl, itemConfig } from '../../config';
import { saveStateToCookies } from '../../utils/storage';

const CreatePage = (props) => {
  const { frames, palette, dpt, wallet } = props;  // dpt means dispatch

  const [isPreviewStatic, setIsPreviewStatic] = useState(true);  // whether preview box is showing static frame or not. true: static, false: animation
  const [isPreviewLarge, setIsPreviewLarge] = useState(true);    // control the size of preview box
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitItem, setSubmitItem] = useState({});
  const [pickr, setPickr] = useState(null);

  const ratio = frames.height / frames.width;
  const totalWidthNum = ratio <= 1 ? 1.0 : 1 / ratio;
  const totalWidth = `${100.0 * totalWidthNum}%`;
  const widthPct = `${100.0 / frames.width}%`;

  // calc suitable size for preview presentation
  const getPreviewBoxSize = (boxWidth=0, boxHeight=0, frameWidth, frameHeight) => {
    const xScale = boxWidth ? boxWidth / frameWidth : 100;
    const yScale = boxHeight ? boxHeight / frameHeight : 100;
    const scale = Math.min(xScale, yScale);
    const width = frameWidth * scale;
    const height = frameHeight * scale;
    return {
      width,
      height
    }
  };
  const previewSizeXS = getPreviewBoxSize(0, 1.5, frames.width, frames.height);
  const previewSizeSM = getPreviewBoxSize(12, 3, frames.width, frames.height);
  const previewSizeLG = getPreviewBoxSize(12, 6, frames.width, frames.height);
  const previewSizeXL = getPreviewBoxSize(18, 18, frames.width, frames.height);

  const onSetFrameInterval = (e, frameId) => {
    const interval = parseInt(e.target.value);
    if (interval >= 0 && interval <= 100) {
      dpt.setFrameInterval(frameId, interval);
    } else {
      alert('illegal interval!');
    }
  };

  const openPickr = () => {
    dpt.changeToolType('brush');
    let colorIndex;
    if (palette.selectedIndex >= 0) {
      colorIndex = palette.selectedIndex;
    } else {
      colorIndex = palette.colors.length - 1;
      dpt.selectPaletteColor(colorIndex);
    }
    const color = palette.colors[colorIndex];
    pickr.setColor(color);
    pickr.show();
  };

  // function when clicking left palette color board
  const clickPaletteColor = (colorIndex) => {
    dpt.selectPaletteColor(colorIndex);
    if (palette.toolType !== 'bucket' && palette.toolType !== 'brush') {
      dpt.changeToolType('brush');
    }
  };

  // function when clicking left palette tool board
  const clickPaletteTool = (toolType) => {
    if (toolType === palette.toolType) {
      // reset to default - brush
      dpt.changeToolType('brush');
    } else {
      // set to new toolType
      dpt.changeToolType(toolType);
    }
  
    // do some detailed actions
    if (toolType === 'brush') {
      openPickr();
    } else if (toolType !== 'bucket') {
      dpt.selectPaletteColor(-1);
    }
  };

  // function when clicking center painting board
  const clickGridCell = (cellIndex, cellColor) => {
    switch (palette.toolType) {
      case 'brush':
        dpt.drawWithBrush(cellIndex, palette.colors[palette.selectedIndex]);
        return;
      case 'bucket':
        dpt.drawWithBucket(cellIndex, palette.colors[palette.selectedIndex]);
        return;
      case 'picker':
        const colorIndex = palette.colors.indexOf(cellColor);
        dpt.selectPaletteColor(colorIndex);
        return;
      case 'eraser':
        dpt.drawWithEraser(cellIndex);
        return;
      default:
    }
  };

  const clickUpload = () => {
    if (wallet.address) {
      setIsModalOpen(true);
    } else {
      alert('please connect to wallet first');
    }
  };

  const onSubmitItem = async () => {
    const singleFrameId = isPreviewStatic ? frames.activeId : null;
    const { title, description, supply } = submitItem;
    const tags = submitItem.tags.split(',').map(v => v.trim());

    // validate supply
    const supplyNumber = parseFloat(supply);
    if (isNaN(supplyNumber) || supplyNumber < itemConfig.minSupply || supplyNumber > itemConfig.maxSupply) {
      alert(`supply must in ${itemConfig.minSupply} ~ ${itemConfig.maxSupply}`);
      return;
    } else if (supplyNumber !== Math.floor(supplyNumber)) {
      alert('supply must be integer');
      return;
    }

    const cells = convertFramesToString(frames, singleFrameId);
    
    // get hash id
    const hashCmd = mkReq({'to_hash': cells})
    const id = await fetch(`${serverUrl}/tool/hash`, hashCmd).then(res => res.text());

    const rows = frames.height;
    const cols = frames.width;
    const frameCnt = isPreviewStatic ? 1 : frames.frameIds.length;
    const intervals = convertFramesToIntervals(frames, singleFrameId);
    const account = wallet.address;
    const cmd = {
      code: `(${contractModules.colorblock}.create-item (read-msg "id") (read-msg "title") (read-msg "cells") (read-integer "rows") (read-integer "cols") (read-integer "frames") (read-msg "intervals") (read-msg "account")  (read-msg "supply") (read-keyset "accountKeyset"))`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: `${contractModules.colorblock}.MINT`,
          args: [id, account]
        }
      }, {
        role: 'Pay Gas',
        description: 'Pay Gas',
        cap: {
          name: 'coin.GAS',
          args: []
        }
      }
      ],
      sender: account,
      signingPubKey: account,
      data: {
        id,
        title,
        tags,
        description,
        cells,
        rows,
        cols,
        frames: frameCnt,
        intervals,
        supply: supplyNumber,
        account,
        accountKeyset: { 
          keys: [account],
          pred: 'keys-all'
        }
      }
    };
    const signedCmd = await getSignedCmd(cmd);
    console.log('get signedCmd', signedCmd);
    const result = await fetch(`${serverUrl}/item`, signedCmd).then(res => res.json());
    console.log('get result', result);
    if (result.status === 'success') {
      document.location.href = '/item/' + id;
    } else {
      alert(result.message);
    }
  };

  const saveProject = () => {
    const state = {
      creator: {
        frames,
        palette
      }
    };
    saveStateToCookies(state, 'creator');
  };

  // load pickr after DOM loaded
  useEffect(() => {
    const newPickr = Pickr.create({
      el: '.pickr',
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
        dpt.changePaletteColor(color);
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
  }, [dpt]);

  return (
    <div>
      <div data-role='creator body' className='w-11/12 mx-auto'>
        <div data-role='frame list container' className='flex h-20 mb-6'>
          <div data-role='button to append frame'>
            <button className='h-full bg-gray-800 text-white w-7 border-b-4 border-gray-400 rounded' onClick={ () => dpt.addFrame() }>
              +
            </button>
          </div>
          <div className='ml-3 w-full bg-gray-200 flex'>
            {
              frames.frameIds.map((frameId) => (
                <div data-role='preview box with buttons' className='w-16 mr-4 mt-1.5' key={frameId}>
                  <div data-role='top part of preview box' className={'flex justify-between bg-gray-100 border '.concat(frameId === frames.activeId ? 'border-red-500' : 'border-black')} onClick={ () => dpt.setActiveFrameId(frameId) }>
                    <div style={{ height: `${previewSizeXS.height}rem`, width: `${previewSizeXS.width}rem` }}>
                      <Preview
                        task={{
                          type: 'single',
                          frames,
                          frameId
                        }} 
                      />
                    </div>
                    <div>
                      <button className='block w-5 h-5 text-white m-0 bg-gray-400' onClick={ (e) => { e.stopPropagation(); dpt.deleteFrame(frameId); } } disabled={frames.frameIds.length === 1}>
                        <div className='flex justify-items-center'>
                          <FontAwesomeIcon icon={fa.faTrashAlt} size='xs' />
                        </div>
                      </button>
                      <button className='block w-5 h-5 text-white mt-2 bg-gray-400' onClick={ (e) => { e.stopPropagation(); dpt.duplicateFrame(frameId) } }>
                        <div className='flex justify-items-center'>
                          <FontAwesomeIcon icon={fa.faCopy} size='xs' />
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
              <button 
                className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'
                onClick={ () => dpt.newProject() }
              >
                NEW
              </button>
            </div>
            <div className='flex justify-between mt-1'>
              <div className='w-1/2 pr-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>LOAD</button>
              </div>
              <div className='w-1/2 pl-1'>
                <button 
                  className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'
                  onClick={ () => saveProject() } 
                >
                  SAVE
                </button>
              </div>
            </div>
            <div className='flex justify-between mt-4'>
              <div className='w-1/2 pr-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded' onClick={ () => dpt.undo() }>
                  <FontAwesomeIcon icon={fa.faUndo} />
                </button>
              </div>
              <div className='w-1/2 pl-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded' onClick={ () => dpt.redo() }>
                  <FontAwesomeIcon icon={fa.faRedo} />
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
                <div className='pickr'></div>
              </div>
            </div>
            <div data-role='painting tools' className='flex flex-wrap mt-5 text-xl'>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'bucket' ? 'selected' : '')} onClick={ () => clickPaletteTool('bucket') }><FontAwesomeIcon icon={fa.faFillDrip} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'picker' ? 'selected' : '')} onClick={ () => clickPaletteTool('picker') }><FontAwesomeIcon icon={fa.faEyeDropper} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(pickr && pickr.isShown ? 'selected' : '')} onClick={ () => clickPaletteTool('brush') }><FontAwesomeIcon icon={fa.faPaintBrush} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'eraser' ? 'selected' : '')} onClick={ () => clickPaletteTool('eraser') }><FontAwesomeIcon icon={fa.faEraser} /></div>
              <div className={'w-1/3 text-center py-1 mb-1 '.concat(palette.toolType === 'move' ? 'selected' : '')} onClick={ () => clickPaletteTool('move') }><FontAwesomeIcon icon={fa.faArrowsAlt} /></div>
            </div>
            <div data-role='palette' className='flex flex-wrap h-40 mt-5 leading-none'>
              {
                palette.colors.map((color, index) => (
                  <div 
                    className={'w-1/6 px-0.5 pt-0.5 '.concat(index === palette.selectedIndex ? 'border-4 border-gray-500' : '')}
                    onClick={ () => clickPaletteColor(index) }
                    key={index}
                  >
                    <div className='w-full square' style={{ backgroundColor: color }}></div>
                  </div>
                ))
              }
            </div>
            <div className='mt-2'>
              <button className='w-full bg-gray-400 border-b-4 border-gray-100 py-2 rounded' onClick={ () => clickUpload() }>UPLOAD</button>
            </div>
            <div className='mt-2'>
              <button className='w-full bg-red-800 text-white border-b-4 border-red-400 py-1 rounded'><FontAwesomeIcon icon={fa.faDownload} /></button>
            </div>
            <div className='flex justify-between mt-2'>
              <div className='w-1/2 pr-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'><FontAwesomeIcon icon={fa.faQuestion} /></button>
              </div>
              <div className='w-1/2 pl-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'><FontAwesomeIcon icon={fa.faKeyboard} /></button>
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
                      onMouseOver={ () => dpt.setHoveredIndex(index) }
                      onClick={ () => clickGridCell(index, color) }
                      key={index}
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
                    <FontAwesomeIcon icon={ isPreviewStatic ? fa.faPlay : fa.faPause } size='xs' />
                  </div>
                </button>
              </div>
              <div className='w-1/3 mx-0.5'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 rounded' onClick={ () => setIsPreviewLarge(!isPreviewLarge) }>
                  <div className='relative -top-0.5'>
                    <FontAwesomeIcon icon={fa.faCompress} size='xs' />
                  </div>
                </button>
              </div>
              <div className='w-1/3 mx-0.5'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 rounded' onClick={ () => setIsModalOpen(!isModalOpen) }>
                  <div className='relative -top-0.5'>
                    <FontAwesomeIcon icon={fa.faPhotoVideo} size='xs' />
                  </div>
                </button>
              </div>
            </div>
            <div className={`my-5 bg-gray-100 h-${isPreviewLarge ? 24 : 12}`}>
              <div 
                className='mx-auto'
                style={{ 
                  width: `${isPreviewLarge ? previewSizeLG.width : previewSizeSM.width}rem`,
                  height: `${isPreviewLarge ? previewSizeLG.height : previewSizeSM.height}rem`
                }}
              >
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
            <div>
              <button onClick={ () => dpt.resetFrame(frames.activeId) } className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>RESET</button>
            </div>
            <div className='flex mt-5'>
              <div className='w-1/3 text-4xl text-center pr-1 py-1'>
                <FontAwesomeIcon icon={fa.faArrowsAltH} />
              </div>
              <div className='w-2/3 flex border-2 border-gray-400'>
                <input value={frames.width} className='w-1/2 text-center' onChange={()=>{}} disabled />
                <div className='w-1/2'>
                  <button className='block w-full text-center bg-gray-800 text-white border-b border-gray-400' onClick={ () => dpt.appendCol() }>
                    +
                  </button>
                  <button className='block w-full text-center bg-gray-800 text-white' onClick={ () => dpt.deleteCol() }>
                    -
                  </button>
                </div>
              </div>
            </div>
            <div className='flex mt-5'>
              <div className='w-1/3 text-4xl text-center pr-1 py-1'>
                <FontAwesomeIcon icon={fa.faArrowsAltV} />
              </div>
              <div className='w-2/3 flex border-2 border-gray-400'>
                <input value={frames.height} className='w-1/2 text-center' onChange={()=>{}} disabled />
                <div className='w-1/2'>
                  <button className='block w-full text-center bg-gray-800 text-white border-b border-gray-400' onClick={ () => dpt.appendRow() }>
                    +
                  </button>
                  <button className='block w-full text-center bg-gray-800 text-white' onClick={ () => dpt.deleteRow() }>
                    -
                  </button>
                </div>
              </div>
            </div>
            <div className='mt-5 border-2 border-gray-400'>
              <label className='block text-center w-full bg-gray-800 text-white'>Duration</label>
              <input type='number' step='0.01' value={frames.duration} onChange={ (e) => dpt.setDuration(e.target.value) } className='block text-center w-full bg-gray-600 text-white' />
            </div>
            { frames.hoveredIndex && 
            <div className='mt-5 text-center'>
                {Math.floor(frames.hoveredIndex / frames.width) + 1},{frames.hoveredIndex % frames.width + 1} 
            </div>
            }
          </div>
        </div>
      </div>
      { isModalOpen && 
      <div data-role='creator modal' className='absolute top-0 w-full z-50 bg-white bg-opacity-90'>
        <div className='relative mt-20 w-5/6 pb-20 mx-auto border border-red-500 bg-white'>
          <button data-role='modal exit' className='absolute right-4 top-3' onClick={ () => setIsModalOpen(false) }>
            <FontAwesomeIcon icon={fa.faTimes} />
          </button>
          <div data-role='upload subpage'>
            <div data-role='image type selection' className='w-1/4 mx-auto mt-20 flex text-lg space-x-5 content-center'>
              <label className={'px-4 py-2 '.concat(isPreviewStatic ? 'selected' : '')} onClick={ () => setIsPreviewStatic(true) }>single</label>
              <label className={'px-4 py-2 '.concat(isPreviewStatic ? '' : 'selected')} onClick={ () => setIsPreviewStatic(false) }>animation</label>
            </div>
            <div data-role='item submit board' className='mt-10 flex'>
              <div data-role='preview' className='w-1/2'>
                <div 
                  className='mx-auto'
                  style={{ 
                    width: `${previewSizeXL.width}rem`,
                    height: `${previewSizeXL.height}rem`
                  }}
                >
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
              <div data-role='item submit' className='w-1/3' onSubmit={ (e) => submitItem(e) }>
                <label className='my-1 w-full'>Title</label>
                <input 
                  type='text' 
                  className='border border-black w-full' 
                  onChange={ (e) => setSubmitItem({...submitItem, title: e.target.value}) } 
                />
                <label className='my-1 w-full'>Description</label>
                <input 
                  type='text' 
                  className='border border-black w-full' 
                  onChange={ (e) => setSubmitItem({...submitItem, description: e.target.value}) } 
                />
                <label className='my-1 w-full'>Tags - separated by comma</label>
                <input 
                  type='text' 
                  className='border border-black w-full' 
                  onChange={ (e) => setSubmitItem({...submitItem, tags: e.target.value}) } 
                />
                <label className='my-1 w-full'>Supply - totol amount of tokens</label>
                <input 
                  type='number'
                  min='1'
                  pattern='[0-9]{1,}'
                  className='border border-black w-full' 
                  onChange={ (e) => setSubmitItem({...submitItem, supply: e.target.value}) } 
                />
                <button className='mt-8 bg-red-500 text-white w-2/3 py-1 px-3' onClick={ () => onSubmitItem() }>
                  Get signed from wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      }
    </div>
  );
};

CreatePage.propTypes = {
  palette: PropTypes.object.isRequired,
  frames: PropTypes.object.isRequired,
  dpt: PropTypes.object.isRequired,
  wallet: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  frames: state.creator.present.frames,
  palette: state.creator.present.palette,
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
  dpt: {
    ...bindActionCreators(actions, dispatch),
    undo: () => dispatch(ActionCreators.undo()),
    redo: () => dispatch(ActionCreators.redo())
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(CreatePage);
