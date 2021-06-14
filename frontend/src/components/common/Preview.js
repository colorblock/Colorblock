import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { convertFramesToBase64 } from '../../utils/render';

export const Preview = ({ task }) => {
  
  const [url, setUrl] = useState('');

  useEffect(() => {
    const convert = async () => {
      console.log('on convert');
      if (task.type === 'animation') {
        const frames = task.frames;
        const newUrl = await convertFramesToBase64(frames);
        setUrl(newUrl);
      } else {
        const frames = task.frames;
        const frameId = task.frameId;
        const newUrl = await convertFramesToBase64(frames, frameId);
        setUrl(newUrl);
      }
    };

    convert();
  }, [task]);

  return (
    <div className='w-full h-full'>
      { url && <img src={url} className='w-full h-full' alt='Preview' /> }
    </div>
  );
};

Preview.propTypes = {
  task: PropTypes.object.isRequired
};

export default Preview;