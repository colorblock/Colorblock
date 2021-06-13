import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from 'redux-undo';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import Preview from '../common/Preview';
import PixelTool from '../common/PixelTool';
import * as actions from '../../store/actions/actionCreator';
import { convertFramesToString, convertFramesToIntervals, convertRgbaToHex } from '../../utils/render';
import { getSignedCmd, mkReq } from '../../utils/sign';
import { serverUrl, itemConfig, contractModules, collectionConfig } from '../../config';
import exampleFrames from '../../assets/exampleFrames';
import { randomId, toAmountPrecision, toPricePrecision } from '../../utils/tool';

const CreatePage = (props) => {
  const { frames, palette, dpt, wallet } = props;  // dpt means dispatch

  const [projects, setProjects] = useState(null);
  const [isPreviewStatic, setIsPreviewStatic] = useState(true);  // whether preview box is showing static frame or not. true: static, false: animation
  const [modalState, setModalState] = useState([false, '']);     // first value is open or not, second is type
  const [submitItem, setSubmitItem] = useState({});
  const [pickr, setPickr] = useState(null);
  const [tabType, setTabType] = useState('collection');
  const [onSale, setOnSale] = useState(false);
  const [collections, setCollections] = useState([]);
  const [mintedFrames, setMintedFrames] = useState(null);
  const [moveStartIndex, setMoveStartIndex] = useState(null);

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
      toast.error('llegal interval!');
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
    if (palette.toolType !== 'bucket' && palette.toolType !== 'pencil') {
      dpt.changeToolType('pencil');
    }
  };

  // function when clicking left palette tool board
  const clickPaletteTool = (toolType) => {
    dpt.changeToolType(toolType);
  
    // do some detailed actions
    if (toolType === 'brush') {
      openPickr();
    } else if (toolType !== 'pencil' && toolType !== 'bucket') {
      dpt.selectPaletteColor(-1);
    }
  };

  // function when clicking center painting board
  const clickGridCell = (cellIndex, cellColor) => {
    switch (palette.toolType) {
      case 'pencil':
        dpt.drawWithPencil(cellIndex, palette.colors[palette.selectedIndex]);
        dpt.changePaletteColor(palette.colors[palette.selectedIndex], true);
        return;
      case 'bucket':
        dpt.drawWithBucket(cellIndex, palette.colors[palette.selectedIndex]);
        dpt.changePaletteColor(palette.colors[palette.selectedIndex], true);
        return;
      case 'eyedrop':
        const colorIndex = palette.colors.indexOf(cellColor);
        if (colorIndex >= 0) {
          dpt.selectPaletteColor(colorIndex);
        } else {
          dpt.changePaletteColor(cellColor, false);
        }
        return;
      case 'eraser':
        dpt.drawWithEraser(cellIndex);
        return;
      default:
    }
  };

  const onSubmitItem = async () => {
    const savedFrames = tabType === 'mint' ? mintedFrames : frames;
    if (!wallet.address) {
      toast.error('Please connect to wallet first');
      return;
    }
    const { title, description } = submitItem;
    const tags = submitItem.tags ? submitItem.tags.split(',').map(v => v.trim()) : '';
    if (!title) {
      toast.error('Title cannot be empty');
      return;
    }
    if (!submitItem.supply) {
      toast.error('Please input correct supply');
      return;
    }

    const collection = collections.length > 0 ? collections.filter(clt => clt.selected)[0] : {};

    // validate supply
    const supplyNumber = parseFloat(submitItem.supply);
    if (isNaN(supplyNumber)) {
      toast.error(`supply is expected as a number`);
      return;
    } else if (supplyNumber !== Math.floor(supplyNumber)) {
      toast.error('supply is expected as an integer');
      return;
    }
    const supply = toAmountPrecision(supplyNumber);
    if (supply < itemConfig.minSupply || supply > itemConfig.maxSupply) {
      toast.error(`supply must in ${itemConfig.minSupply} ~ ${itemConfig.maxSupply}`);
      return;
    }

    const colors = convertFramesToString(savedFrames);
    
    // get hash id
    const hashCmd = mkReq({'to_hash': colors})
    const id = await fetch(`${serverUrl}/tool/hash`, hashCmd).then(res => res.text());

    const rows = savedFrames.height;
    const cols = savedFrames.width;
    const frameCnt = savedFrames.frameIds.length;
    const intervals = convertFramesToIntervals(savedFrames);
    const account = wallet.address;
    const cmd = {
      code: `(${contractModules.colorblock}.create-item (read-msg "id") (read-msg "title") (read-msg "colors") (read-integer "rows") (read-integer "cols") (read-integer "frames") (read-msg "intervals") (read-msg "account")  (read-decimal "supply") (read-keyset "accountKeyset"))`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: `${contractModules.colorblock}.MINT`,
          args: [id, account, supply]
        }
      }, {
        role: 'Pay Gas',
        description: 'Pay Gas',
        cap: {
          name: `${contractModules.colorblockGasStation}.GAS_PAYER`,
          args: ['colorblock-gas', {int: 1.0}, 1.0]
        }
      }
      ],
      sender: contractModules.gasPayerAccount,
      signingPubKey: account,
      data: {
        id,
        title,
        colors,
        rows,
        cols,
        frames: frameCnt,
        intervals,
        supply,
        account,
        accountKeyset: { 
          keys: [account],
          pred: 'keys-all'
        }
      }
    };
    if (onSale) {
      // if item is directly posted into market, then add release action
      if (!submitItem.price) {
        toast.error('Please input correct listing price');
        return;
      }
      if (!submitItem.saleAmount) {
        toast.error('Please input correct listing quantity');
        return;
      }
      const price = toPricePrecision(parseFloat(submitItem.price));
      const saleAmount = toAmountPrecision(parseFloat(submitItem.saleAmount));
      const releaseCmd = {
        code: `(${contractModules.colorblockMarket}.release (read-msg "id") (read-msg "account") (read-decimal "price") (read-decimal "amount"))`,
        caps: [{
          role: 'Transfer',
          description: 'Transfer item to market pool',
          cap: {
            name: `${contractModules.colorblock}.TRANSFER`,
            args: [id, account, contractModules.marketPoolAccount, saleAmount]
          }
        }],
        data: {
          price,
          amount: saleAmount
        }
      };
      cmd.code += releaseCmd.code;
      cmd.caps = [...cmd.caps, ...releaseCmd.caps];
      cmd.data = {...cmd.data, ...releaseCmd.data};
    }
    const postData = {
      tags,
      description,
      collection
    };
    const signedCmd = await getSignedCmd(cmd, postData);

    console.log('get signedCmd', signedCmd);
    if (!signedCmd) {
      return;
    }
    const result = await fetch(`${serverUrl}/item`, signedCmd).then(res => res.json());
    console.log('get result', result);
    if (result.status === 'success') {
      document.location.href = '/item/' + id;
    } else {
      toast.error(result.data);
    }
  };

  const handleMove = (e, cellIndex) => {
    // start calc if mouseDown + moveTool
    if (moveStartIndex && palette.toolType == 'move') {
      // if same index, skip
      if (cellIndex !== moveStartIndex) {
        dpt.drawWithMove(moveStartIndex, cellIndex);
        // reset start point
        setMoveStartIndex(cellIndex);
      }
    }
    e.preventDefault();
  };

  const saveProject = () => {
    const state = {
      creator: {
        frames,
        palette
      }
    };
    // todo: send to server
  };

  const newCollection = () => {
    return {
      id: randomId(collectionConfig.lengthOfId),
      title: 'Input Your Collection Title',
      user_id: wallet.address,
      collectibles: [],
      isNew: true,
      hasModified: false
    };
  };

  const getCollectionTitle = () => {
    const selectedTitles = collections.filter(clt => clt.selected === true).map(clt => clt.title);
    return selectedTitles.length > 0 ? selectedTitles[0] : 'No Collection';
  };

  const syncCollections = async () => {
    const postData = collections;
    const url = `${serverUrl}/collection`;
    const result = await fetch(url, mkReq(postData)).then(res => res.json());
    if (result.status === 'success') {
      toast.success('sync successfully');
    } else {
      toast.error(result.data);
    }
  };

  const getItemSettingBoard = () => {
    return (
      <div data-role='item settings' className='pl-6 w-full flex flex-col bg-white border-l text-sm'>
        <div>
          <input 
            placeholder='Input title here...'
            className='border-b pb-1'
            onChange={ (e) => setSubmitItem({...submitItem, title: e.target.value}) } 
          />
        </div>
        <div className='mt-4 text-xs'>
          <p className='my-2'>Collection</p>
          <div data-role='collection select' className='relative h-8'>
            <select 
              className='w-full h-full px-10 border rounded-lg cursor-pointer'
              onChange={(e) => setCollections(collections.map((clt, index) => index === e.target.selectedIndex ? {
                  ...clt,
                  selected: true
                } : {
                  ...clt,
                  selected: false
                }
              ))}
            >
              {
                collections.length > 0 ?
                collections.map(collection => (
                  <option 
                    className='text-center mx-auto'
                    selected={collection.selected === true}
                  >
                    {collection.title}
                  </option>
                )) :
                <option className='text-center mx-auto'>{getCollectionTitle()}</option>
              }
            </select>
            <div className='absolute top-0 right-6 mx-2 text-gray-300 h-full flex items-center'>
              <FontAwesomeIcon icon={fa.faCaretDown} />
            </div>
          </div>
        </div>
        <div className='mt-4 text-xs'>
          <div className='flex justify-between items-end'>
            <span className='my-2'>Description</span>
            <span className='my-2 text-gray-400'>300 characters max</span>
          </div>
          <textarea 
            rows='4' 
            className='w-full border rounded-lg p-2'
            onChange={ (e) => setSubmitItem({...submitItem, description: e.target.value}) } 
          >
          </textarea>
        </div>
        <div className='border-b my-5'></div>
        <div>
          <input 
            type='number'
            pattern='[0-9]{1,}'
            placeholder='Total supply:' 
            className='w-full border rounded p-2'
            onChange={ (e) => setSubmitItem({...submitItem, supply: e.target.value}) }
          />
        </div>
        <div className='text-xs flex items-center my-5'>
          <span className='mr-5'>For Sale</span>
          <label className='switch relative'>
            <input type='checkbox' onChange={ () => setOnSale(!onSale) } />
            <span className='slider round'></span>
          </label>
        </div>
        {
          onSale &&
          <div className='text-xs'>
            <div className='relative mb-4'>
              <input 
                type='number'
                placeholder='Listing price:' 
                className='w-full h-8 border rounded p-2'
                onChange={ (e) => setSubmitItem({...submitItem, price: parseFloat(e.target.value)}) } 
              />
              <div className='absolute h-8 top-0 right-3 flex items-center'>
                KDA
              </div>
            </div>
            <input 
              type='number'
              pattern='[0-9]{1,}'
              placeholder='Listing quantity:' 
              className='w-full border rounded p-2'
              onChange={ (e) => setSubmitItem({...submitItem, saleAmount: parseFloat(e.target.value)}) }
            />
          </div>
        }
        <div className='flex justify-between'>
          <button className='mt-4 bg-red-500 text-white py-1 px-3 w-5/12 rounded'>
            Save
          </button>
          <button className='mt-4 bg-red-500 text-white py-1 px-3 w-5/12 rounded' onClick={ () => onSubmitItem() }>
            Deploy
          </button>
        </div>
      </div>
    );
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
        dpt.changePaletteColor(color, false);
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

    const fetchProjects = async () => {
      // if there's no project from server, then load examples
      const url = `${serverUrl}/user/projects`;
      const projects = await fetch(url, mkReq()).then(res => res.json());
      if (projects.length > 0) {
        projects.forEach(project => {
          project.frames = JSON.parse(project.frames);
        });
        const frames = projects[0].frames;
        dpt.loadProject(frames);
        setProjects(projects);
      } else {
        dpt.loadProject(exampleFrames);
      }
    };

    const fetchCollections = async () => {
      if (wallet.address) {
        const url = `${serverUrl}/collection/owned-by/${wallet.address}`;
        const collections = await fetch(url).then(res => res.json());
        setCollections(collections);
      }
    };

    setPickr(newPickr);
    fetchProjects();
    fetchCollections();
  }, [dpt]);

  return (
    <div>
      <div data-role='creator body' className='bg-cb-gray'>
        <div data-role='tabs at top' className='h-10 border-b flex items-end space-x-10 text-sm mb-5'>
          <button className={`ml-16 px-3 py-2 ${tabType === 'collection' ? 'selected' : ''}`} onClick={ () => setTabType('collection') }>Collection</button>
          <button className={`px-3 py-2 ${tabType === 'design' ? 'selected' : ''}`} onClick={ () => setTabType('design') }>Design</button>
          <button className={`px-3 py-2 ${tabType === 'mint' ? 'selected' : ''}`} onClick={ () => setTabType('mint') }>Mint</button>
        </div>
        <div data-role='collection tab' className={`flex flex-col items-center justify-center w-1/3 mx-auto text-sm ${tabType === 'collection' ? '' : 'hidden'}`}>
          <p className='text-lg'>Select Collection</p>
          <div 
            className='w-full my-3 relative text-gray-300 hover-pink hover:text-pink-500 cursor-pointer'
            onClick={ () => setTabType('design') }
          >
            <input 
              value={getCollectionTitle()}
              disabled
              className='w-full py-2 text-center bg-white text-gray-500 border rounded cursor-pointer'
            />
            <div className='absolute top-0 left-1/2 ml-24 h-full flex items-center'>
              <FontAwesomeIcon icon={fa.faCaretRight} />
            </div>
          </div>
          <div className='w-4/5 mx-auto border-b my-2'></div>
          <div className='text-sm my-2'>
            Your Collections
          </div>
          {
            collections.map((collection, index) => (
              <div 
                className='w-full relative'
                onClick={ () => setCollections(collections.map((clt, _index) => _index === index ? {
                    ...clt,
                    selected: true
                  } : {
                    ...clt,
                    selected: false
                  }
                ))}
              >
                <input 
                  value={collection.isNew && !collection.hasModified ? '' : collection.title}
                  placeholder={collection.isNew ? collection.title : ''}
                  disabled={collection.isNew ? false : true}
                  className='w-full py-3 text-left px-4 my-2 bg-white border rounded hover-pink'
                  onChange={ (e) => setCollections(collections.map((clt, _index) => _index === index ? {
                      ...clt,
                      title: e.target.value,
                      hasModified: true,
                      selected: true
                    } : {
                      ...clt,
                      selected: false
                    }
                  ))}
                />
                <div className='absolute top-0 right-4 ml-16 text-gray-300 h-full flex items-center'>
                  {collection.collectibles.length} Colletibles
                </div>
                <div 
                  className='absolute top-0 -right-8 text-gray-300 h-full flex items-center hover:text-pink-500 cursor-pointer'
                  onClick={ () => setCollections(collections.filter((clt, _index) => _index !== index)) }
                >
                  <FontAwesomeIcon icon={fa.faTimes} />
                </div>
              </div>
            ))
          }
          <button 
            className='w-full my-4 rounded bg-gray-100 py-3'
            onClick={ () => setCollections([...collections, newCollection()]) }
          >
            New Collections +
          </button>
          <button 
            className='w-full my-4 rounded bg-cb-pink text-white py-3'
            onClick={ () => syncCollections() }
          >
            Update collection onto Server
          </button>
        </div>
        <div data-role='create tab' className={`flex ${tabType === 'design' ? '' : 'hidden'}`}>
          <div data-role='creator primary tools on the left side' className='w-48 ml-12'>
            <div data-role='painting tools' className='flex flex-col py-4 space-y-3 border rounded bg-white text-gray-500'>
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
              <div className='flex justify-between space-x-3 px-5'>
                <div 
                  className={`w-10 h-10 flex justify-center items-center border rounded-lg bg-cb-gray cursor-pointer ${palette.toolType === 'pencil' ? 'selected' : ''}`} 
                  onClick={ () => clickPaletteTool('pencil') }
                >
                  <img src='/img/tool_pencil.svg' alt='pencil' className='w-10 h-10' />
                </div>
                <div 
                  className={`w-10 h-10 flex justify-center items-center border rounded-lg bg-cb-gray cursor-pointer ${palette.toolType === 'eraser' ? 'selected' : ''}`} 
                  onClick={ () => clickPaletteTool('eraser') }
                >
                  <img src='/img/tool_eraser.svg' alt='eraser' className='w-10 h-10' />
                </div>
                <div 
                  className={`w-10 h-10 flex justify-center items-center cursor-pointer ${palette.toolType === 'bucket' ? 'selected' : ''}`} 
                  onClick={ () => clickPaletteTool('bucket') }
                >
                  <img src='/img/tool_bucket.svg' alt='bucket' className='w-10 h-10' />
                </div>
              </div>
              <div className='flex justify-between space-x-3 px-5'>
                <div 
                  className={`w-10 h-10 flex justify-center items-center border rounded-lg bg-cb-gray cursor-pointer ${pickr && pickr.isShown ? 'selected' : ''}`} 
                  onClick={ () => clickPaletteTool('brush') }
                >
                  <img src='/img/tool_brush.svg' alt='brush' className='w-10 h-10' />
                </div>
                <div 
                  className={`w-10 h-10 flex justify-center items-center border rounded-lg bg-cb-gray cursor-pointer ${palette.toolType === 'eyedrop' ? 'selected' : ''}`} 
                  onClick={ () => clickPaletteTool('eyedrop') }
                >
                  <img src='/img/tool_eyedrop.svg' alt='eyedrop' className='w-10 h-10' />
                </div>
                <div 
                  className={`w-10 h-10 flex justify-center items-center border rounded-lg bg-cb-gray cursor-pointer ${palette.toolType === 'move' ? 'selected' : ''}`} 
                  onClick={ () => clickPaletteTool('move') }
                >
                  <img src='/img/tool_move.svg' alt='move' className='w-10 h-10' />
                </div>
              </div>
            </div>
            <div data-role='palette' className='pt-5 pb-2 px-4 mt-6 border rounded bg-white'>
              <div className='flex flex-wrap justify-between'>
                {
                  palette.colors.map((color, index) => (
                    index < 30 ? 
                    <div
                      className='mx-1 my-0.5'
                      onClick={ () => clickPaletteColor(index) }
                      key={index}
                    >
                      <button 
                        className={`w-4 h-4 ${color === 'rgba(255, 255, 255, 1)' ? 'border' : 'border-0'} rounded ${index === palette.selectedIndex ? 'ring' : ''}`} 
                        style={{ backgroundColor: color }}
                      ></button>
                    </div> : <></>
                  ))
                }
              </div>
              <p className='mt-1 mb-2 border-t bg-gray-400'></p>
              <div className='flex flex-wrap justify-between'>
                {
                  palette.colors.map((color, index) => (
                    index >= 30 && index < 42 ? 
                    <div
                      className='mx-1 my-0.5'
                      onClick={ () => clickPaletteColor(index) }
                      key={index}
                    >
                      <button 
                        className={`w-4 h-4 ${color === 'rgba(255, 255, 255, 1)' ? 'border' : 'border-0'} rounded ${index === palette.selectedIndex ? 'ring' : ''}`} 
                        style={{ backgroundColor: color }}
                      ></button>
                    </div> : <></>
                  ))
                }
              </div>
              <input 
                value={palette.selectedIndex >= 0 ? convertRgbaToHex(palette.colors[palette.selectedIndex]) : '#FFFFFF'}
                className='w-full text-xs py-1 border-0 rounded bg-gray-200 px-3 tracking-wide my-2'
              />
              <p className='text-gray-500 text-xs mb-1'>Recent</p>
              <div className='flex flex-wrap justify-between'>
                {
                  palette.colors.map((color, index) => (
                    index >= 42 ? 
                    <div
                      className='mx-1 my-0.5'
                      onClick={ () => clickPaletteColor(index) }
                      key={index}
                    >
                      <button 
                        className={`w-4 h-4 ${color === 'rgba(255, 255, 255, 1)' ? 'border' : 'border-0'} rounded ${index === palette.selectedIndex ? 'ring' : ''}`} 
                        style={{ backgroundColor: color }}
                      ></button>
                    </div> : <></>
                  ))
                }
              </div>
            </div>
          </div>

          <div data-role='painting grids of one frame' className='mx-12'>
            <div 
              className='w-120 h-120 flex flex-wrap mx-auto border border-gray-400 rounded' 
              style={{ cursor: palette.toolType === 'move' ? 'not-allowed' : 'cell' }}
              onMouseUp={ () => setMoveStartIndex(null) }
            >
              {
                frames.frameList[frames.activeId].cells.map((color, index) => (
                  <div 
                    className='border border-gray-100' 
                    style={{ 
                      width: widthPct,
                      cursor: palette.toolType === 'move' ? 'move' : 'cell'
                    }}  
                    onMouseOver={ () => dpt.setHoveredIndex(index) }
                    onMouseDown={ () => setMoveStartIndex(index) }
                    onMouseMove={ (e) => handleMove(e, index) }
                    onClick={ () => clickGridCell(index, color) }
                    key={index}
                  >
                    <div className='w-full square' style={{ backgroundColor: color }}></div>
                  </div>
                ))
              }
            </div>
            <div className='relative flex justify-center space-x-10 pt-4'>
              <button data-role='undo button' className='w-6 h-6' onClick={ () => dpt.undo() }>
                <img src='/img/undo.svg' alt='undo' className='w-full h-full' />
              </button>
              <button data-role='redo button' className='w-6 h-6' onClick={ () => dpt.redo() }>
                <img src='/img/redo.svg' alt='redo' className='w-full h-full' />
              </button>
              <div className='absolute top-3 right-0'>
                <input 
                  disabled 
                  value={`${frames.width} x ${frames.height}`}
                  className='border rounded w-24 py-0.5 text-center text-sm text-gray-500' 
                />
              </div>
            </div>
          </div>

          <div data-role='frame list'>
            <div data-role='preview box' className='relative w-20 h-20 border rounded'>
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
              <div className='absolute top-0 left-20 pl-2 w-20 rounded flex flex-col space-y-1'>
                <button onClick={ () => setIsPreviewStatic(!isPreviewStatic) }>
                  <img src='/img/play.svg' alt='play' className='w-6 h-6' />
                </button>
                <button>
                  <img src='/img/settings.svg' alt='settings' className='w-6 h-6' />
                </button>
                <button onClick={ () => dpt.addFrame() }>
                  <img src='/img/add.svg' alt='add' className='w-6 h-6' />
                </button>
              </div>
            </div>
            <div className='border-b border-gray-400 my-2'></div>
            <div data-role='all single frames' className='h-96 flex flex-col overflow-y-auto'>
              {
                frames.frameIds.map((frameId) => (
                  <div 
                    data-role='preview box with buttons' 
                    className={`relative w-20 h-20 mb-4 border rounded ${frameId === frames.activeId ? 'bd-cb-pink' : 'border-gray-400'}`} 
                    key={frameId}
                    onClick={ () => dpt.setActiveFrameId(frameId) }
                  >
                    <Preview
                      task={{
                        type: 'single',
                        frames,
                        frameId
                      }} 
                    />
                    <div className='absolute bottom-0 right-0.5 flex justify-between items-center space-x-1 py-1'>
                      <button className='w-4 h-4 p-1 bg-white rounded' onClick={ (e) => { e.stopPropagation(); dpt.duplicateFrame(frameId) } }>
                        <img src='/img/duplicate.svg' alt='duplicate' className='w-full h-full' />
                      </button>
                      <button className='w-4 h-4 p-1 bg-white rounded' onClick={ (e) => { e.stopPropagation(); dpt.deleteFrame(frameId); } } disabled={frames.frameIds.length === 1}>
                      <img src='/img/trash.svg' alt='trash' className='w-full h-full' />
                      </button>
                    </div>
                    <input 
                      type='number' 
                      step='1' 
                      value={ frames.frameList[frameId].interval } 
                      onChange={ (e) => onSetFrameInterval(e, frameId) } 
                      className='absolute bottom-1 left-1 w-6 text-center text-xs text-gray-700 bg-white rounded'
                      disabled={frameId === frames.frameIds.length - 1}
                    />
                  </div>
                ))
              }
            </div>
          </div>
          <div className='pl-16 w-full'>
            {getItemSettingBoard()}
          </div>
            
        </div>

        <div data-role='mint tab' className={`flex ${tabType === 'mint' ? '' : 'hidden'}`}>
          <div className='w-3/4'>
            <PixelTool 
              closeTab={ () => setTabType('design') }
              saveFrames={ (frames) => setMintedFrames(frames) } 
            />
          </div>
          <div className='w-1/4'>
            {getItemSettingBoard()}
          </div>
        </div>

      </div>
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
