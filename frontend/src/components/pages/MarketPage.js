import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import Shelf from '../common/Shelf';
import { serverUrl } from '../../config';

export const MarketPage = (props) => {
  
  const { keyword } = useParams();
  const [items, setItems] = useState([]);

  const itemShelfConfig = {
    type: 'item',
    flow: 'grid',
    cols: 5
  };

  useEffect(() => {
    const fetchAllItems = async () => {
      let itemsUrl;
      if (document.location.href.includes('/search/')) {
        itemsUrl = `${serverUrl}/item/search/${keyword}`;
      } else {
        itemsUrl = `${serverUrl}/item/all`;
      }
      console.log(itemsUrl);
      const itemsData = await fetch(itemsUrl).then(res => res.json());
      console.log(itemsData);
      setItems(itemsData);
    };

    fetchAllItems();
  }, [keyword]);

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
      <div data-role='item list' className='w-5/6 mx-auto'>
        <Shelf entryList={items} config={itemShelfConfig} />
      </div>
    </div>
  );
};

MarketPage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(MarketPage);
