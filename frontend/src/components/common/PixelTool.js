import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import { creatorConfig, serverUrl } from '../../config';
import { createFramesFromImage } from '../../utils/render';
import { loadProject } from '../../store/actions/actionCreator';

export const PixelTool = (props) => {

  const { loadProject, closeTab, saveFrames } = props;
  const [maxWidth, setMaxWidth] = useState(null);
  const [mintedFrames, setMintedFrames] = useState({});
  const [images, setImages] = useState({
    origin: null,
    compressed: null
  });
  const [imagePreviewUrls, setImagePreviewUrls] = useState({
    origin: '',
    compressed: ''
  });

  const onUploadImage = async () => {
    const url = `${serverUrl}/tool/pixel`;
    const formData = new FormData();
    formData.append('image', images.origin);
    formData.append('max_width', maxWidth);
    const postData = {
      method: 'POST',
      body: formData
    }
    const imageBlob = await fetch(url, postData)
      .then(res => {
        if (res.ok) {
          return res;
        } else {
          return res.text().then(text => {
            throw new Error(text);
          });
        }
      })
      .then(res => res.blob())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });
    
    if (imageBlob) {
      // update preview
      const reader = new FileReader();
      reader.onloadend = async () => {
        setImages({
          ...images,
          compressed: imageBlob
        });
        const imageUrl = reader.result;
        setImagePreviewUrls({
          ...imagePreviewUrls,
          compressed: imageUrl
        });
        // generate frames
        const frames = await createFramesFromImage(imageBlob);
        setMintedFrames(frames);
        saveFrames(frames);
      };
      reader.readAsDataURL(imageBlob);
    }
  };

  const onImageChange = (e) => {
    // update preview
    const reader = new FileReader();
    const file = e.target.files[0];
    reader.onloadend = () => {
      setImages({
        ...images,
        origin: file
      });
      const imageUrl = reader.result;
      setImagePreviewUrls({
        ...imagePreviewUrls,
        origin: imageUrl
      });
    };
    reader.readAsDataURL(file);
  };

  const onSaveImage = async () => {
    // generate frames
    const frames = await createFramesFromImage(images.compressed);
    const maxWidth = creatorConfig.maxWidth;
    const maxHeight = creatorConfig.maxHeight;
    if (frames.width <= maxWidth && frames.height <= maxHeight) {
      loadProject(frames);
      closeTab();
    } else {
      toast.error(`Design tool only support image with <=${maxWidth}px width and <=${maxHeight}px height, please mint this token directly.`);
    }
  };

  return (
    <div data-role='pixel tool container text-base'>
      <p className='text-center font-semibold text-lg mt-5'>Mint a token from existing image</p>
      <div className='flex mt-5'>
        <div data-role='upload left part' className='w-1/2 flex flex-col items-center border-r-2'>
          <label className='mx-auto bg-pink-500 border rounded px-5 py-2 my-3 text-white cursor-pointer'>
            <input 
              type='file'
              onChange={ (e) => onImageChange(e) } 
            />
            Choose your image
          </label>
          { imagePreviewUrls.origin && 
            <div className='flex flex-col items-center '>
              <img 
                src={imagePreviewUrls.origin} 
                className='w-40 my-3'
                alt='Origin Preview' 
              />
              <div className='my-5 flex flex-col justify-center items-center text-sm'>
                <span>Set output width:</span>
                <div className='w-full relative'>
                  <input 
                    type='number' 
                    className='w-full py-1 px-2 my-2 border rounded' 
                    onChange={ (e) => setMaxWidth(parseInt(e.target.value)) } 
                  />
                  <div className='absolute top-0 right-4 ml-16 text-gray-500 h-full flex items-center'>
                     px
                  </div>
                </div>
              </div>
              <button 
                className='w-full bg-gray-500 border rounded px-5 py-2 my-3 text-white'
                onClick={ () => onUploadImage() }
              >
                Upload Image
              </button>
            </div>
          }
        </div>
        { imagePreviewUrls.compressed &&
          <div data-role='download right part' className='w-1/2 flex flex-col items-center'>
            <label className='mx-auto px-3 py-2 my-3 text-lg font-semibold border-b text-gray-500'>
              After compressed
            </label>
            <img 
              src={imagePreviewUrls.compressed} 
              className='w-40 my-3'
              alt='Compressed Preview' 
            />
            {
              mintedFrames.width && 
              <div className='flex flex-col items-center text-gray-500'>
                <span>Width: {mintedFrames.width}</span>
                <span>Height: {mintedFrames.height}</span>
                <span>Frames: {mintedFrames.frameIds.length}</span>
              </div>
            }
            <button 
              className='wx-full bg-pink-500 border rounded px-6 py-2 my-5 text-white'
              onClick={ () => onSaveImage() }
            >
              Edit in design tools
            </button>
          </div>
        }
      </div>
      
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
