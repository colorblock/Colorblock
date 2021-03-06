import React from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from '../../config';
import { firstUrl, secondUrl } from '../../utils/tools';

const ItemList = (props) => {

  const { items, display } = props;
  const flow = display === 'flex' ? 'flex overflow-x-auto space-x-4' : `grid grid-cols-5 gap-x-4 gap-y-10`;
  const width = display === 'flex' ? `w-1/5 my-2 mx-1` : '';

  return (
    <div>
      <ul data-role='blocks' className={`${flow} text-xs`}>
        {
          items.map((item) => (
            <li
              data-role='block container'
              className={`${width} h-56 flex-none px-4 py-4 cursor-pointer border rounded-xl border-gray-300 hover-gray`}
              onClick={ () => document.location.href = `/item/${item.id}` }
              key={item.id}
            >
              <div data-role='title and collection' className='h-8'>
                <p>{item.title}</p>
                <p className='text-gray-400'>{item.collection}</p>
              </div>
              <div data-role='thumbnail' className='h-32 py-6 flex justify-center'>
                <img 
                  src={firstUrl(item.urls)} 
                  onError={ (e) => {
                    e.target.onerror = null; 
                    e.target.src = secondUrl(item.urls);
                  } } 
                  className='h-full' 
                  alt='img thumbnail' 
                />
              </div>
              <div data-role='creator and price' className='h-8 flex items-end justify-between'>
                <div>
                  <p className='text-xxs text-gray-500'>Creator</p>
                  <p>{item.creator ? `${item.creator.slice(0, 4)}....${item.creator.slice(-4)}` : 'NULL'}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xxs-r text-gray-500'>Supply</p>
                  <p className='text-cb-pink'>{item.supply}</p>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
      <div className='grid-cols-5'></div>
    </div>
  );
};

ItemList.propTypes = {
  items: PropTypes.array.isRequired,
  display: PropTypes.string.isRequired
};

export default ItemList;
