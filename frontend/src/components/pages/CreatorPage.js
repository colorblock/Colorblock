import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from 'redux-undo';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Pact from 'pact-lang-api';

import Preview from '../common/Preview';
import PixelTool from '../common/PixelTool';
import * as actions from '../../store/actions/actionCreator';
import * as types from '../../store/actions/actionTypes';
import { convertFramesToString, convertFramesToIntervals, convertRgbaToHex } from '../../utils/render';
import { mkReq } from '../../utils/sign';
import { serverUrl, itemConfig, contractModules, collectionConfig, creatorConfig, editorExtensionId } from '../../config';
import { fetchListen, fetchLocal, fetchSend, getSendCmd } from '../../utils/chainweb';
import exampleFrames from '../../assets/exampleFrames';
import { randomId, toAmountPrecision, toPricePrecision } from '../../utils/tools';

/* global chrome */

const CreatePage = (props) => {
  const { frames, palette, dpt, wallet, loading } = props;  // dpt means dispatch

  const [projects, setProjects] = useState([]);
  const [isPreviewStatic, setIsPreviewStatic] = useState(true);  // whether preview box is showing static frame or not. true: static, false: animation
  const [submitItem, setSubmitItem] = useState({});
  const [pickr, setPickr] = useState(null);
  const [tabType, setTabType] = useState('collection');
  const [onSale, setOnSale] = useState(false);
  const [collections, setCollections] = useState([]);
  const [mintedFrames, setMintedFrames] = useState(null);
  const [moveStartIndex, setMoveStartIndex] = useState(null);

  const framePreviewEl = useRef(null);

  const widthPct = `${100.0 / frames.width}%`;

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

    if (!wallet.address) {
      toast.error('Please connect to wallet first');
      return;
    }
    const { title, description } = submitItem;
    const tags = submitItem.tags ? submitItem.tags.split(',').map(v => v.trim()) : '';
    if (!title) {
      toast.error('Please enter the title of item');
      return;
    } else if (title.length > itemConfig.maxTitleLength) {
      toast.error(`The length of title cannot exceed ${itemConfig.maxTitleLength}`);
      return;
    }
    if (description && description.length > itemConfig.maxDescriptionLength) {
      toast.error(`The length of description cannot exceed ${itemConfig.maxDescriptionLength}`);
      return;
    }

    const collection = collections.length > 0 ? collections.filter(clt => clt.selected)[0] : {};

    // validate supply
    if (!submitItem.supply) {
      toast.error('Please enter the supply of item in correct format');
      return;
    }
    const supply = toAmountPrecision(submitItem.supply);
    if (supply !== submitItem.supply) {
      toast.error('Supply is expected as an integer');
      return;
    }
    if (supply < itemConfig.minSupply || supply > itemConfig.maxSupply) {
      toast.error(`Supply is expected in the range of ${itemConfig.minSupply} ~ ${itemConfig.maxSupply}`);
      return;
    }

    // validate frames
    const savedFrames = tabType === 'mint' ? mintedFrames : frames;
    if (savedFrames.width < itemConfig.minFrameWidth) {
      toast.error(`Frame width must not be less than ${itemConfig.minFrameWidth}`);
      return;
    }
    if (savedFrames.height < itemConfig.minFrameHeight) {
      toast.error(`Frame height must not be less than ${itemConfig.minFrameHeight}`);
      return;
    }
    if (savedFrames.width > itemConfig.maxFrameWidth) {
      toast.error(`Frame width must not exceed ${itemConfig.maxFrameWidth}`);
      return;
    }
    if (savedFrames.height > itemConfig.maxFrameHeight) {
      toast.error(`Frame height must not exceed ${itemConfig.maxFrameHeight}`);
      return;
    }
    if (savedFrames.frameIds.length > itemConfig.maxFrameCount) {
      toast.error(`Frame count must not exceed ${itemConfig.maxFrameCount}`);
      return;
    }
    const colors = convertFramesToString(savedFrames);
    
    // get hash id
    const hashCmd = mkReq({'to_hash': colors})
    const id = await fetch(`${serverUrl}/tool/hash`, hashCmd)
      .then(res => res.text())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (!id) {
      return;
    }

    const rows = savedFrames.height;
    const cols = savedFrames.width;
    const frameCnt = savedFrames.frameIds.length;
    const intervals = convertFramesToIntervals(savedFrames);
    const account = wallet.address;
    const envData = {
      id,
      title,
      colors,
      rows,
      cols,
      frames: frameCnt,
      intervals,
      supply,
      account
    };

    if (onSale) {
      // if item is directly posted into market, then add release action
      if (!submitItem.price) {
        toast.error('Please enter correct listing price');
        return;
      }
      const price = toPricePrecision(submitItem.price);
      if (price <= 0) {
        toast.error('Please enter correct listing price');
        return;
      }
      if (!submitItem.saleAmount) {
        toast.error('Please enter correct listing quantity');
        return;
      }
      const saleAmount = toAmountPrecision(submitItem.saleAmount);
      if (saleAmount !== submitItem.saleAmount) {
        toast.error(`Sale amount is expected as an integer`);
        return;
      }
      if (saleAmount <= 0) {
        toast.error(`Please enter correct amount`);
        return;
      } else if (saleAmount > supply) {
        toast.error('Listing quantity must not exceed the supply');
        return;
      }
      envData.saleAmount = saleAmount;

    }

    dpt.showLoading('Preparing command...');

    const addition = {
      tags,
      description,
      collection
    };
    const postData = {
      envData,
      onSale
    };
    const url = `${serverUrl}/item/prepare`;
    const result = await fetch(url, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (result && result.status === 'success') {
      const msg = actions.createBaseMsg();
      window.postMessage({
        ...msg,
        ...result.data,
        walletIndex: 0,
        addition,
        action: types.SIGN_CMD,
        context: 'creatorPage',
        scene: 'mint',
      });
      dpt.showLoading('Please confirm in Colorful Wallet...');
      return;
    }

    dpt.hideLoading();
  };


  const handleMove = (e, cellIndex) => {
    // start calc if mouseDown + moveTool
    if (moveStartIndex && palette.toolType === 'move') {
      // if same index, skip
      if (cellIndex !== moveStartIndex) {
        dpt.drawWithMove(moveStartIndex, cellIndex);
        // reset start point
        setMoveStartIndex(cellIndex);
      }
    }
    e.preventDefault();
  };

  const scrollFramePreview = (frameId) => {
    // if the last frame is selected, scroll preview to the bottom
    if (frames.frameIds.indexOf(frameId) === frames.frameIds.length - 1 && frameId === frames.activeId) {
      framePreviewEl.current.scrollTop = framePreviewEl.current.scrollHeight;
    } 
  };

  const saveProject = async () => {
    const { title } = submitItem;
    if (!title) {
      toast.error('Title cannot be empty');
      return;
    }
    if (frames.width > creatorConfig.maxWidth) {
      toast.error(`Frame width must not exceed ${creatorConfig.maxWidth}`);
      return;
    }
    if (frames.height > creatorConfig.maxHeight) {
      toast.error(`Frame height must not exceed ${creatorConfig.maxHeight}`);
      return;
    }
    const postData = {
      title,
      frames: JSON.stringify(frames),
      palette: JSON.stringify(palette)
    };
    const url = projects && projects.length > 0 ? `${serverUrl}/project/save/${projects[0].id}` : `${serverUrl}/project/new`;
    const result = await fetch(url, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (result) {
      if (result.status === 'success') {
        toast.success('Project is saved successfully');
      } else {
        toast.error(result.data);
      }
    }
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
    console.log('selectedTitles', selectedTitles);
    return selectedTitles.length > 0 ? selectedTitles[0] : 'No Collection';
  };

  const syncCollections = async () => {
    const postData = collections;
    const url = `${serverUrl}/collection`;
    const result = await fetch(url, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (result) {
      if (result.status === 'success') {
        toast.success('sync successfully');
      } else {
        toast.error(result.data);
      }
    }
  };

  const getItemSettingBoard = () => {
    return (
      <div data-role='item settings' className='px-6 py-6 w-full flex flex-col bg-white border-l text-sm border'>
        <div>
          <input 
            defaultValue={submitItem.title}
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
              onChange={(e) => setCollections(collections.map((clt, index) => index === e.target.selectedIndex - 1 ? {
                  ...clt,
                  selected: true
                } : {
                  ...clt,
                  selected: false
                }
              ))}
            >
            <option disabled selected={true} value=''> -- select a collection -- </option>
              {
                collections.length > 0 ? 
                collections.map(collection => (
                  <option 
                    className='text-center mx-auto'
                    key={collection.id}
                  >
                    {collection.title}
                  </option>
                ))
                :
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
            onChange={ (e) => setSubmitItem({...submitItem, supply: parseFloat(e.target.value)}) }
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
          <button 
            disabled={tabType==='mint'} 
            className={`mt-4 text-white py-1 px-3 w-5/12 rounded ${tabType === 'mint' ? 'bg-gray-500' : 'bg-red-500'}`} 
            onClick={ () => saveProject() }
          >
            Save
          </button>
          <button className='mt-4 bg-red-500 text-white py-1 px-3 w-5/12 rounded' onClick={ () => onSubmitItem() }>
            Deploy
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const initPage = async () => {
      initPickr();
      await fetchData();
    };

    const initPickr = () => {
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
      
      setPickr(newPickr);
    };

    const fetchData = async () => {
      dpt.showLoading();

      await Promise.all([
        fetchProjects(),
        fetchCollections()
      ]);

      dpt.hideLoading();
    };

    const fetchProjects = async () => {
      // if there's no project from server, then load examples
      const url = `${serverUrl}/project`;
      const projects = await fetch(url, mkReq())
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if (projects && projects.length > 0) {
        projects.forEach(project => {
          project.frames = JSON.parse(project.frames);
          project.palette = JSON.parse(project.palette);
        });
        const project = projects[0];
        const frames = project.frames;
        const palette = project.palette;
        dpt.loadProject(frames, palette);
        setProjects(projects);
        setSubmitItem(submitItem => ({...submitItem, title: project.title}));
      } else {
        dpt.loadProject(exampleFrames);
      }
    };

    const fetchCollections = async () => {
      if (wallet.address) {
        const url = `${serverUrl}/collection/owned-by/${wallet.address}`;
        const collections = await fetch(url)
          .then(res => res.json())
          .catch(error => {
            console.log(error);
            toast.error(error.message);
          });

        if (collections) {
          setCollections(collections);
        }
      }
    };

    const setupWindow = () => {
      window.addEventListener('message', handleMessage);
    };
    const handleMessage = (event) => {
      const data = event.data;
      const source = data.source || '';
      if (source.startsWith('colorful') && data.context === 'creatorPage') {
        if (data.action === types.SIGN_CMD && data.scene === 'mint') {
          if (data.status === 'success') {
            console.log('in mint success', data);
            const signedCmd = {
              hash: data.hash,
              cmd: data.cmd,
              sigs: data.sigs.concat(data.data.sigs)
            };
            dpt.showLoading('Uploading item to Chainweb, please wait 30 ~ 90 seconds');
            const postData = {
              ...data.addition,
              signedCmd
            };
            const url = `${serverUrl}/item`;
            fetch(url, mkReq(postData))
              .then(res => res.json())
              .then(data => {
                dpt.hideLoading();
                if (data.status === 'success') {
                  document.location.href = `/item/${data.itemId}`;
                } else {
                  toast.error(data.data);
                }
              })
              .catch(error => {
                console.log(error);
                toast.error(error.message);
              });
          }
        }
      }
    };

    initPage();
    setupWindow();

    return () => {
      // Unbind the event listener on clean up
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div data-role='creator body' className='bg-cb-gray mb-32' hidden={loading}>
      <div data-role='tabs at top' className='h-10 border-b flex items-end space-x-10 text-sm mb-5'>
        <button className={`ml-16 px-3 py-2 ${tabType === 'collection' ? 'selected' : ''}`} onClick={ () => setTabType('collection') }>Collection</button>
        <button className={`px-3 py-2 ${tabType === 'mint' ? 'selected' : ''}`} onClick={ () => setTabType('mint') }>Mint</button>
        <button className={`px-3 py-2 ${tabType === 'design' ? 'selected' : ''}`} onClick={ () => setTabType('design') }>Design</button>
      </div>
      <div data-role='collection tab' className={`flex flex-col items-center justify-center w-1/3 mx-auto text-sm ${tabType === 'collection' ? '' : 'hidden'}`}>
        <p className='text-lg'>Select Collection</p>
        <div 
          className='w-full my-3 relative text-gray-300 hover-pink hover:text-pink-500 cursor-pointer'
          onClick={ () => setTabType('mint') }
        >
          <input 
            value={getCollectionTitle()}
            readOnly
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
              key={collection.id}
            >
              <input 
                value={collection.isNew && !collection.hasModified ? '' : collection.title}
                placeholder={collection.isNew ? collection.title : ''}
                readOnly={collection.isNew ? false : true}
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
                onClick={ () => setCollections(collections.map((clt, _index) => _index === index ? {
                    ...clt,
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
                onClick={ () => setCollections(collections.filter((_, _index) => _index !== index)) }
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
      <div data-role='create tab' className={`w-full flex ${tabType === 'design' ? '' : 'hidden'}`}>
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
                  index < 30 &&
                  <div
                    className='mx-1 my-0.5'
                    onClick={ () => clickPaletteColor(index) }
                    key={index}
                  >
                    <button 
                      className={`w-4 h-4 ${color === 'rgba(255, 255, 255, 1)' ? 'border' : 'border-0'} rounded ${index === palette.selectedIndex ? 'ring' : ''}`} 
                      style={{ backgroundColor: color }}
                    ></button>
                  </div>
                ))
              }
            </div>
            <p className='mt-1 mb-2 border-t bg-gray-400'></p>
            <div className='flex flex-wrap justify-between'>
              {
                palette.colors.map((color, index) => (
                  index >= 30 && index < 42 &&
                  <div
                    className='mx-1 my-0.5'
                    onClick={ () => clickPaletteColor(index) }
                    key={index}
                  >
                    <button 
                      className={`w-4 h-4 ${color === 'rgba(255, 255, 255, 1)' ? 'border' : 'border-0'} rounded ${index === palette.selectedIndex ? 'ring' : ''}`} 
                      style={{ backgroundColor: color }}
                    ></button>
                  </div>
                ))
              }
            </div>
            <input 
              value={palette.selectedIndex >= 0 ? convertRgbaToHex(palette.colors[palette.selectedIndex]) : '#FFFFFF'}
              className='w-full text-xs py-1 border-0 rounded bg-gray-200 px-3 tracking-wide my-2'
              readOnly
            />
            <p className='text-gray-500 text-xs mb-1'>Recent</p>
            <div className='flex flex-wrap justify-between'>
              {
                palette.colors.map((color, index) => (
                  index >= 42 &&
                  <div
                    className='mx-1 my-0.5'
                    onClick={ () => clickPaletteColor(index) }
                    key={index}
                  >
                    <button 
                      className={`w-4 h-4 ${color === 'rgba(255, 255, 255, 1)' ? 'border' : 'border-0'} rounded ${index === palette.selectedIndex ? 'ring' : ''}`} 
                      style={{ backgroundColor: color }}
                    ></button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        <div data-role='painting grids and frame list' className='w-2/3 flex mx-auto justify-center'>
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
            <div className='flex justify-center space-x-10 pt-4'>
              <button data-role='undo button' className='w-6 h-6' onClick={ () => dpt.undo() }>
                <img src='/img/undo.svg' alt='undo' className='w-full h-full' />
              </button>
              <button data-role='redo button' className='w-6 h-6' onClick={ () => dpt.redo() }>
                <img src='/img/redo.svg' alt='redo' className='w-full h-full' />
              </button>
            </div>
            <div className='relative w-120 mx-auto'>
              <div className='absolute -top-6 right-0'>
                <input 
                  readOnly
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
            <div data-role='all single frames' className='h-96 flex flex-col overflow-y-auto' ref={framePreviewEl}>
              {
                frames.frameIds.map((frameId) => (
                  <div 
                    data-role='preview box with buttons' 
                    className={`relative w-20 h-20 mb-4 border rounded ${frameId === frames.activeId ? 'bd-cb-pink' : 'border-gray-400'}`} 
                    key={frameId}
                    onClick={ () => dpt.setActiveFrameId(frameId) }
                    onLoad={ () => scrollFramePreview(frameId) }
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
                      readOnly={frameId === frames.frameIds.length - 1}
                    />
                  </div>
                ))
              }
            </div>
          </div>
        </div>
        <div className='pl-16 w-1/4'>
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
  );
};

CreatePage.propTypes = {
  palette: PropTypes.object.isRequired,
  frames: PropTypes.object.isRequired,
  dpt: PropTypes.object.isRequired,
  wallet: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  frames: state.creator.present.frames,
  palette: state.creator.present.palette,
  wallet: state.wallet,
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
  dpt: {
    ...bindActionCreators(actions, dispatch),
    undo: () => dispatch(ActionCreators.undo()),
    redo: () => dispatch(ActionCreators.redo())
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(CreatePage);
