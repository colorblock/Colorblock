import React from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from '../../config';

const CollectionList = (props) => {

  const { collections, config } = props;
  const flow = config.flow === 'flex' ? 'flex overflow-x-auto space-x-4' : `grid grid-cols-${config.cols} gap-x-4 gap-y-10`;
  const width = config.flow === 'flex' ? `w-1/${config.cols} my-2 mx-1` : ''

  return (
    <div>
      <ul data-role='blocks' className={`${flow} justify-between text-xs`}>
        {
          collections.map((collection) => (
            <li 
              data-role='block container' 
              className={`${width} h-44 flex-none px-4 py-4 my-2 mx-1 border rounded-xl border-gray-300 hover-gray`}
            >
              <div data-role='thumbnail' className='h-28 py-4 flex justify-center'>
                <img className='h-full' src={`${serverUrl}/static/img/${collection.id}.png`} alt={collection.name} />
              </div>
              <div data-role='brief' className='h-8 flex items-end'>
                <div>
                  <p className='font-semibold'>{collection.name}</p>
                  <p>{collection.count} collectibles</p>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  );
};

CollectionList.propTypes = {
  props: PropTypes
};

export default CollectionList;
