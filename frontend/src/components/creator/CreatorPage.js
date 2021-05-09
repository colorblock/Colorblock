import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Header from '../layout/Header';
import Preview from './Preview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFillDrip, faEyeDropper, faPaintBrush, faEraser, faArrowsAlt, faDownload, 
  faQuestion, faKeyboard, faPlay, faPause, faCompress, faPhotoVideo, faTrashAlt, 
  faCopy, faArrowsAltH, faArrowsAltV
} from '@fortawesome/free-solid-svg-icons';
import { setActiveFrameId } from '../../store/actions/actionCreator';

export const CreatePage = (props) => {
  const { palette, frames } = props;
  const { setActiveFrameId } = props;

  const [isPreviewStatic, setIsPreviewStatic] = useState(true);  // whether preview box is showing static frame or not. true: static, false: animation
  
  const widthPct = `${100.0 / frames.width}%`;
  const previewMinHeight = 1.5;

  return (
    <div>
      <Header />
      <div data-role='creator body' className='w-11/12 mx-auto'>
        <div data-role='frame list container' className='flex h-20 mb-6'>
          <div data-role='button to append frame'>
            <button className='h-full bg-gray-800 text-white w-7 border-b-4 border-gray-400 rounded'>
              +
            </button>
          </div>
          <div className='ml-3 w-full bg-gray-200 flex'>
            {
              frames.frameIds.map((frameId) => (
                <div data-role='preview box with buttons' className='w-16 mr-4 mt-1.5' onClick={ () => setActiveFrameId(frameId) } key={frameId}>
                  <div data-role='top part of preview box' className='flex justify-between bg-gray-100 border border-red-500'>
                    <div style={{ height: `${previewMinHeight}rem`, width: `${frames.width / frames.height * previewMinHeight}rem` }}>
                      <Preview
                        task={{
                          type: 'single',
                          frames,
                          frameId
                        }} 
                      />
                    </div>
                    <div>
                      <button className='block w-5 h-5 text-white m-0 bg-gray-400'>
                        <div className='relative -top-1'>
                          <FontAwesomeIcon icon={faTrashAlt} size='xs' />
                        </div>
                      </button>
                      <button className='block w-5 h-5 text-white mt-2 bg-gray-400'>
                        <div className='relative -top-1'>
                          <FontAwesomeIcon icon={faCopy} size='xs' />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div data-role='bottom part of preview box'>
                    <input value={ frames.frameList[frameId].interval } className='w-full h-5 bg-gray-400 text-center align-top py-0.5 text-white border border-t-0 border-red-500' />
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
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>UNDO</button>
              </div>
              <div className='w-1/2 pl-1'>
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>REDO</button>
              </div>
            </div>
            <div data-role='painting tools' className='flex flex-wrap text-xl'>
              <button className='w-1/3 pt-3'><FontAwesomeIcon icon={faFillDrip} /></button>
              <button className='w-1/3 pt-3'><FontAwesomeIcon icon={faEyeDropper} /></button>
              <button className='w-1/3 pt-3'><FontAwesomeIcon icon={faPaintBrush} /></button>
              <button className='w-1/3 pt-3'><FontAwesomeIcon icon={faEraser} /></button>
              <button className='w-1/3 pt-3'><FontAwesomeIcon icon={faArrowsAlt} /></button>
            </div>
            <div data-role='palette' className='flex flex-wrap h-40 mt-5 leading-none'>
              {
                palette.colors.map((color) => (
                  <div className='w-1/6 px-0.5 pt-0.5'><div className='w-full square' style={{ backgroundColor: color }}></div></div>
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
            <div className='flex flex-wrap w-3/4 mx-auto'>
              {
                frames.frameList[frames.activeId].cells.map((color) => (
                  <div className='pl-0.5 pt-0.5' style={{ width: widthPct }}><div className='w-full square' style={{ backgroundColor: color }}></div></div>
                ))
              }
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
                <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 rounded'>
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
              <div className='w-1/2 mx-auto my-5'>
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
              <button className='w-full bg-gray-800 text-white border-b-4 border-gray-400 py-1 rounded'>RESET</button>
            </div>
            <div className='flex mt-5'>
              <div className='w-1/3 text-4xl text-center pr-1 py-1'>
                <FontAwesomeIcon icon={faArrowsAltH} />
              </div>
              <div className='w-2/3 flex border-2 border-gray-400'>
                <input value='16' className='w-1/2 text-center' />
                <div className='w-1/2'>
                  <button className='block w-full text-center bg-gray-800 text-white border-b border-gray-400'>+</button>
                  <button className='block w-full text-center bg-gray-800 text-white'>-</button>
                </div>
              </div>
            </div>
            <div className='flex mt-5'>
              <div className='w-1/3 text-4xl text-center pr-1 py-1'>
                <FontAwesomeIcon icon={faArrowsAltV} />
              </div>
              <div className='w-2/3 flex border-2 border-gray-400'>
                <input value='16' className='w-1/2 text-center' />
                <div className='w-1/2'>
                  <button className='block w-full text-center bg-gray-800 text-white border-b border-gray-400'>+</button>
                  <button className='block w-full text-center bg-gray-800 text-white'>-</button>
                </div>
              </div>
            </div>
            <div className='mt-5 border-2 border-gray-400'>
              <label className='block text-center w-full bg-gray-800 text-white'>Pixel Size</label>
              <input value='10' className='block text-center w-full bg-gray-600 text-white' />
            </div>
            <div className='mt-5 border-2 border-gray-400'>
              <label className='block text-center w-full bg-gray-800 text-white'>Duration</label>
              <input value='1' className='block text-center w-full bg-gray-600 text-white' />
            </div>
            <div className='mt-5 text-center'>
              1,9
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
  frames: state.creator.frames,
  palette: state.creator.palette
});

const mapDispatchToProps = dispatch => ({
  setActiveFrameId: (activeId) => dispatch(setActiveFrameId(activeId))
});

export default connect(mapStateToProps, mapDispatchToProps)(CreatePage);
