import React from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from '../../config';

const ItemList = (props) => {

  const { items, config } = props;
  const flow = config.flow === 'flex' ? 'flex overflow-x-auto space-x-4' : `grid grid-cols-${config.cols} gap-x-4 gap-y-10`;
  const width = config.flow === 'flex' ? `w-1/${config.cols} my-2 mx-1` : ''

  return (
    <div>
      <ul data-role='blocks' className={`${flow} justify-between text-xs`}>
        {
          items.map((item) => (
            <li 
              data-role='block container' 
              className={`${width} h-56 flex-none px-4 py-4 cursor-pointer border rounded-xl border-gray-300 hover-gray`}
              onClick={ () => document.location.href = `/item/${item.id}` }
            >
              <div data-role='title and collection' className='h-8'>
                <p>{item.title}</p>
                <p className='text-gray-400'>{item.collection}</p>
              </div>
              <div data-role='thumbnail' className='h-32 py-6 flex justify-center'>
                <img className='h-full' src={`${serverUrl}/static/img/${item.id}.${item.type === 0 ? 'png' : 'gif'}`} alt={item.title} />
              </div>
              <div data-role='creator and price' className='h-8 flex items-end justify-between'>
                <div>
                  <p className='text-xxs text-gray-500'>Creator</p>
                  <p>{`${item.creator.slice(0, 4)}....${item.creator.slice(-4)}`}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xxs-r text-gray-500'>Height</p>
                  <p className='text-cb-pink'>{item.mint.block_height}</p>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  );
};

ItemList.propTypes = {
  props: PropTypes
};

export default ItemList;
