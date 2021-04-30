import React from 'react';
import PropTypes from 'prop-types';

const HomePage = props => {
  return (
    <div>
      <div className='flex mx-6 mb-2 py-2 border-b justify-between text-xs'>
        <div className='font-bold text-base px-2 flex-none h-full'>
          COLORBLOCK
        </div>
        <div className='pl-10 flex'>
          <input
            className='border w-96 h-full px-3 text-xs placeholder-gray-500 placeholder-opacity-25'
            placeholder='Search collectibles, and stuff...'
          />
          <ul className='flex w-52 justify-between py-1 ml-4'>
            <li>Explore</li>
            <li>Collections</li>
            <li>Categories</li>
          </ul>
        </div>
        <div>
          <ul className='flex justify-between'>
            <li>
              <img className='w-6 h-6' src='/img/moon.png' alt='Moon' />
            </li>
            <li>
              <button
                className='rounded border border-black bg-black text-white py-0.5 w-20 ml-2'
              >
                Create
              </button>
            </li>
            <li>
              <button
                className='rounded border border-black py-0.5 w-20 ml-2'
              >
                Connect
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div>
        <div>
          <img className='w-2/4 m-auto' src='/img/main-page-bg.png' alt='Main' />
        </div>
        <div>
          <ul className='flex w-full justify-center space-x-10'>
            <li className='px-2 py-5 w-40 bg-gray-50'>
              <img className='w-12 h-12 m-auto m-2' src='/img/explore.png' alt='Explore' />
              <div className='text-center font-bold'>
                Explore
              </div>
              <div className='text-center text-xs text-gray-500'>
                Discover the countless pixel NFTs minted on ColorBlock
              </div>
            </li>
            <li className='px-2 py-5 w-40 bg-gray-50'>
              <img className='w-12 h-12 m-auto m-2'  src='/img/mint.png' alt='Mint' />
              <div className='text-center font-bold'>
                Mint
              </div>
              <div className='text-center text-xs text-gray-500'>
                Have an NFT designed? Mint in seconds!
              </div>
            </li>
            <li className='px-2 py-5 w-40 bg-gray-50'>
              <img className='w-12 h-12 m-auto m-2'  src='/img/create.png' alt='Create' />
              <div className='text-center font-bold'>
                Create
              </div>
              <div className='text-center text-xs text-gray-500'>
                Create and Deploy your own pixel NFT in our Creator!
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div>
        <div className='w-10/12 mx-auto mt-20'>
          <div className='font-bold text-lg'>
            Trending
          </div>
          <div>
            <ul className='flex'>
              {
                Array(5).fill(0).map(() => (
                  <li className='w-1/5 px-3'>
                    <img className='w-full' src='/img/grape.png' alt='Fruit 1' />
                    <div className='flex justify-between'>
                      <div className='text-xs text-left'>
                        <p>Kadena Fruit 1</p>
                        <p>Fruits #104</p>
                      </div>
                      <div className='text-xs text-right'>
                        <p>Pirce:</p>
                        <p>220.00 KDA</p>
                      </div>
                    </div>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
        <div className='w-10/12 m-auto mt-20'>
          <div className='font-bold text-lg'>
            Recently Minted
          </div>
          <div>
            <ul className='flex'>
              {
                Array(5).fill(0).map(() => (
                  <li className='w-1/5 px-3'>
                    <img className='w-full' src='/img/orange.png' alt='Fruit 2' />
                    <div className='flex justify-between'>
                      <div className='text-xs text-left'>
                        <p>Kadena Fruit 2</p>
                        <p>Fruits #105</p>
                      </div>
                      <div className='text-xs text-right'>
                        <p>Pirce:</p>
                        <p>210.00 KDA</p>
                      </div>
                    </div>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
        <div className='w-10/12 m-auto mt-20'>
          <div className='font-bold text-lg'>
            Recently Sold
          </div>
          <div>
            <ul className='flex'>
              {
                Array(5).fill(0).map(() => (
                  <li className='w-1/5 px-3'>
                    <img className='w-full' src='/img/watermelon.png' alt='Fruit 3' />
                    <div className='flex justify-between'>
                      <div className='text-xs text-left'>
                        <p>Kadena Fruit 3</p>
                        <p>Fruits #108</p>
                      </div>
                      <div className='text-xs text-right'>
                        <p>Pirce:</p>
                        <p>320.00 KDA</p>
                      </div>
                    </div>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      </div>
      <div className='border py-20 my-16 flex justify-center'>
        <div className='w-1/4 px-5'>
          <div className='font-bold text-xl leading-normal'>
            Design and mint your nft in seconds!
          </div>
          <div className='text-xs text-gray-400 leading-loose py-5'>
            Explore, Mint or Create your own digital non fungible tokens with ColorBlock
          </div>
          <div>
            <button className='bg-green-300 text-xs py-2 w-28 rounded shadow-2xl'>
              Mint NFTs
            </button>
          </div>
        </div>
        <img className='w-1/6' src='/img/creator.png' alt='Creator' />
      </div>
      <div className='flex text-xs justify-between w-10/12 mx-auto'>
        <div className='flex space-x-10'>
          <div>
            <p className='text-base font-bold pb-3'>Explore</p>
            <ul className='space-y-3 text-gray-500'>
              <li>Collections</li>
              <li>Trending</li>
              <li>Recently Listed</li>
              <li>Recently Sold</li>
            </ul>
          </div>
          <div>
            <p className='text-base font-bold pb-3'>Create</p>
            <ul className='space-y-3 text-gray-500'>
              <li>Mint NFT</li>
              <li>NFT Creator</li>
            </ul>
          </div>
          <div>
            <p className='text-base font-bold pb-3'>Account</p>
            <ul className='space-y-3 text-gray-500'>
              <li>My Listings</li>
              <li>My Sales</li>
            </ul>
          </div>
        </div>
        <div>
          <p className='text-base font-bold pb-3'>Support</p>
            <ul className='space-y-3 text-gray-500 text-right'>
            <li>Contact</li>
            <li>About</li>
            <li>FAQ</li>
          </ul>
        </div>
      </div>
      <div className='text-center pt-32 pb-10 text-xs text-gray-500'>
        ColorBlock | All Rights Reserved
      </div>
    </div>
  );
};

HomePage.propTypes = {

};

export default HomePage;
