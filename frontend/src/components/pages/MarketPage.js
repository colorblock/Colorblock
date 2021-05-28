import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import Shelf from '../common/Shelf';

export const MarketPage = (props) => {
  
  const items = Array(30).fill({
    id: 'c246a25c421f7eb1',
    title: 'Example Block',
    collection: 'ColorBlock Genesis',
    owner: 'ebf4xxxxdcdb',
    price: 1000.0
  });
  const itemShelfConfig = {
    type: 'item',
    flow: 'grid',
    cols: 5
  };

  return (
    <div data-role='market container' className='bg-cb-gray text-sm'>
      <div data-role='item filter and sort' className='w-5/6 mx-auto my-10 flex justify-between'>
        <div data-role='filter at left' className='flex space-x-4'>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200'>Animated</span>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200'>Image</span>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200'>Collection</span>
        </div>
        <div data-role='sort at right' className='relative h-8'>
          <select className='h-full px-10 border rounded-xl text-center mx-auto'>
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