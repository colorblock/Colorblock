import React from 'react';
import Shelf from '../common/Shelf';

const HomePage = (props) => {

  const collections = Array(12).fill({
    id: 'c246a25c421f7eb1',
    name: 'Example Collection',
    count: 120
  });
  const collectionShelfConfig = {
    type: 'collection',
    flow: 'flex',
    cols: 4
  };
  const items = Array(12).fill({
    id: 'c246a25c421f7eb1',
    title: 'Example Block',
    collection: 'ColorBlock Genesis',
    owner: 'ebf4xxxxdcdb',
    price: 1000.0
  });
  const itemShelfConfig = {
    type: 'item',
    flow: 'flex',
    cols: 5
  };

  return (
    <div data-role='home container' className='bg-cb-gray text-sm'>
      <div 
        data-role='top banner' 
        className='relative pt-20 h-60 mb-20'
        style={{ 
          backgroundImage: "url('/img/banner_left.svg'), url('/img/banner_right.svg')",
          backgroundPosition: "top 50px left, top 50px right",
          backgroundSize: "25%, 25%",
          backgroundRepeat: "no-repeat, no-repeat"
        }}
      >
        <span data-role='block height' className='absolute top-3 right-6 text-xs text-gray-400'>
          164487
        </span>
        <div data-role='top banner title' className='text-center'>
          <p className='tracking-wider text-lg font-medium'>On-chain Pixel NFTs on <span className='text-cb-pink font-bold'>Kadena</span></p>
          <p className='my-6 leading-6'>Explore, Mint or Create your own pixel non fungible tokesn<br />with ColorBlock</p>
          <div className='flex justify-center space-x-6'>
            <button className='px-7 py-2 text-white bg-cb-pink border rounded-lg shadow'><a href='/create'>Create</a></button>
            <button className='px-7 py-2 bg-white border border-gray-300 rounded-lg shadow'><a href='/market'>Market</a></button>
          </div>
        </div>
      </div>
      <div data-role='featured collections' className='w-5/6 mx-auto mt-32 mb-12'>
        <div data-role='info' className='flex justify-between my-5 tracking-wider'>
          <div className='text-base'>
            Featured Collections
            <span className='ml-5 text-cb-pink text-sm'>Get Featured</span>
          </div>
          <div className='text-gray-400'>
            View More
          </div>
        </div>
        <Shelf entryList={collections} config={collectionShelfConfig} />
      </div>
      <div data-role='trending' className='w-5/6 mx-auto my-12'>
        <div data-role='info' className='flex justify-between my-5 tracking-wider'>
          <div className='text-base'>
            Trending
          </div>
          <div className='text-gray-400'>
            View More
          </div>
        </div>
        <Shelf entryList={items} config={itemShelfConfig} />
      </div>
      <div data-role='recently minted' className='w-5/6 mx-auto my-12'>
        <div data-role='info' className='flex justify-between my-5 tracking-wider'>
          <div className='text-base'>
            Recently Minted
          </div>
          <div className='text-gray-400'>
            View More
          </div>
        </div>
        <Shelf entryList={items} config={itemShelfConfig} />
      </div>
      <div data-role='view more' className='w-5/6 mx-auto my-20'>
        <button className='w-full py-3 border rounded-xl shadow hover-gray'>View More</button>
      </div>
      <div data-role='project highlight' className='w-5/6 mx-auto mt-40 flex justify-center text-center'>
        <div className='w-1/3 px-10 leading-6'>
          <p className='font-bold text-cb-pink mb-6 text-lg'>On-Chain</p>
          <p>All artwork associated with NFTs are located on chain. All NFTs are deployed on to Kadena's braided multi-chain proof of work network. A feature unique to ColorBlock.</p>
        </div>
        <div className='w-1/3 px-10 leading-6'>
          <p className='font-bold text-cb-pink mb-6 text-lg'>Low Fees</p>
          <p>Kadena's scalable multi chain network allows users to mint NFTs with very low fees.</p>
        </div>
        <div className='w-1/3 px-10 leading-6'>
          <p className='font-bold text-cb-pink mb-6 text-lg'>Secure</p>
          <p>All NFTs are deployed on chain to Kadena's braided multi-chain proof of work network. All artwork associated with NFTs are located on chain. A feature unique to ColorBlock.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;