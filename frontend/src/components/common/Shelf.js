import React from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from '../../config';

const Shelf = (props) => {

  const { entryList, config } = props;
  const flow = config.flow === 'flex' ? 'flex overflow-x-auto space-x-4' : `grid grid-cols-${config.cols} gap-x-4 gap-y-10`;
  const width = config.flow === 'flex' ? `w-1/${config.cols} my-2 mx-1` : ''

  return (
    <div>
      <ul data-role='blocks' className={`${flow} justify-between text-xs`}>
        {
          entryList.map((entry) => (
            config.type === 'item' ? (
              <li 
                data-role='block container' 
                className={`${width} h-56 flex-none px-4 py-4 cursor-pointer border rounded-xl border-gray-300 hover-gray`}
                onClick={ () => document.location.href = `/item/${entry.id}` }
              >
                <div data-role='title and collection' className='h-8'>
                  <p>{entry.title}</p>
                  <p className='text-gray-400'>{entry.collection}</p>
                </div>
                <div data-role='thumbnail' className='h-32 py-6 flex justify-center'>
                  <img className='h-full' src={`${serverUrl}/static/img/${entry.id}.${entry.type === 0 ? 'png' : 'gif'}`} alt={entry.title} />
                </div>
                <div data-role='creator and price' className='h-8 flex items-end justify-between'>
                  <div>
                    <p className='text-xxs text-gray-500'>Creator</p>
                    <p>{`${entry.creator.slice(0, 4)}....${entry.creator.slice(-4)}`}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xxs-r text-gray-500'>Price</p>
                    <p className='text-cb-pink'>{entry.price ? `${entry.price.toFixed(1)} KDA` : 'Not on sale' }</p>
                  </div>
                </div>
              </li>
            ) : (
              <li data-role='block container' className={`w-1/${config.cols} h-44 flex-none px-4 py-4 my-2 mx-1 border rounded-xl border-gray-300 hover-gray`}>
                <div data-role='thumbnail' className='h-28 py-4 flex justify-center'>
                  <img className='h-full' src={`${serverUrl}/static/img/${entry.id}.png`} alt={entry.name} />
                </div>
                <div data-role='brief' className='h-8 flex items-end'>
                  <div>
                    <p className='font-semibold'>{entry.name}</p>
                    <p>{entry.count} collectibles</p>
                  </div>
                </div>
              </li>
            )
          ))
        }
      </ul>
    </div>
  );
};

Shelf.propTypes = {
  props: PropTypes
};

export default Shelf;
