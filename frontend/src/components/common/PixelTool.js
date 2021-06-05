import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { serverUrl } from '../../config';
import { createFramesFromImage } from '../../utils/render';
import { loadProject } from '../../store/actions/actionCreator';

export const PixelTool = (props) => {

  const { loadProject, closeModal } = props;
  const [maxWidth, setMaxWidth] = useState(null);
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
    const imageBlob = await fetch(url, postData).then(res => res.blob());
    
    // update preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages({
        ...images,
        compressed: imageBlob
      });
      const imageUrl = reader.result;
      setImagePreviewUrls({
        ...imagePreviewUrls,
        compressed: imageUrl
      });
    };
    reader.readAsDataURL(imageBlob);
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
    console.log(frames);
    loadProject(frames);
    closeModal();
  };

  return (
    <div data-role='pixel tool container' className='flex'>
      <div data-role='upload left part' className='w-1/2 flex flex-col items-center mt-10 border-r'>
        <label className='mx-auto bg-pink-500 border rounded px-3 py-2 my-3 text-xs text-white'>
          <input 
            type='file'
            onChange={ (e) => onImageChange(e) } 
          />
          Choose your image
        </label>
        { imagePreviewUrls.origin && 
          <img 
            src={imagePreviewUrls.origin} 
            className='w-40 my-3'
            alt='Origin Image Preview' 
          />
        }
        <div className='flex justify-center space-x-5'>
          <span>Max-width</span>
          <input 
            type='number' 
            className='w-16 border rouned' 
            onChange={ (e) => setMaxWidth(parseInt(e.target.value)) } 
          />
        </div>
        <button 
          className='mx-auto bg-pink-500 border rounded px-6 py-2 my-3 text-xs text-white'
          onClick={ () => onUploadImage() }
        >
          Upload Image
        </button>
      </div>
        { imagePreviewUrls.compressed &&
          <div data-role='download right part' className='w-1/2 flex flex-col items-center mt-10'>
            <label className='mx-auto px-3 py-2 my-3 text-xs border-b text-pink-500'>
              After compressed
            </label>
            <img 
              src={imagePreviewUrls.compressed} 
              className='w-40 my-3'
              alt='Compressed Image Preview' 
            />
            <button 
              className='mx-auto bg-pink-500 border rounded px-6 py-2 my-3 text-xs text-white'
              onClick={ () => onSaveImage() }
            >
              Load into frames
            </button>
          </div>
        }
    </div>
  );
};

PixelTool.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = dispatch => ({
  loadProject: (frames) => dispatch(loadProject(frames))
});

export default connect(mapStateToProps, mapDispatchToProps)(PixelTool);
