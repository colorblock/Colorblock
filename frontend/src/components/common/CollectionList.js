import React from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from '../../config';
import { firstUrl, secondUrl } from '../../utils/tools';

const CollectionList = (props) => {

  const { collections, display } = props;
  const flow = display === 'flex' ? 'flex overflow-x-auto space-x-4' : `grid grid-cols-4 gap-x-4 gap-y-10`;
  const width = display === 'flex' ? `w-1/4 my-2 mx-1` : '';

  return (
    <div>
      <ul data-role='blocks' className={`${flow} justify-between text-xs`}>
        {
          collections.map((collection) => (
            <li 
              data-role='block container' 
              className={`${width} h-44 flex-none px-4 py-4 my-2 mx-1 border rounded-xl border-gray-300 hover-gray cursor-pointer`}
              onClick={ () => document.location.href = `/collection/${collection.id}` }
              key={collection.id}
            >
              <div data-role='thumbnail' className='h-28 py-4 flex justify-center'>
                <img 
                  src={firstUrl(collection.items[0].urls)} 
                  onError={ (e) => {
                    e.target.onerror = null; 
                    e.target.src = secondUrl(collection.items[0].urls);
                  } } 
                  className='h-full' 
                  alt={collection.name}
                />
              </div>
              <div data-role='brief' className='h-8 flex items-end'>
                <div>
                  <p className='font-semibold'>{collection.title}</p>
                  <p>{collection.items.length} collectibles</p>
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
  collections: PropTypes.array.isRequired,
  display: PropTypes.string.isRequired
};

export default CollectionList;
