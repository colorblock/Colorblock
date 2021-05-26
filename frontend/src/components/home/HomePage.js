import React from 'react';
import { serverUrl } from '../../config';

const HomePage = (props) => {
  return (
    <div data-role='home page' className='w-full px-10 text-xs'>
      <div data-role='home container' className='w-full bg-gray-50'>
        <div 
          data-role='top banner' 
          className='pt-20 h-60 mb-20'
          style={{ 
            backgroundImage: "url('/img/banner_left.svg'), url('/img/banner_right.svg')",
            backgroundPosition: "top 50px left, top 50px right",
            backgroundSize: "25%, 25%",
            backgroundRepeat: "no-repeat, no-repeat"
          }}
        >
          <div data-role='top banner title' className='text-center'>
            <p className='tracking-wider'>On-chain Pixel NFTs on <span className='text-pink-500'>Kadena</span></p>
            <p className='my-8 leading-5'>Explore, Mint or Create your own pixel non fungible tokesn<br />with ColorBlock</p>
            <div className='flex justify-center space-x-6'>
              <button className='px-7 py-2 text-white bg-pink border rounded-lg shadow'>Create</button>
              <button className='px-7 py-2 bg-white border border-gray-300 rounded-lg shadow'>Explore</button>
            </div>
          </div>
        </div>
        <div data-role='featured collections' className='w-5/6 mx-auto my-10'>
          <div data-role='info' className='flex justify-between my-5 tracking-wider'>
            <div>
              Featured Collections
              <span className='ml-5 text-pink-500'>Get Featured</span>
            </div>
            <div className='text-gray-400'>
              View More
            </div>
          </div>
          <ul data-role='blocks' className='flex justify-between space-x-4'>
            {
              Array(4).fill(0).map(() => (
                <li data-role='block container' className='w-1/4 h-44 px-4 py-4 border rounded border-gray-300 hover-gray'>
                  <div data-role='thumbnail' className='h-28 py-4 flex justify-center'>
                    <img className='h-full' src={`${serverUrl}/static/img/c246a25c421f7eb1.png`} alt='Fruit 2' />
                  </div>
                  <div data-role='brief' className='h-8 flex items-end'>
                    <div>
                      <p className='font-bold'>Collection 1</p>
                      <p>120 collectibles</p>
                    </div>
                  </div>
                </li>
              ))
            }
          </ul>
        </div>
        <div data-role='trending' className='w-5/6 mx-auto my-10'>
          <div data-role='info' className='flex justify-between my-5 tracking-wider'>
            <div>
              Trending
            </div>
            <div className='text-gray-400'>
              View More
            </div>
          </div>
          <ul data-role='blocks' className='flex justify-between space-x-4'>
            {
              Array(5).fill(0).map(() => (
                <li data-role='block container' className='w-1/5 h-52 px-4 py-4 border rounded border-gray-300 hover-gray'>
                  <div data-role='title and collection' className='h-8'>
                    <p>Example Cat</p>
                    <p className='text-gray-400'>ColorBlock Genesis</p>
                  </div>
                  <div data-role='thumbnail' className='h-28 py-4 flex justify-center'>
                    <img className='h-full' src={`${serverUrl}/static/img/c246a25c421f7eb1.png`} alt='Fruit 2' />
                  </div>
                  <div data-role='owner and price' className='h-8 flex items-end justify-between'>
                    <div>
                      <p>Owner</p>
                      <p>ebf4...dcdb</p>
                    </div>
                    <div className='text-right'>
                      <p>Price</p>
                      <p className='text-pink-500'>1000.0 KDA</p>
                    </div>
                  </div>
                </li>
              ))
            }
          </ul>
        </div>
        <div data-role='recently minted' className='w-5/6 mx-auto my-10'>
          <div data-role='info' className='flex justify-between my-5 tracking-wider'>
            <div>
              Recently Minted
            </div>
            <div className='text-gray-400'>
              View More
            </div>
          </div>
          <ul data-role='blocks' className='flex justify-between space-x-4'>
            {
              Array(5).fill(0).map(() => (
                <li data-role='block container' className='w-1/5 h-52 px-4 py-4 border rounded border-gray-300 hover-gray'>
                  <div data-role='title and collection' className='h-8'>
                    <p>Example Cat</p>
                    <p className='text-gray-400'>ColorBlock Genesis</p>
                  </div>
                  <div data-role='thumbnail' className='h-28 py-4 flex justify-center'>
                    <img className='h-full' src={`${serverUrl}/static/img/c246a25c421f7eb1.png`} alt='Fruit 2' />
                  </div>
                  <div data-role='owner and price' className='h-8 flex items-end justify-between'>
                    <div>
                      <p>Owner</p>
                      <p>ebf4...dcdb</p>
                    </div>
                    <div className='text-right'>
                      <p>Price</p>
                      <p className='text-pink-500'>1000.0 KDA</p>
                    </div>
                  </div>
                </li>
              ))
            }
          </ul>
        </div>
        <div data-role='view more' className='w-5/6 mx-auto my-16'>
          <button className='w-full py-3 font-bold shadow hover-gray'>View More</button>
        </div>
        <div data-role='project highlight' className='w-5/6 mx-auto mt-32 flex justify-center text-center'>
          <div className='w-1/3 px-10 leading-6'>
            <p className='font-bold text-pink-500 mb-6'>On-Chain</p>
            <p>All artwork associated with NFTs are located on chain. All NFTs are deployed on to Kadena's braided multi-chain proof of work network. A feature unique to ColorBlock.</p>
          </div>
          <div className='w-1/3 px-10 leading-6'>
            <p className='font-bold text-pink-500 mb-6'>Low Fees</p>
            <p>Kadena's scalable multi chain network allows users to mint NFTs with very low fees.</p>
          </div>
          <div className='w-1/3 px-10 leading-6'>
            <p className='font-bold text-pink-500 mb-6'>Secure</p>
            <p>All NFTs are deployed on chain to Kadena's braided multi-chain proof of work network. All artwork associated with NFTs are located on chain. A feature unique to ColorBlock.</p>
          </div>
        </div>
        <div data-role='footer nav' className='w-5/6 mx-auto mt-32 flex justify-between'>
          <ul className='space-y-3 text-gray-500'>
            <li className='hover:text-black'>Explore</li>
            <li className='hover:text-black'>Create</li>
            <li className='hover:text-black'>My Account</li>
          </ul>
          <ul className='space-y-3 text-gray-500 text-right'>
            <li className='hover:text-black'>FAQ</li>
            <li className='hover:text-black'>Help</li>
            <li className='hover:text-black'>Contact</li>
          </ul>
        </div>
        <div data-role='footer' className='w-5/6 mx-auto pt-10 pb-20 flex justify-between items-end'>
          <div className='w-1/3 text-gray-500'>
            Colorblock | All Rights Reserved
          </div>
          <div className='w-1/3 text-gray-500 text-center flex flex-col justify-center items-center'>
            <img src='/img/colorblock_gray_logo.svg' className='w-8 h-8' alt='logo-gray' />
            <p>002 nfts minted</p>
          </div>
          <div className='w-1/3 flex justify-end space-x-3'>
            <img src='/img/twitter.svg' className='w-4 h-4' alt='twitter' />
            <img src='/img/github.svg' className='w-4 h-4' alt='github' />
            <img src='/img/telegram.svg' className='w-4 h-4' alt='telegram' />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;