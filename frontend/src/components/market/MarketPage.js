import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { serverUrl } from '../../config';

export const MarketPage = (props) => {
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
        <ul data-role='blocks' className='grid grid-cols-5 gap-x-4 gap-y-10 justify-between text-xs'>
          {
            Array(30).fill(0).map(() => (
              <li data-role='block container' className='h-56 px-4 py-4 border rounded-xl border-gray-300 hover-gray'>
                <div data-role='title and collection' className='h-8'>
                  <p>Example Cat</p>
                  <p className='text-gray-400'>ColorBlock Genesis</p>
                </div>
                <div data-role='thumbnail' className='h-32 py-6 flex justify-center'>
                  <img className='h-full' src={`${serverUrl}/static/img/c246a25c421f7eb1.png`} alt='Fruit 2' />
                </div>
                <div data-role='owner and price' className='h-8 flex items-end justify-between'>
                  <div>
                    <p className='text-xxs text-gray-500'>Owner</p>
                    <p>ebf4...dcdb</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xxs-r text-gray-500'>Price</p>
                    <p className='text-cb-pink'>1000.0 KDA</p>
                  </div>
                </div>
              </li>
            ))
          }
        </ul>
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
