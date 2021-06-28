import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import { creatorConfig, serverUrl } from '../../config';
import { convertFramesToBase64, createFramesFromCompressedImage, createFramesFromImage } from '../../utils/render';
import { loadProject } from '../../store/actions/actionCreator';
import { Dropzone } from './Dropzone';

export const PixelTool = (props) => {

  const { loadProject, closeTab, saveFrames } = props;
  const [images, setImages] = useState([]);
  const imageRatio = images.length > 0 && images[0].frames.height / images[0].frames.width;

  const onImageChange = (files) => {
    console.log('files', files)
    // update preview
    const reader = new FileReader();
    const file = files[0];
    const imageType = file.type;
    reader.onloadend = () => {
      const imageUrl = reader.result;
      createFramesFromImage(imageUrl, imageType).then(frames => {
        console.log('frames 0', frames);
        setImages([{
          imageType,
          frames,
          imageUrl
        }]);
      });
    };
    reader.readAsDataURL(file);
  };

  const editImage = async () => {
    const filteredImages = images.filter(image => image.selected);
    if (filteredImages.length === 0) {
      toast.warning('Please choose one image');
    }
    const frames = filteredImages[0].frames;
    const maxWidth = creatorConfig.maxWidth;
    const maxHeight = creatorConfig.maxHeight;
    if (frames.width <= maxWidth && frames.height <= maxHeight) {
      loadProject(frames);
      closeTab();
    } else {
      toast.error(`Design tool only support image with <=${maxWidth}px width and <=${maxHeight}px height, please mint this token directly.`);
    }
  };

  useEffect(() => {
    const addCompressed = async() => {
      if (images.length === 1) {
        const widthList = [4, 8, 16, 32, 64, 128, 256];
        console.log(images);
        const originImage = images[0];
        setImages([
          originImage,
          ...widthList.map(_ => ({}))
        ]);
        const { imageUrl, imageType } = originImage;
        const newImagesTask = widthList.map(async (width) => {
          return createFramesFromCompressedImage(imageUrl, imageType, width).then(frames => {
            console.log('frames 1', frames);
            const newUrl = convertFramesToBase64(frames);
            const image = {
              frames,
              imageUrl: newUrl
            };
            return image;
          });
        });
       const newImages = await Promise.all(newImagesTask);
       setImages([
         originImage,
         ...newImages
       ]);
      }
    };

    addCompressed()
  }, [images]);

  return (
    <div data-role='pixel tool container text-base' className='flex flex-col w-2/3 mx-auto'>
      <p className='text-center font-semibold text-lg mt-5'>Mint a token from existing image</p>
      <div className='mx-auto mt-10 mb-5'>
        <Dropzone onImageChange={ (files) => onImageChange(files) } />
      </div>
      <div className='flex space-x-5 justify-center'>
        {
          images.map((image, index) => (
            <div className='flex flex-col items-center'>
              <button className='flex items-center justify-center focus:ring focus:ring-pink-500 my-3' style={{ width: '80px', height: `${imageRatio * 80}px` }}>
                { image.imageUrl ?
                  <img 
                    src={image.imageUrl} 
                    className='w-full h-full'
                    alt='Preview'
                    onClick={ () => {
                      setImages(images.map((image, i) => ({...image, selected: i === index})));
                      saveFrames(image.frames);
                    }}
                  /> :
                  <FontAwesomeIcon icon={fa.faSpinner} />
                }
              </button>
              <span>{image.imageUrl ? `${image.frames.width} x ${image.frames.height}` : 'Loading...' }</span>
            </div>
          ))
        }
      </div>
      <button 
        className='w-1/2 mx-auto bg-pink-500 border rounded px-6 py-2 my-10 text-white'
        onClick={ () => editImage() }
      >
        Edit in design tools
      </button>
    </div>
  );
};

PixelTool.propTypes = {
  loadProject: PropTypes.func.isRequired,
  closeTab: PropTypes.func.isRequired,
  saveFrames: PropTypes.func.isRequired
};

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
  loadProject: (frames) => dispatch(loadProject(frames))
});

export default connect(mapStateToProps, mapDispatchToProps)(PixelTool);
