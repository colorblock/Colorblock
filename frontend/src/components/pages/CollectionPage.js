import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import ItemList from '../common/ItemList';
import AssetList from '../common/AssetList';
import { serverUrl } from '../../config';

export const CollectionPage = (props) => {
  
  const { collectionId } = useParams();
  const [items, setItems] = useState([]);

  const itemListConfig = {
    type: 'item',
    flow: 'grid',
    cols: 5
  };

  useEffect(() => {
    const fetchLatestItems = async () => {
      const itemsUrl = `${serverUrl}/collection/${collectionId}/items`;
      const itemsData = await fetch(itemsUrl).then(res => res.json());
      console.log(itemsData);
      setItems(itemsData);
    };

    fetchLatestItems();
  }, [collectionId]);

  return (
    <div data-role='market container' className='bg-cb-gray text-sm'>
      <div data-role='item filter and sort' className='w-5/6 mx-auto my-10 flex justify-between'>
        <div data-role='filter at left' className='flex space-x-4'>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200 cursor-pointer'>Animated</span>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200 cursor-pointer'>Image</span>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200 cursor-pointer'>Collection</span>
        </div>
        <div data-role='sort at right' className='relative h-8'>
          <select className='h-full px-10 border rounded-xl mx-auto cursor-pointer'>
            <option className='text-center mx-auto'>Popular</option>
            <option className='text-center mx-auto'>Mint Time</option>
          </select>
          <div className='absolute top-0 left-2 mx-2 text-gray-300 h-full flex items-center'>
            <FontAwesomeIcon icon={fa.faCaretDown} />
          </div>
        </div>
      </div>
      {
        items &&
        <div data-role='items list' className='w-5/6 mx-auto'>
          <ItemList items={items} config={itemListConfig} />
        </div>
      }
    </div>
  );
};

export default CollectionPage;