import React from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from '../../config';

const AssetList = (props) => {

  const { assets, display } = props;
  const flow = display === 'flex' ? 'flex overflow-x-auto space-x-4' : `grid grid-cols-5 gap-x-4 gap-y-10`;
  const width = display === 'flex' ? `w-1/5 my-2 mx-1` : '';

  return (
    <div>
      <ul data-role='blocks' className={`${flow} justify-between text-xs`}>
        {
          assets.map((asset) => (
            <li 
              data-role='block container' 
              className={`${width} h-56 flex-none px-4 py-4 cursor-pointer border rounded-xl border-gray-300 hover-gray`}
              onClick={ () => document.location.href = `/asset/${asset.asset_id}` }
              key={asset.id}
            >
              <div data-role='title and collection' className='h-8'>
                <p>{asset.item.title}</p>
                <p className='text-gray-400'>{asset.collection}</p>
              </div>
              <div data-role='thumbnail' className='h-32 py-6 flex justify-center'>
                <img className='h-full' src={`${serverUrl}/static/img/${asset.item.id}.${asset.item.type === 0 ? 'png' : 'gif'}`} alt={asset.title} />
              </div>
              <div data-role='owner and price' className='h-8 flex assets-end justify-between'>
                <div>
                  <p className='text-xxs text-gray-500'>Owner</p>
                  <p>{`${asset.user_id.slice(0, 4)}....${asset.user_id.slice(-4)}`}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xxs-r text-gray-500'>Price</p>
                  <p className='text-cb-pink'>{asset.deal ? `${asset.deal.price.toFixed(4)} KDA` : 'Not on sale' }</p>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  );
};

AssetList.propTypes = {
  assets: PropTypes.array.isRequired,
  display: PropTypes.string.isRequired
};

export default AssetList;
